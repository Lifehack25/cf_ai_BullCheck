import { DurableObject } from 'cloudflare:workers';
import { SCBSpecialist } from './server/scb-agent';

// TOGGLE CACHE HERE
const ENABLE_CACHE = false;

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
	}

	async fetch(request: Request) {
		try {
			console.log('Agent Fetch Called');
			const url = new URL(request.url);

			if (url.pathname === '/history') {
				const history = this.sql
					.exec('SELECT role, content FROM messages ORDER BY created_at ASC')
					.toArray();
				return new Response(JSON.stringify(history));
			}

			if (url.pathname === '/chat') {
				if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

				const { message } = (await request.json()) as {
					message: { role: string; content: string };
				};

				// 1. Save User Message
				try {
					this.sql.exec(
						'INSERT INTO messages (role, content, created_at) VALUES (?, ?, ?)',
						message.role,
						message.content,
						Date.now()
					);
				} catch (err) {
					console.error('SQL Insert Failed:', err);
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
					console.error('Failed to fetch sources:', err);
					const message = err instanceof Error ? err.message : String(err);
					sourceContext = 'Error fetching sources: ' + message;
				}

				// 3. Build System Prompt with Tool Instructions

				// --- ORCHESTRATOR LOGIC ---
				// 1. ANALYSIS & REFINEMENT
				// We ask the LLM to classify and refine the question.
				const analysisPrompt = [
					{
						role: 'system',
						content: `You are the Orchestrator for "BullCheck", a strict verifiable statistics AI.
Your job is to screen and refine user questions.

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

				if (this.env.AI) {
					try {
						const res = await this.runLLM(analysisPrompt);
						let resStr =
							typeof res === 'string'
								? res
								: JSON.stringify((res as { response?: string }).response);

						// Clean up markdown code blocks if present
						resStr = resStr.replace(/```json\n?|\n?```/g, '').trim();

						try {
							// Try standard parse first
							const jsonMatch = resStr.match(/\{[\s\S]*\}/);
							if (jsonMatch) {
								let jsonStr = jsonMatch[0];

								// Attempt to fix common "lazy JSON" issues (unquoted keys)
								// This regex finds keys that are NOT quoted and wraps them in quotes
								// e.g. { action: "DATA" } -> { "action": "DATA" }
								jsonStr = jsonStr.replace(
									/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g,
									'$1"$2":'
								);

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
							// Fallback: if clearly mentions DATA & SCB, treat as DATA, otherwise reject safely.
							if (resStr.includes('DATA') || resStr.includes('SCB')) {
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

				console.log(`[Orchestrator] Action: ${action}, Source: ${selectedSource}, Query: ${refinedQuery}`);

				let finalResponse = '';

				if (action === 'DATA') {
					if (selectedSource === 'SCB') {
						// CALL SPECIALIST with REFINED QUERY
						if (!this.env.DB) throw new Error('DB binding missing for SCBSpecialist');

						const scbAgent = new SCBSpecialist(
							this.env.AI,
							this.env.DB,
							ENABLE_CACHE ? this.env.SOURCE_DATA_CACHE : undefined
						);
						const results = await scbAgent.resolve(refinedQuery);

						if (results && results.length > 0) {
							// We have data! Produce a deterministic answer from the retrieved data.
							finalResponse = this.buildDeterministicAnswer(results, message.content);
						} else {
							// Data path was selected but no supporting data could be retrieved.
							// Treat this as a rejection with guidance.
							finalResponse =
								rejectionReason ||
								"I could not find any matching statistics in the SCB database for your question as currently phrased. Please rephrase it as a specific, measurable question (for example: \"How many deaths were recorded in Sweden in 2015?\" or \"What was the CPI inflation rate in Sweden in 2020?\").";
						}
					} else {
						finalResponse = `Source '${selectedSource}' is not yet implemented in BullCheck. Please rephrase your question so it can be answered using an available official source such as SCB.`;
					}
				} else {
					// REJECTION PATHS (no free-form chat; no invented statistics)
					if (action === 'OFFTOPIC_REJECT') {
						finalResponse =
							rejectionReason ||
							`I am BullCheck, an AI assistant that only answers questions using official statistical data (for example from Statistics Sweden, SCB). I cannot chat about unrelated topics. Try asking a question like "How has CPI inflation in Sweden changed since 2015?" or "How many deaths were recorded in Sweden in 2020?".`;
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
					console.error('SQL Insert Failed:', err);
				}

				return new Response(JSON.stringify({ response: finalResponse }));
			}

			return new Response('Not Found', { status: 404 });
		} catch (err: unknown) {
			console.error('Agent Error:', err);
			const errorMessage = err instanceof Error ? err.message : String(err);
			return new Response(`Internal Error: ${errorMessage}`, { status: 500 });
		}
	}

	async runLLM(messages: any[]) {
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
		return await this.env.AI.run('@cf/meta/llama-3-8b-instruct', { messages: normalized });
	}

	private buildDeterministicAnswer(
		results: { value: number; year?: string; dataset?: string; table_id?: string; debug_query?: any }[],
		question: string
	): string {
		if (!results || results.length === 0) {
			return 'I could not find any matching statistics for your question.';
		}

		const isInflation = /\b(inflation|cpi)\b/i.test(question);
		const yearAgg = new Map<string, { sum: number; count: number }>();
		for (const row of results) {
			const value = Number(row.value);
			if (!Number.isFinite(value)) continue;
			const year = row.year ?? 'unknown';
			const current = yearAgg.get(year) ?? { sum: 0, count: 0 };
			yearAgg.set(year, { sum: current.sum + value, count: current.count + 1 });
		}

		const tableId = results[0].table_id ?? 'SCB';
		const dataset = results[0].dataset ?? 'SCB data';

		const selection = results[0].debug_query?.selection ?? [];
		const sexSel = selection.find((s: any) => s.dimension === 'Kon');
		const monthSel = selection.find((s: any) => s.dimension === 'Manad');
		const qualifiers: string[] = [];
		if (sexSel && Array.isArray(sexSel.items)) {
			qualifiers.push(sexSel.items.length > 1 ? 'both sexes' : `sex code ${sexSel.items[0]}`);
		}
		if (monthSel && Array.isArray(monthSel.items)) {
			qualifiers.push(monthSel.items.length >= 12 ? 'all months' : `month code ${monthSel.items[0]}`);
		}
		const qualifierText = qualifiers.length ? ` (${qualifiers.join(', ')})` : '';

		const years = Array.from(yearAgg.keys()).sort();
		if (years.length === 1) {
			const year = years[0];
			const agg = yearAgg.get(year) ?? { sum: 0, count: 0 };
			if (isInflation) {
				const avg = agg.count ? agg.sum / agg.count : 0;
				return `According to SCB table ${tableId} ("${dataset}"), the average monthly value for ${year}${qualifierText} is ${avg.toFixed(2)}.`;
			}
			const total = Math.round(agg.sum);
			return `According to SCB table ${tableId} ("${dataset}"), total deaths in Sweden for ${year}${qualifierText} were ${total.toLocaleString()}.`;
		}

		const parts = years
			.map((y) => {
				const agg = yearAgg.get(y) ?? { sum: 0, count: 0 };
				if (isInflation) {
					const avg = agg.count ? agg.sum / agg.count : 0;
					return `${y}: ${avg.toFixed(2)}`;
				}
				return `${y}: ${Math.round(agg.sum).toLocaleString()}`;
			})
			.join('; ');
		return `According to SCB table ${tableId} ("${dataset}"), ${isInflation ? 'average monthly values' : 'totals'} by year${qualifierText} are: ${parts}.`;
	}
}
