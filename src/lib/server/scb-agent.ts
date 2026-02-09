import { drizzle } from 'drizzle-orm/d1';
import { scb_tables } from './db/schema';
import type { D1Database } from '@cloudflare/workers-types';

const BASE_URL = 'https://statistikdatabasen.scb.se/api/v2';

type AiRun = (model: string, inputs: unknown) => Promise<unknown>;

export interface SCBResult {
	value: number;
	unit: string;
	label: string;
	year: string;
	source: string;
	dataset: string;
	debug_query?: SCBQuery | Record<string, unknown>;
	table_id: string;
}

export interface SCBTable {
	id: string;
	title: string;
	description: string | null;
	api_path: string;
	keywords?: string | null;
}

interface SCBVariable {
	id: string;
	text: string;
	values: string[];
	valueTexts: string[];
	comment?: string;
	elimination?: boolean;
	time?: boolean;
}

interface SCBMetadata {
	title: string;
	variables: SCBVariable[];
	dimension?: Record<
		string,
		{
			label?: string;
			category?: { index?: Record<string, number>; label?: Record<string, string> };
		}
	>;
}

interface SCBSelection {
	dimension: string;
	items: string[];
	metric?: string; // legacy support
}

interface SCBQuery {
	selection: SCBSelection[];
	contentsLabel?: string;
	contentsCode?: string;
	[key: string]: unknown;
}

export class SCBSpecialist {
	private aiRun: AiRun;
	private db: ReturnType<typeof drizzle>;
	private metadataKv?: KVNamespace;
	private responseKv?: KVNamespace;
	private enableDataCache: boolean;

	constructor(
		aiRun: AiRun,
		d1: D1Database,
		metadataKv?: KVNamespace,
		responseKv?: KVNamespace,
		enableDataCache = false
	) {
		this.aiRun = aiRun;
		this.db = drizzle(d1);
		this.metadataKv = metadataKv;
		this.responseKv = responseKv;
		this.enableDataCache = enableDataCache;
	}

	/**
	 * Main Entry Point: Deterministic Workflow
	 */
	async resolve(question: string): Promise<SCBResult[] | null> {
		console.log(`[SCBSpecialist] Resolving: "${question}"`);
		// STEP 1: Search LOCALLY in D1 (Deterministic, no hallucinations)
		const tables = await this.searchLocal(question);

		// Fallback: If local search fails, maybe try very specific exact match or fail?
		// User said: "AI -> searches OUR indexed SCB tables".
		// If empty, we fail.
		if (tables.length === 0) {
			console.log('[SCBSpecialist] No matching tables in local index.');
			return null;
		}

		// STEP 2: Select Best Table (LLM, restricted to found set)
		const tableId = await this.selectTable(question, tables);
		if (!tableId || tableId === 'NONE') return null;

		const bestTable = tables.find((t) => t.id === tableId)!;
		console.log(`[SCBSpecialist] Selected: ${bestTable.id} - ${bestTable.title}`);

		// STEP 3: Get Metadata (Fetch fresh from API to ensure validity)
		const metadata = await this.getMetadata(bestTable.id, bestTable.api_path);
		if (!metadata) return null;

		// STEP 4: Build Query (Strict Mapping)
		const apiQuery = await this.mapQuery(question, metadata);
		if (!apiQuery) return null;
		console.log(`[SCBSpecialist] Query:`, JSON.stringify(apiQuery));

		// STEP 5: Fetch Data
		const data = await this.fetchData(bestTable.id, bestTable.api_path, apiQuery);
		if (!data || data.length === 0) return null;

		// STEP 6: Format Output
		return this.formatResults(data, bestTable.title, bestTable.id, apiQuery, metadata);
	}

	// --- INTERNAL STEPS ---

