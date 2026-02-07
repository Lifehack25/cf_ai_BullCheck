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
1. **DATA** (Statistical Request): The user asks for a factual metric, trend, or number that can be retrieved from one of the AVAILABLE DATA SOURCES.
   - ACTION: Select the most appropriate SOURCE KEY.
   - REFINEMENT: Improve the query for API search (remove fluff, focus on keywords).
   - Example to SCB: "How is the economy?" -> "GDP Inflation Unemployment"
   
2. **REJECT** (Opinion/Cause/Vague/Predictions): The user asks "Why", "Future", "Predictions", "Opinions" or subjective questions.
   - We DO NOT predict the future. We DO NOT explain "why". We ONLY report past/current data.
   - Example: "Why is crime rising?" -> REJECT (Causality)
   - Example: "Will inflation go down?" -> REJECT (Prediction)
   - ACTION: Reject the question.

3. **CHAT** (General): Greetings, "Who are you?", "Help", or meta-questions.
   - ACTION: Answer normally.

// --- INTERNAL CLASSIFICATION FORMAT ---
// This JSON is used by the system to decide the next step (DATA vs CHAT).
// It is NOT the final response shown to the user.
OUTPUT FORMAT:
Return ONLY a valid JSON object. Do NOT include markdown formatting (like \`\`\`json).
{
  "action": "DATA" | "REJECT" | "CHAT",
  "source": "KEY" (only for DATA),
  "query": "string (for DATA)",
  "reason": "string (for REJ/CHAT)"
}`
					},
					{ role: 'user', content: message.content }
				];

				let action = 'CHAT';
				let refinedQuery = message.content;
				let rejectionReason = '';
				let selectedSource = 'SCB'; // Default

				if (this.env.AI) {
					try {
						const res = await this.runLLM(analysisPrompt);
						let resStr = typeof res === 'string' ? res : JSON.stringify((res as { response?: string }).response);

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
								jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');

								// Also fix single quotes to double quotes
								jsonStr = jsonStr.replace(/'/g, '"');

								const analysis = JSON.parse(jsonStr);
								action = analysis.action;
								if (analysis.source) selectedSource = analysis.source;
								if (analysis.query) refinedQuery = analysis.query;
								if (analysis.reason) rejectionReason = analysis.reason;
							} else {
								throw new Error("No JSON found");
							}
						} catch (parseError) {
							console.warn('JSON Parse failed, attempting fallback logic:', parseError);
							// Fallback: Check for keywords in the raw string if parsing failed
							if (resStr.includes('DATA') || resStr.includes('SCB')) {
								action = 'DATA';
							}
						}
					} catch (e) {
						console.error('LLM Call failed completely', e);
					}
				}

				console.log(`[Orchestrator] Action: ${action}, Source: ${selectedSource}, Query: ${refinedQuery}`);

				let finalResponse = '';

				if (action === 'REJECT') {
					finalResponse =
						rejectionReason ||
						"I can only provide specific statistical data from official sources. I cannot give opinions, explain causes, or make predictions.";
				} else if (action === 'DATA') {
					if (selectedSource === 'SCB') {
						// CALL SPECIALIST with REFINED QUERY
						if (!this.env.DB) throw new Error("DB binding missing for SCBSpecialist");

						const scbAgent = new SCBSpecialist(
							this.env.AI,
							this.env.DB,
							ENABLE_CACHE ? this.env.SOURCE_DATA_CACHE : undefined
						);
						const results = await scbAgent.resolve(refinedQuery);

						if (results && results.length > 0) {
							// We have data! Generate final answer.
							const answerPrompt = [
								{
									content: `You are BullCheck.
You have retrieved strict statistical data from ${selectedSource}.
User Question: "${message.content}"
Retrieved Data:
${JSON.stringify(results, null, 2)}

Task: Answer the user's question using ONLY the retrieved data.
- State the answer clearly.
- Cite the source table and year.
- If data is partial, explain what is available.
- Be concise (max 3 sentences).`
								}
							];
							const ans = await this.runLLM(answerPrompt);
							finalResponse = (ans as { response: string }).response;
						} else {
							finalResponse = "I could not find relevant data in the SCB database for your query.";
						}
					} else {
						finalResponse = `Source '${selectedSource}' is not yet implemented.`;
					}
				} else {
					// Chat Action
					const chatPrompt = [
						{
							role: 'system',
							content: `You are BullCheck, a helpful statistical assistant.
User Question: "${message.content}"
Task: chat helpfully. Do not make up statistics.`
						}
					];
					const ans = await this.runLLM(chatPrompt);
					finalResponse = (ans as { response: string }).response;
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
		return await this.env.AI.run('@cf/meta/llama-3-8b-instruct', { messages });
	}
}
