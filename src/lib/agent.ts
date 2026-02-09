import { DurableObject } from 'cloudflare:workers';
import { runWorkersAiGateway } from './server/ai-gateway';
import { SCBSpecialist } from './server/scb-agent';
import { buildAnswerPayload, buildDeterministicAnswer } from '$lib/server/agent-utils';

// Configuration constants
// Note: Consider moving these to environment variables for production flexibility
const ENABLE_DATA_CACHE = true; // Enable caching of SCB API responses
const ENABLE_METADATA_CACHE = true; // Enable caching of SCB metadata
const MESSAGE_RETENTION_DAYS = 30; // Delete messages older than 30 days to prevent unbounded storage growth

/**
 * BullCheck Agent (Durable Object)
 *
 * This is the core "brain" of the application. It is a stateful microservice
 * that persists conversation history and coordinates the AI logic.
 *
 * Capabilities:
 * - Persists chat history in SQLite (`this.sql`).
 * - Orchestrates the "ReAct" flow (Analyze -> Route -> Tool -> Answer).
 * - Manages context window and message pruning.
 */
export class BullCheckAgent extends DurableObject<Env> {
	sql: SqlStorage;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sql = this.ctx.storage.sql;
		this.sql.exec(`
			CREATE TABLE IF NOT EXISTS messages (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				role TEXT,
				content TEXT,
				created_at INTEGER
			)
		`);
		this.sql.exec(`
			CREATE TABLE IF NOT EXISTS state (
				key TEXT PRIMARY KEY,
				value TEXT
			)
		`);
	}

	/**
	 * HTTP Entry Point
	 *
	 * Handles incoming requests from the Worker.
	 * Implements the "Orchestrator" pattern:
	 * 1. Analyzes the user's intent (DATA vs CHAT vs OFF-TOPIC).
	 * 2. Routes to the appropriate specialist (SCBSpecialist) or fallback logic.
	 * 3. Aggregates results and generates a grounded response.
	 */
	async fetch(request: Request) {
		try {
			console.log('Agent Fetch Called');
			const url = new URL(request.url);

			// Periodically prune old messages (approximately every 100 requests)
			if (Math.random() < 0.01) {
				this.pruneOldMessages().catch((err) => console.error('Async prune failed:', err));
			}

			if (url.pathname === '/history') {
				const history = this.sql
					.exec('SELECT role, content FROM messages ORDER BY created_at ASC')
					.toArray();
				return new Response(JSON.stringify(history));
			}

			if (url.pathname === '/chat') {
				if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

				let message: { role: string; content: string };
				let userId: string | null | undefined;

				try {
					const body = (await request.json()) as {
						message?: { role?: string; content?: unknown };
						userId?: string;
					};

					// Validate message object
					if (!body.message || typeof body.message.content !== 'string') {
						return new Response(
							JSON.stringify({
								error: 'Invalid request: message.content must be a non-empty string'
							}),
							{ status: 400, headers: { 'Content-Type': 'application/json' } }
						);
					}

					message = body.message as { role: string; content: string };
					userId = body.userId ?? null;

					// Validate message content
					if (!message.content.trim()) {
						return new Response(
							JSON.stringify({ error: 'Invalid request: message content cannot be empty' }),
							{ status: 400, headers: { 'Content-Type': 'application/json' } }
						);
					}

					if (message.content.length > 5000) {
						return new Response(
							JSON.stringify({
								error: 'Invalid request: message exceeds maximum length of 5000 characters'
							}),
							{ status: 400, headers: { 'Content-Type': 'application/json' } }
						);
					}
				} catch (parseErr) {
					console.error('Request parsing error:', parseErr);
					return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
						status: 400,
						headers: { 'Content-Type': 'application/json' }
					});
				}
				const lastContext = this.getStateJson<{
					question: string;
					tableId: string;
					dataset: string;
					metricLabel: string | null;
					years: string[];
					unit: string | null;
				}>('last_context');

				// 1. Save User Message
				try {
					this.sql.exec(
						'INSERT INTO messages (role, content, created_at) VALUES (?, ?, ?)',
						message.role,
						message.content,
						Date.now()
					);
				} catch (err) {
					this.logError('Failed to save user message', err);
				}

				// 2. Fetch Sources from D1 (Available for Classification)
				let sourceContext = '';
				let sourceList: { key: string; organization: string; description: string }[] = [];
				try {
					if (!this.env.DB) throw new Error('DB binding missing');
					const sources = await this.env.DB.prepare(
						'SELECT key, organization, description FROM source WHERE is_enabled = 1'
					).all();
					if (sources.results && sources.results.length > 0) {
						sourceList = sources.results as {
							key: string;
							organization: string;
							description: string;
						}[];
						sourceContext =
							'AVAILABLE DATA SOURCES:\n' +
							sourceList
								.map((s) => `- [${s.key}]: ${s.organization} - ${s.description}`)
								.join('\n');
					}
				} catch (err: unknown) {
					this.logError('Failed to fetch sources', err);
					sourceContext = 'Note: Could not fetch available data sources at this time.';
				}

				// 3. Build System Prompt with Tool Instructions
				const history = this.getRecentMessages(20);
				const conversationContext = this.buildConversationContext(history, 1200);

				// --- ORCHESTRATOR LOGIC ---
				// 1. ANALYSIS & REFINEMENT
				// We ask the LLM to classify and refine the question.
				const analysisPrompt = [
					{
						role: 'system',
						content: `You are the Orchestrator for "BullCheck", a strict verifiable statistics AI.
Your job is to screen and refine user questions.

CONVERSATION CONTEXT (most recent at bottom):
${conversationContext || 'No prior messages.'}

LAST DATA CONTEXT (if available, no numbers):
${lastContext ? JSON.stringify(lastContext) : 'None'}

${sourceContext}

CLASSIFICATION RULES:
1. **DATA** (ACCEPTABLE STATISTICAL REQUEST): The user asks for a concrete statistical fact, metric, trend, or number that can be retrieved from one of the AVAILABLE DATA SOURCES.
   - ACTION: "DATA"
   - Select the most appropriate SOURCE KEY.
   - REFINEMENT: Improve the query for API search (remove fluff, focus on measurable concepts).
   - Example to SCB: "How is the economy?" -> "GDP, inflation and unemployment levels over time in Sweden"
   
2. **REPHRASE_REJECT** (Needs clearer statistical formulation): The user question is about the real world, but is too vague, causal, opinion based, or mixed with non-statistical parts.
   - ACTION: "REPHRASE_REJECT"
   - We DO NOT predict the future. We DO NOT explain "why". We ONLY report past/current data.
   - Example: "Why is crime rising?" (causal) -> REPHRASE_REJECT.
   - Example: "Will inflation go down?" (prediction) -> REPHRASE_REJECT.
   - Provide a short explanation of why the question cannot be answered as-is AND give a concrete suggestion for how to rephrase it as a measurable statistical question.

3. **OFFTOPIC_REJECT** (Completely off-topic small talk or non-statistical): Greetings only, "How are you?", jokes, or prompts that are not about anything that can be answered with official statistics.
   - ACTION: "OFFTOPIC_REJECT"
   - Explain briefly what BullCheck is (a statistics-only assistant based on official data).
   - Encourage the user to ask a question that CAN be answered with statistics and optionally give 1-2 example questions.

FOLLOW-UP HANDLING:
- If the user refers to a prior message (e.g., "that", "previous", "what about 2016?", "compare to last year"), infer the missing subject from context and produce a concrete statistical query.
- If a comparison is requested, include explicit years or a year range in the refined query when possible.
- If context is insufficient to infer the subject, choose "REPHRASE_REJECT" and ask for clarification.

// --- INTERNAL CLASSIFICATION FORMAT ---
// This JSON is used by the system to decide the next step (DATA vs CHAT).
// It is NOT the final response shown to the user.
OUTPUT FORMAT:
Return ONLY a valid JSON object. Do NOT include markdown formatting (like \`\`\`json).
{
  "action": "DATA" | "REPHRASE_REJECT" | "OFFTOPIC_REJECT",
  "source": "KEY (only for DATA, e.g. \\"SCB\\")",
  "query": "refined statistical question (for DATA)",
  "reason": "short natural language explanation for why the question was rejected or how it was interpreted"
}`
					},
					{ role: 'user', content: message.content }
				];

				let action = 'REPHRASE_REJECT';
				let refinedQuery = message.content;
				let rejectionReason = '';
				let selectedSource = 'SCB'; // Default

				const hasGatewayConfig =
					Boolean(this.env.AI_GATEWAY_ACCOUNT_ID) &&
					Boolean(this.env.AI_GATEWAY_ID) &&
					Boolean(this.env.AI_GATEWAY_TOKEN) &&
					Boolean(this.env.WORKERS_AI_TOKEN);

				if (hasGatewayConfig) {
					try {
						const res = await this.runLLM(analysisPrompt, userId);
						let resStr =
							typeof res === 'string' ? res : ((res as { response?: string }).response ?? '');

						// Clean up markdown code blocks if present
						resStr = resStr.replace(/```json\n?|\n?```/g, '').trim();

						try {
							// Try standard parse first
							const jsonMatch = resStr.match(/\{[\s\S]*\}/);
							if (jsonMatch) {
								let jsonStr = jsonMatch[0];

								// Strip JS-style comments if present
								jsonStr = jsonStr.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

								// Attempt to fix common "lazy JSON" issues (unquoted keys)
								// This regex finds keys that are NOT quoted and wraps them in quotes
								// e.g. { action: "DATA" } -> { "action": "DATA" }
								jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');

								// Also fix single quotes to double quotes
								jsonStr = jsonStr.replace(/'/g, '"');

								const analysis = JSON.parse(jsonStr);
								action = analysis.action || 'REPHRASE_REJECT';
								if (analysis.source) selectedSource = analysis.source;
								if (analysis.query) refinedQuery = analysis.query;
								if (analysis.reason) rejectionReason = analysis.reason;
							} else {
								throw new Error('No JSON found');
							}
						} catch (parseError) {
							console.warn('JSON Parse failed, attempting fallback logic:', parseError);
							// Fallback: heuristic classify if LLM output is malformed.
							const q = message.content.toLowerCase();
							const hasYear = /\b(18|19|20)\d{2}\b/.test(q);
							const dataKeyword =
								/\b(how many|number|total|average|mean|median|rate|percent|percentage|population|birth|death|divorc|marriage|unemployment|employment|inflation|cpi|gdp|salary|wage|income|rent|price|exports|imports|trade|electricity|energy|emissions|vehicle|immigration|emigration|migration|asylum)\b/.test(
									q
								);
							const followupCue =
								/\b(compare|vs|versus|difference|change|trend|what about|and|also|previous|last year|this year|that year|earlier|later)\b/.test(
									q
								);
							const priorUser = this.getLastUserMessage(history);
							const priorLooksData = priorUser
								? /\b(18|19|20)\d{2}\b/.test(priorUser.toLowerCase()) ||
									/\b(how many|number|total|average|mean|median|rate|percent|percentage|population|birth|death|divorc|marriage|unemployment|employment|inflation|cpi|gdp|salary|wage|income|rent|price|exports|imports|trade|electricity|energy|emissions|vehicle|immigration|emigration|migration|asylum)\b/.test(
										priorUser.toLowerCase()
									)
								: false;
							if ((hasYear && dataKeyword) || dataKeyword) {
								action = 'DATA';
							} else if (
								priorUser &&
								priorLooksData &&
								(followupCue || hasYear) &&
								q.length < 120
							) {
								action = 'DATA';
								refinedQuery = `${priorUser} ${message.content}`.trim();
							} else if (resStr.includes('DATA') || resStr.includes('SCB')) {
								action = 'DATA';
							} else {
								action = 'REPHRASE_REJECT';
							}
						}
					} catch (e) {
						console.error('LLM Call failed completely', e);
						// On total failure, fall back to a safe rejection.
						action = 'REPHRASE_REJECT';
					}
				}

				console.log(
					`[Orchestrator] Action: ${action}, Source: ${selectedSource}, Query: ${refinedQuery}`
				);

				let finalResponse = '';

				if (action === 'DATA') {
					if (selectedSource === 'SCB') {
						// CALL SPECIALIST with REFINED QUERY
						if (!this.env.DB) throw new Error('DB binding missing for SCBSpecialist');

						try {
							const scbAgent = new SCBSpecialist(
								(model, inputs) =>
									runWorkersAiGateway({
										env: this.env,
										model,
										inputs,
										userId
									}),
								this.env.DB,
								ENABLE_METADATA_CACHE ? this.env.SOURCE_METADATA_CACHE : undefined,
								ENABLE_DATA_CACHE ? this.env.SOURCE_RESPONSE_CACHE : undefined,
								ENABLE_DATA_CACHE
							);
							const results = await scbAgent.resolve(refinedQuery);

							if (results && Array.isArray(results) && results.length > 0) {
								const payload = buildAnswerPayload(results, message.content);
								const lastContextPayload = {
									question: payload.question,
									tableId: payload.tableId,
									dataset: payload.dataset,
									metricLabel: payload.metricLabel,
									years: payload.values.map((v) => v.year),
									unit: payload.unit
								};
								this.setStateJson('last_context', lastContextPayload);
								// We have data! Let the LLM present the data, but only from retrieved values.
								try {
									finalResponse = await this.buildLLMAnswer(
										results,
										message.content,
										this.buildConversationContext(history, 1200),
										userId
									);
								} catch (llmErr) {
									this.logError('LLM answer generation failed', llmErr, {
										question: message.content
									});
									finalResponse = buildDeterministicAnswer(results, message.content);
								}
							} else {
								// Data path was selected but no supporting data could be retrieved.
								// Treat this as a rejection with guidance.
								finalResponse =
									'I could not find any matching statistics in the SCB database for that question. Please rephrase it as a specific, measurable question that can be answered with SCB data. Example: "How many deaths were recorded in Sweden in 2015?" or "What was the CPI inflation rate in Sweden in 2020?"';
							}
						} catch (scbErr) {
							this.logError('SCB Specialist resolution failed', scbErr, { query: refinedQuery });
							const errorMsg = scbErr instanceof Error ? scbErr.message : String(scbErr);
							finalResponse = `An error occurred while retrieving data from SCB (${errorMsg}). Please try rephrasing your question as a specific measurable question about Swedish statistics.`;
						}
					} else {
						finalResponse = `Source '${selectedSource}' is not yet implemented in BullCheck. Please rephrase your question to use an available source such as SCB (Statistics Sweden). Try asking questions about Swedish statistics like population, births, deaths, inflation, or unemployment.`;
					}
				} else {
					// REJECTION PATHS (no free-form chat; no invented statistics)
					if (action === 'OFFTOPIC_REJECT') {
						finalResponse =
							rejectionReason ||
							`I am BullCheck, a statistics-only assistant grounded in official data (for example from Statistics Sweden, SCB). I cannot chat about unrelated topics, but I am happy to help with measurable questions. Try asking: "How has CPI inflation in Sweden changed since 2015?" or "How many deaths were recorded in Sweden in 2020?".`;
					} else {
						// Default: REPHRASE_REJECT
						finalResponse =
							rejectionReason ||
							`I can only answer questions that can be grounded in official statistics. Your question is currently too vague, causal, predictive, or opinion-based. Please rephrase it as a specific, measurable question, such as "How many X in Sweden in year Y?" or "What was the change in CPI inflation between 2015 and 2020?".`;
					}
				}

				// 4. Save Assistant Message
				try {
					this.sql.exec(
						'INSERT INTO messages (role, content, created_at) VALUES (?, ?, ?)',
						'assistant',
						finalResponse,
						Date.now()
					);
				} catch (err) {
					this.logError('Failed to save assistant message', err);
				}

				return new Response(JSON.stringify({ response: finalResponse }));
			}

			return new Response('Not Found', { status: 404 });
		} catch (err: unknown) {
			const errorMessage = this.logError('Agent.fetch', err);
			return new Response(JSON.stringify({ error: `Internal error: ${errorMessage}` }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	async runLLM(
		messages: { role: string; content: string | unknown[] | Record<string, unknown> }[],
		userId?: string | null
	) {
		const normalized = Array.isArray(messages)
			? messages.map((m) => {
					if (typeof m === 'string') {
						return { role: 'user', content: m };
					}
					const role = m.role ?? 'system';
					let content = m.content;
					if (Array.isArray(content)) content = JSON.stringify(content);
					if (content === undefined || content === null) content = '';
					if (typeof content !== 'string') content = JSON.stringify(content);
					return { role, content };
				})
			: messages;
		return await runWorkersAiGateway({
			env: this.env,
			model: '@cf/meta/llama-3-8b-instruct',
			inputs: { messages: normalized },
			userId
		});
	}

	private async buildLLMAnswer(
		results: {
			value: number;
			year?: string;
			dataset?: string;
			table_id?: string;
			debug_query?: Record<string, unknown>;
		}[],
		question: string,
		context?: string,
		userId?: string | null
	): Promise<string> {
		const payload = buildAnswerPayload(results, question);
		const system =
			'You are BullCheck. Answer using ONLY the provided data. Keep a friendly, conversational tone. You may add brief educational context or definitions, but do not introduce any new numbers, dates, or facts not present in the data. Always mention the SCB table id and dataset title. If the question is about a single year, give the value and a short explanatory sentence. If multiple years exist, summarize the trend using the provided values and then list the values succinctly. If the dataset scope is narrower than the question (e.g., sector/region), clearly note that scope. If a unit is provided, include it with each value. End with one short follow-up question inviting a related statistical comparison or trend.';
		const user = `${context ? `Conversation context:\n${context}\n\n` : ''}Question: ${payload.question}\nData (JSON): ${JSON.stringify(
			payload
		)}`;
		const res = (await this.runLLM(
			[
				{ role: 'system', content: system },
				{ role: 'user', content: user }
			],
			userId
		)) as { response?: string };
		let text = res?.response?.trim();
		const unitLabel = payload.unit as string | null | undefined;
		if (!text) return buildDeterministicAnswer(results, question);
		text = this.ensureUnitInAnswer(text, unitLabel ?? null);
		return text;
	}

	private ensureUnitInAnswer(answer: string, unitLabel: string | null): string {
		if (!unitLabel) return answer;
		const unitLower = unitLabel.toLowerCase();
		if (answer.toLowerCase().includes(unitLower)) return answer;
		return `${answer} All figures are in ${unitLabel}.`;
	}

	private getRecentMessages(limit: number): { role: string; content: string }[] {
		try {
			const rows = this.sql
				.exec('SELECT role, content FROM messages ORDER BY created_at DESC LIMIT ?', limit)
				.toArray() as { role: string; content: string }[];
			return rows.reverse();
		} catch (err) {
			this.logError('Failed to load conversation history', err, { limit });
			return [];
		}
	}

	private getLastUserMessage(messages: { role: string; content: string }[]): string | null {
		for (let i = messages.length - 1; i >= 0; i -= 1) {
			if (messages[i].role === 'user') return messages[i].content;
		}
		return null;
	}

	private buildConversationContext(
		messages: { role: string; content: string }[],
		maxChars: number
	) {
		if (!messages.length || maxChars <= 0) return '';
		const lines: string[] = [];
		let total = 0;
		for (let i = messages.length - 1; i >= 0; i -= 1) {
			const roleLabel = messages[i].role === 'assistant' ? 'Assistant' : 'User';
			const line = `${roleLabel}: ${messages[i].content}`;
			if (total + line.length + 1 > maxChars) break;
			lines.push(line);
			total += line.length + 1;
		}
		return lines.reverse().join('\n');
	}

	private getState(key: string): string | null {
		try {
			const rows = this.sql.exec('SELECT value FROM state WHERE key = ?', key).toArray() as {
				value: string;
			}[];
			return rows.length ? rows[0].value : null;
		} catch (err) {
			this.logError('Failed to read persisted state', err, { key });
			return null;
		}
	}

	private getStateJson<T>(key: string): T | null {
		const raw = this.getState(key);
		if (!raw) return null;
		try {
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}

	private setStateJson<T>(key: string, value: T) {
		try {
			this.sql.exec(
				'INSERT OR REPLACE INTO state (key, value) VALUES (?, ?)',
				key,
				JSON.stringify(value)
			);
		} catch (err) {
			this.logError('Failed to persist state', err, { key });
		}
	}

	/**
	 * Logs errors consistently with context information
	 */
	private logError(
		context: string,
		error: unknown,
		additionalInfo?: Record<string, unknown>
	): string {
		const errorMsg = error instanceof Error ? error.message : String(error);
		const message = `[${context}] ${errorMsg}`;
		const logData = additionalInfo ? { ...additionalInfo, error: errorMsg } : { error: errorMsg };
		console.error(message, logData);
		return errorMsg;
	}

	/**
	 * Removes messages older than MESSAGE_RETENTION_DAYS to prevent unbounded storage growth
	 * Called periodically to maintain Durable Object performance
	 */
	private async pruneOldMessages(): Promise<void> {
		try {
			const cutoffTime = Date.now() - MESSAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
			this.sql.exec('DELETE FROM messages WHERE created_at < ?', cutoffTime);
			console.log(`Pruned messages older than ${MESSAGE_RETENTION_DAYS} days`);
		} catch (err) {
			this.logError('Failed to prune old messages', err, { retentionDays: MESSAGE_RETENTION_DAYS });
		}
	}
}