	/**
	 * Deterministic local search against the curated SCB tables.
	 *
	 * We avoid using the LLM here to prevent hallucinated table choices:
	 * - Tokenise the user's question.
	 * - Score each table by overlap with its title + keywords.
	 * - Return the best‑scoring tables; if all scores are zero, return [].
	 */
	private async searchLocal(question: string): Promise<SCBTable[]> {
		const allTables = (await this.db.select().from(scb_tables).all()) as SCBTable[];
		if (!allTables.length) return [];

		const stopwords = new Set([
			'a',
			'an',
			'the',
			'and',
			'or',
			'for',
			'to',
			'in',
			'on',
			'of',
			'by',
			'with',
			'without',
			'how',
			'many',
			'what',
			'is',
			'are',
			'was',
			'were',
			'did',
			'does',
			'do',
			'got',
			'get',
			'number',
			'total',
			'per',
			'year',
			'years',
			'month',
			'months'
		]);

		const tokens = question
			.toLowerCase()
			.split(/[^a-z0-9]+/g)
			.filter(Boolean)
			.filter((t) => !stopwords.has(t));

		if (tokens.length === 0) return [];

		const scored = allTables.map((row) => {
			const titleTokens =
				(row.title as string | null)
					?.toLowerCase()
					.split(/[^a-z0-9]+/g)
					.filter(Boolean) ?? [];

			let keywordTokens: string[] = [];
			if (row.keywords) {
				try {
					const parsed = JSON.parse(row.keywords as string) as string[];
					keywordTokens = parsed.flatMap((k) =>
						k
							.toLowerCase()
							.split(/[^a-z0-9]+/g)
							.filter(Boolean)
					);
				} catch {
					keywordTokens = (row.keywords as string)
						.toLowerCase()
						.split(/[^a-z0-9]+/g)
						.filter(Boolean);
				}
			}

			const allTokens = [...titleTokens, ...keywordTokens];
			const uniqueTokens = new Set(allTokens);
			let score = 0;
			for (const t of tokens) {
				if (uniqueTokens.has(t)) score += 1;
			}

			return { row, score };
		});

		const maxScore = scored.reduce((m, s) => (s.score > m ? s.score : m), 0);
		if (maxScore === 0) {
			console.log('[SCBSpecialist] No overlapping keywords for question; returning no tables.');
			return [];
		}

		const best = scored.filter((s) => s.score === maxScore).map((s) => s.row);
		console.log(
			`[SCBSpecialist] Local search: selected ${best.length} table(s) with score ${maxScore}`
		);
		return best as unknown as SCBTable[];
	}

	private async selectTable(question: string, tables: SCBTable[]): Promise<string | null> {
		if (tables.length === 1) return tables[0].id;

		const prompt = `
        User Question: "${question}"
        Candidates:
        ${tables.map((t) => `- [${t.id}] ${t.title}: ${t.description}`).join('\n')}
        
        Task: Select the most relevant table ID.
        Output: ID only (e.g. TAB4392). If none, "NONE".
        `;

		try {
			const res = (await this.aiRun('@cf/meta/llama-3-8b-instruct', {
				messages: [{ role: 'system', content: prompt }]
			})) as { response: string };
			const text = res.response.trim();
			const match = text.match(/TAB\d+/);
			return match ? match[0] : text.includes('NONE') ? null : tables[0].id;
		} catch {
			return tables[0].id;
		}
	}

	private async getMetadata(id: string, apiPath: string) {
		const cacheKey = `source:scb:meta:${id}`;
		if (this.metadataKv) {
			const cached = await this.metadataKv.get<SCBMetadata>(cacheKey, 'json');
			if (cached) {
				console.log(`[SCBSpecialist] Metadata cache HIT for ${id}`);
				return cached;
			}
		}

		const metaUrl = `${BASE_URL}/${apiPath}/metadata?lang=en`;
		const metaRes = await fetch(metaUrl);
		if (!metaRes.ok) return null;
		const metadata = (await metaRes.json()) as SCBMetadata; // JSON-stat2

		if (this.metadataKv) {
			await this.metadataKv.put(cacheKey, JSON.stringify(metadata), { expirationTtl: 604800 }); // 7 days
			console.log(`[SCBSpecialist] Metadata cache SET for ${id}`);
		}

		return metadata;
	}

	private async mapQuery(question: string, metadata: SCBMetadata) {
		// Deterministic mapping only: avoid LLM here for speed and reliability.
		return this.normaliseSelectionQuery(question, metadata, null);
	}

	/**
	 * Normalise a loose LLM-generated selection into a strict, metadata-backed query.
	 * - Ensures only valid codes are used.
	 * - Expands "ALL" placeholders to actual value lists.
	 * - Picks the correct ContentsCode for deaths / births / CPI based on the question text.
	 */
	private normaliseSelectionQuery(
		question: string,
		metadata: SCBMetadata,
		rawQuery: SCBQuery | null
	): SCBQuery | null {
		const lowerQ = question.toLowerCase();

		// 1. Convert metadata into a simple "variables" view.
		let variables:
			| {
				id: string;
				text: string;
				values: string[];
				valueTexts: string[];
			}[]
			| null = null;

		if (Array.isArray(metadata?.variables)) {
			variables = metadata.variables.map((v) => ({
				id: v.id,
				text: v.text,
				values: v.values,
				valueTexts: (v.valueTexts ?? v.values) as string[]
			}));
		} else if (metadata?.dimension) {
			const dims = metadata.dimension as Record<
				string,
				{
					label?: string;
					category?: { index?: Record<string, number>; label?: Record<string, string> };
				}
			>;
			variables = Object.entries(dims).map(([id, dim]) => {
				const idx = dim.category?.index ?? {};
				const lbl = dim.category?.label ?? {};
				const codes = Object.keys(idx).sort((a, b) => idx[a] - idx[b]);
				return {
					id,
					text: dim.label ?? id,
					values: codes,
					valueTexts: codes.map((c) => lbl[c] ?? c)
				};
			});
		}

		if (!variables) {
			console.warn('[SCBSpecialist] Could not derive variables from metadata.');
			return null;
		}

		const findVar = (predicate: (v: NonNullable<typeof variables>[number]) => boolean) =>
			variables!.find(predicate);

		const selection: SCBSelection[] = rawQuery?.selection ?? [];

		// Index by dimension for easier updates.
		const byDim = new Map<string, SCBSelection>();
		for (const sel of selection) {
			const dimName = sel.dimension ?? sel.metric;
			if (!dimName) continue;
			const normalised = { dimension: dimName, items: (sel.items ?? []) as string[] };
			byDim.set(dimName, normalised);
		}

		// Helper to either get or create a selection entry for a dim.
		const ensureSelection = (dimId: string): { dimension: string; items: string[] } => {
			if (byDim.has(dimId)) return byDim.get(dimId)!;
			const created = { dimension: dimId, items: [] as string[] };
			byDim.set(dimId, created);
			selection.push(created);
			return created;
		};

		// 2. ContentsCode / metric dimension
		const contentsVar = findVar(
			(v) =>
				v.id === 'ContentsCode' ||
				/content|observation|measure/i.test(v.text) ||
				v.text.toLowerCase().includes('contentscode')
		);
		let chosenContentsLabel: string | null = null;
		let chosenContentsCode: string | null = null;
		if (contentsVar) {
			try {
				console.log(
					'[SCBSpecialist] Contents metadata:',
					JSON.stringify({
						id: contentsVar.id,
						text: contentsVar.text,
						values: contentsVar.values,
						valueTexts: contentsVar.valueTexts
					})
				);
			} catch {
				// ignore logging failures
			}
			let chosen = contentsVar.values[0];
			let chosenLabel = contentsVar.valueTexts[0] ?? contentsVar.values[0];
			let matched = false;
			const pick = (idx: number) => {
				chosen = contentsVar.values[idx];
				chosenLabel = contentsVar.valueTexts[idx] ?? contentsVar.values[idx];
				matched = true;
			};
			contentsVar.valueTexts.forEach((label, idx) => {
				const l = label.toLowerCase();
				if (!matched && (lowerQ.includes('inflation') || lowerQ.includes('cpi'))) {
					if (l.includes('annual')) pick(idx);
					if (!matched && l.includes('monthly') && /\b(month|monthly)\b/i.test(question)) pick(idx);
					if (!matched && (l.includes('cpi') || l.includes('inflation'))) pick(idx);
				}
				if (!matched && /\bdivorc/.test(lowerQ) && l.includes('divorce')) pick(idx);
				if (!matched && /\b(marriage|married|wedding|wed)\b/.test(lowerQ) && l.includes('marriage'))
					pick(idx);
				if (
					!matched &&
					/\b(salary|wage|pay|earnings|income)\b/.test(lowerQ) &&
					(l.includes('salary') || l.includes('wage') || l.includes('pay') || l.includes('earn'))
				)
					pick(idx);
				if (!matched && lowerQ.includes('death') && l.includes('death')) pick(idx);
				if (!matched && lowerQ.includes('birth') && l.includes('birth')) pick(idx);
				if (
					!matched &&
					/\bimmigra/.test(lowerQ) &&
					(l.includes('immigration') || l.includes('immigr'))
				)
					pick(idx);
				if (
					!matched &&
					/\bemigra/.test(lowerQ) &&
					(l.includes('emigration') || l.includes('emigr'))
				)
					pick(idx);
				if (!matched && /\bcitizen/.test(lowerQ) && l.includes('citizenship')) pick(idx);
				if (
					!matched &&
					(lowerQ.includes('population') ||
						lowerQ.includes('people') ||
						lowerQ.includes('residents')) &&
					l.includes('population')
				)
					pick(idx);
			});
			const sel = ensureSelection(contentsVar.id);
			sel.items = [chosen];
			chosenContentsLabel = chosenLabel;
			chosenContentsCode = chosen;
		}

		// 3. Time dimension (Tid / Year or Month)
		const timeVar = findVar(
			(v) => v.id === 'Tid' || /year|tid|time/i.test(v.id) || /year|tid|time/i.test(v.text)
		);
		if (timeVar) {
			const isMonthly = timeVar.values.some((v) => /^\d{4}M\d{2}$/.test(v));
			const sel = ensureSelection(timeVar.id);
			const yearMatches = question.match(/\b(18|19|20)\d{2}\b/g) ?? [];
			const rangeMatch = question.match(
				/\b((?:18|19|20)\d{2})\s*(?:-|to|–|—)\s*((?:18|19|20)\d{2})\b/
			);

			const requestedYears: string[] = [];
			if (rangeMatch) {
				const start = Number.parseInt(rangeMatch[1], 10);
				const end = Number.parseInt(rangeMatch[2], 10);
				const [from, to] = start <= end ? [start, end] : [end, start];
				for (let y = from; y <= to; y += 1) requestedYears.push(String(y));
			} else if (yearMatches.length > 0) {
				const seen = new Set<string>();
				for (const year of yearMatches) {
					if (!seen.has(year)) {
						seen.add(year);
						requestedYears.push(year);
					}
				}
			}

			const selectTimeValuesForYears = (years: string[]) => {
				if (isMonthly) {
					const yearSet = new Set(years);
					return timeVar.values.filter((v) => yearSet.has(v.substring(0, 4)));
				}
				const yearSet = new Set(years);
				return timeVar.values.filter((v) => yearSet.has(v));
			};

			if (requestedYears.length > 0) {
				const selected = selectTimeValuesForYears(requestedYears);
				if (selected.length === 0) {
					console.warn(
						`[SCBSpecialist] Requested years ${requestedYears.join(
							', '
						)} not available in time dimension.`
					);
					return null;
				}
				sel.items = selected;
			} else {
				if (isMonthly) {
					// Pick the latest available year and select all months for that year.
					const latest = timeVar.values[timeVar.values.length - 1];
					const latestYear = latest.substring(0, 4);
					sel.items = timeVar.values.filter((v) => v.startsWith(`${latestYear}M`));
				} else {
					sel.items = [timeVar.values[timeVar.values.length - 1]];
				}
			}
		}

		// 4. Month dimension (Manad / Month) -> ALL valid months
		const monthVar = findVar(
			(v) =>
				v.id === 'Manad' || /month|månad|manad/i.test(v.id) || /month|månad|manad/i.test(v.text)
		);
		if (monthVar && (!timeVar || monthVar.id !== timeVar.id)) {
			const sel = ensureSelection(monthVar.id);
			sel.items = monthVar.values.slice(); // all months
		}

		// 5. Sex dimension (Kon / Sex) -> ALL sexes
		const sexVar = findVar(
			(v) => v.id === 'Kon' || /sex|kön|kon/i.test(v.id) || /sex|kön|kon/i.test(v.text)
		);
		if (sexVar) {
			const sel = ensureSelection(sexVar.id);
			const wantsMale = /\b(men|male|man|boys)\b/i.test(question);
			const wantsFemale = /\b(women|female|woman|girls)\b/i.test(question);

			if (wantsMale && !wantsFemale) {
				const idx = sexVar.valueTexts.findIndex((t) => /men|male|man/i.test(t));
				sel.items = idx >= 0 ? [sexVar.values[idx]] : [sexVar.values[0]];
			} else if (wantsFemale && !wantsMale) {
				const idx = sexVar.valueTexts.findIndex((t) => /women|female|woman/i.test(t));
				sel.items = idx >= 0 ? [sexVar.values[idx]] : [sexVar.values[0]];
			} else {
				// Default: prefer total/both sexes if available to avoid double counting.
				const totalIdx = sexVar.valueTexts.findIndex((t) =>
					/total|both|all|men and women|both sexes|sexes/i.test(t)
				);
				if (totalIdx >= 0) {
					sel.items = [sexVar.values[totalIdx]];
				} else if (sexVar.values.includes('1+2')) {
					sel.items = ['1+2'];
				} else if (sexVar.values.includes('T')) {
					sel.items = ['T'];
				} else {
					sel.items = sexVar.values.slice();
				}
			}
		}

		// 6. Region dimension: if present, prefer Sweden ("00") or otherwise first value
		const regionVar = findVar(
			(v) =>
				v.id === 'Region' ||
				/region|area|county|kommun/i.test(v.id) ||
				/region|area|county|kommun/i.test(v.text)
		);
		if (regionVar) {
			const sel = ensureSelection(regionVar.id);
			const q = question.toLowerCase();
			const normalize = (s: string) =>
				s
					.toLowerCase()
					.replace(/\b(county|region|län|lan|municipality|kommun|city|stad)\b/g, '')
					.replace(/\s+/g, ' ')
					.trim();

			let region = regionVar.values[0];
			let matched = false;
			regionVar.valueTexts.forEach((label, idx) => {
				const labelText = label?.toLowerCase() ?? '';
				const labelNorm = normalize(labelText);
				if (!matched && labelNorm && q.includes(labelNorm)) {
					region = regionVar.values[idx];
					matched = true;
				}
				if (!matched && labelText && q.includes(labelText)) {
					region = regionVar.values[idx];
					matched = true;
				}
				if (!matched && (regionVar.values[idx] === '00' || labelText.includes('sweden'))) {
					region = regionVar.values[idx];
				}
			});
			sel.items = [region];
		}

		// 7. Ensure all required dimensions are present (fallback to first value).
		for (const v of variables) {
			if (byDim.has(v.id)) continue;
			let chosen = v.values[0];
			if (
				(v.id === 'EkoIndikator' || /indicator/i.test(v.text)) &&
				(lowerQ.includes('inflation') || lowerQ.includes('cpi'))
			) {
				const idx = v.valueTexts.findIndex((t) => /consumer price index|cpi/i.test(t));
				if (idx >= 0) chosen = v.values[idx];
			}
			const sel = ensureSelection(v.id);
			sel.items = [chosen];
		}

		const normalised: SCBQuery = { selection: Array.from(byDim.values()) };
		if (chosenContentsLabel) normalised.contentsLabel = chosenContentsLabel;
		if (chosenContentsCode) normalised.contentsCode = chosenContentsCode;
		console.log('[SCBSpecialist] Normalised query:', JSON.stringify(normalised));
		return normalised;
	}

	private async fetchData(id: string, apiPath: string, query: SCBQuery) {
		// Convert our internal selection to SCB v2 Selection format.
		const selection: { VariableCode: string; ValueCodes: string[] }[] = [];
		if (query && Array.isArray(query.selection)) {
			for (const sel of query.selection) {
				const dim = sel.dimension ?? sel.metric;
				if (!dim || !sel.items) continue;
				selection.push({ VariableCode: dim, ValueCodes: sel.items as string[] });
			}
		}

		// Cache key based on selection
		const queryStr = JSON.stringify(selection);
		const msgUint8 = new TextEncoder().encode(queryStr);
		const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
		const cacheKey = `source:scb:v2:custom:${id}:${hashHex}`;

		if (this.responseKv && this.enableDataCache) {
			const cached = await this.responseKv.get<unknown[]>(cacheKey, 'json');
			if (cached) {
				console.log(`[SCBSpecialist] Cache HIT for ${id}`);
				return cached as { key: string[]; values: string[] }[];
			}
		}

		const url = `${BASE_URL}/${apiPath}/data?lang=en&outputFormat=json-stat2`;
		console.log('[SCBSpecialist] Fetching data from', url);
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ Selection: selection })
		});
		if (!res.ok) {
			const text = await res.text();
			console.error(
				'[SCBSpecialist] Data fetch failed:',
				res.status,
				res.statusText,
				'Body:',
				text.slice(0, 500)
			);
			return null;
		}

		const json = (await res.json()) as Record<string, unknown>;
		const resultData = this.parseJsonStat2(json);
		if (!resultData || resultData.length === 0) {
			console.warn(
				'[SCBSpecialist] Data fetch returned empty payload. Top-level keys:',
				Object.keys(json)
			);
		}

		if (this.responseKv && this.enableDataCache && resultData) {
			await this.responseKv.put(cacheKey, JSON.stringify(resultData), { expirationTtl: 86400 }); // 24h
			console.log(`[SCBSpecialist] Cache SET for ${id}`);
		}

		return resultData;
	}

	private parseJsonStat2(dataset: Record<string, unknown>): { key: string[]; values: string[] }[] {
		if (
			!dataset ||
			!Array.isArray(dataset.id) ||
			!Array.isArray(dataset.size) ||
			!dataset.id ||
			!dataset.size
		)
			return [];

		const ids: string[] = dataset.id as string[];
		const sizes: number[] = dataset.size as number[];
		const dims = (dataset.dimension ?? {}) as Record<
			string,
			{ category?: { index?: Record<string, number> } }
		>;

		const dimCodes: string[][] = ids.map((id) => {
			const dim = dims[id];
			const index = dim?.category?.index ?? {};
			const codes = Object.keys(index).sort((a, b) => index[a] - index[b]);
			return codes;
		});

		const total = sizes.reduce((acc, s) => acc * s, 1);
		let valuesArray: (number | null)[] = [];

		if (Array.isArray(dataset.value)) {
			valuesArray = dataset.value as (number | null)[];
		} else if (dataset.value && typeof dataset.value === 'object') {
			valuesArray = new Array(total).fill(null);
			for (const [idx, val] of Object.entries(dataset.value)) {
				const i = Number(idx);
				if (!Number.isNaN(i)) valuesArray[i] = val as number;
			}
		} else {
			return [];
		}

		const multipliers = sizes.map((_, i) => sizes.slice(i + 1).reduce((acc, s) => acc * s, 1));

		const rows: { key: string[]; values: string[] }[] = [];
		for (let i = 0; i < valuesArray.length; i++) {
			const value = valuesArray[i];
			if (value === null || value === undefined) continue;
			const key = ids.map((_, d) => {
				const m = multipliers[d];
				const idx = Math.floor(i / m) % sizes[d];
				return dimCodes[d][idx];
			});
			rows.push({ key, values: [String(value)] });
		}

		return rows;
	}

	private formatResults(
		data: { key: string[]; values: string[] }[],
		dataset: string,
		tableId: string,
		query: SCBQuery,
		metadata?: SCBMetadata
	): SCBResult[] {
		// Attempt to extract unit from metadata
		let unit = 'unit';
		if (metadata && metadata.variables) {
			const contentsVar = metadata.variables.find(
				(v) =>
					v.id === 'ContentsCode' ||
					/content|observation|measure/i.test(v.text) ||
					v.text.toLowerCase().includes('contentscode')
			);
			if (contentsVar) {
				// If we have a selected ContentsCode in the query, extract its label
				if (query.contentsCode) {
					const idx = contentsVar.values.indexOf(query.contentsCode);
					if (idx !== -1 && contentsVar.valueTexts && contentsVar.valueTexts[idx]) {
						unit = contentsVar.valueTexts[idx];
					}
				}
			}
		}

		// Convert SCB flat data to our Result Interface
		return data.map((d) => {
			const keyParts = Array.isArray(d.key) ? d.key : [];
			const year =
				keyParts.find((k: string) => /^(18|19|20)\d{2}$/.test(k)) ??
				keyParts
					.map((k: string) => {
						const m = k.match(/^(18|19|20)\d{2}/);
						return m ? m[0] : null;
					})
					.find((v: string | null) => v !== null) ??
				(keyParts.length > 0 ? keyParts[keyParts.length - 1] : '');

			return {
				value: parseFloat(d.values[0]),
				unit,
				label: keyParts.join(', '),
				year,
				source: 'SCB',
				dataset,
				table_id: tableId,
				debug_query: query
			};
		});
	}
}
