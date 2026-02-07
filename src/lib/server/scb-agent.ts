
import { eq, like, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { scb_tables } from './db/schema';
import type { D1Database } from '@cloudflare/workers-types';

const BASE_URL = 'https://statistikdatabasen.scb.se/api/v2';

interface Ai {
    run(model: string, inputs: unknown, options?: unknown): Promise<unknown>;
}

export interface SCBResult {
    value: number;
    unit: string;
    label: string;
    year: string;
    source: string;
    dataset: string;
    debug_query?: Record<string, unknown>;
    table_id: string;
}

export interface SCBTable {
    id: string;
    title: string;
    description: string | null;
    api_path: string;
}

export class SCBSpecialist {
    private ai: Ai;
    private db: ReturnType<typeof drizzle>;
    private kv?: KVNamespace;

    constructor(ai: Ai, d1: D1Database, kv?: KVNamespace) {
        this.ai = ai;
        this.db = drizzle(d1);
        this.kv = kv;
    }

    /**
     * Main Entry Point: Deterministic Workflow
     */
    async resolve(question: string): Promise<SCBResult[] | null> {
        console.log(`[SCBSpecialist] Resolving: "${question}"`);

        // STEP 1: Identify Search Term (Simple extraction)
        const searchTerm = await this.extractSearchTerm(question);
        console.log(`[SCBSpecialist] Search Term: "${searchTerm}"`);

        // STEP 2: Search LOCALLY in D1 (Deterministic)
        let tables = await this.searchLocal(searchTerm);

        // Fallback: If local search fails, maybe try very specific exact match or fail?
        // User said: "AI -> searches OUR indexed SCB tables". 
        // If empty, we fail.
        if (tables.length === 0) {
            console.log('[SCBSpecialist] No matching tables in local index.');
            return null;
        }

        // STEP 3: Select Best Table (LLM, restricted to found set)
        const tableId = await this.selectTable(question, tables);
        if (!tableId || tableId === 'NONE') return null;

        const bestTable = tables.find(t => t.id === tableId)!;
        console.log(`[SCBSpecialist] Selected: ${bestTable.id} - ${bestTable.title}`);

        // STEP 4: Get Metadata (Fetch fresh from API to ensure validity)
        const metadata = await this.getMetadata(bestTable.id, bestTable.api_path);
        if (!metadata) return null;

        // STEP 5: Build Query (Strict Mapping)
        const apiQuery = await this.mapQuery(question, metadata, bestTable.title);
        if (!apiQuery) return null;
        console.log(`[SCBSpecialist] Query:`, JSON.stringify(apiQuery));

        // STEP 6: Fetch Data
        const data = await this.fetchData(bestTable.id, bestTable.api_path, apiQuery);
        if (!data || data.length === 0) return null;

        // STEP 7: Format Output
        return this.formatResults(data, bestTable.title, bestTable.id, apiQuery);
    }

    // --- INTERNAL STEPS ---

    private async extractSearchTerm(question: string): Promise<string> {
        // Simple heuristic prompt (reused from proven V3 fix)
        // Returns single words like "Deaths", "Inflation"
        const prompt = `
        Context: Searching specific D1 Database of Statistics.
        User Question: "${question}"
        Task: Extract the MAIN SUBJECT noun.
        Rules:
        - Use single words. (e.g. "Deaths", "CPI", "Population")
        - Remove verbs, years, places.
        - Output text only.
        `;
        try {
            const res = (await this.ai.run('@cf/meta/llama-3-8b-instruct', {
                messages: [{ role: 'system', content: prompt }]
            })) as { response: string };
            return res.response.trim().split('\n')[0].replace(/[^a-zA-Z0-9 ]/g, '');
        } catch {
            return "Statistics";
        }
    }

    private async searchLocal(term: string): Promise<SCBTable[]> {
        // Simple LIKE search on title, ID, or keywords
        // term e.g. "Deaths"
        // In a real app, use FTS. Here simple LIKE.
        const searchPattern = `%${term}%`;
        const results = await this.db.select()
            .from(scb_tables as any)
            .where(or(
                like(scb_tables.title, searchPattern),
                like(scb_tables.keywords, searchPattern),
                like(scb_tables.id, searchPattern)
            ))
            .limit(5)
            .all();

        return results as unknown as SCBTable[];
    }

    private async selectTable(question: string, tables: SCBTable[]): Promise<string | null> {
        if (tables.length === 1) return tables[0].id;

        const prompt = `
        User Question: "${question}"
        Candidates:
        ${tables.map(t => `- [${t.id}] ${t.title}: ${t.description}`).join('\n')}
        
        Task: Select the most relevant table ID.
        Output: ID only (e.g. TAB4392). If none, "NONE".
        `;

        try {
            const res = (await this.ai.run('@cf/meta/llama-3-8b-instruct', {
                messages: [{ role: 'system', content: prompt }]
            })) as { response: string };
            const text = res.response.trim();
            const match = text.match(/TAB\d+/);
            return match ? match[0] : (text.includes('NONE') ? null : tables[0].id);
        } catch {
            return tables[0].id;
        }
    }

    private async getMetadata(id: string, apiPath: string) {
        // apiPath stored in DB is 'tables/TAB4392' (or potentially full URL if we change it)
        // We will prepend BASE_URL if needed.
        // Assuming api_path in DB is relative 'tables/TABxxx'
        const url = `${BASE_URL}/${apiPath}?lang=en`;

        // 1. Get Summary (links)
        const res = await fetch(url);
        if (!res.ok) return null;
        const summary = (await res.json()) as { links: { rel: string; href: string }[] };

        // 2. Get Metadata URL
        let metaUrl = summary.links?.find(l => l.rel === 'metadata')?.href;
        if (!metaUrl) return null;

        // Force English
        if (metaUrl.includes('lang=')) metaUrl = metaUrl.replace(/lang=[a-z]{2}/, 'lang=en');
        else metaUrl += (metaUrl.includes('?') ? '&' : '?') + 'lang=en';

        // 3. Fetch Metadata
        const metaRes = await fetch(metaUrl);
        if (!metaRes.ok) return null;
        return await metaRes.json(); // Returns JSON-stat2
    }

    private async mapQuery(question: string, metadata: any, datasetTitle: string) {
        // Reuse Robust Logic from V3
        const prompt = `
        Metadata (JSON-stat2):
        ${JSON.stringify(metadata).slice(0, 6000)} -- TRUNCATED

        User Question: "${question}"
        Dataset: "${datasetTitle}"

        Task: Create a JSON Query for PXWeb API.
        
        Rules:
        1. **Metric**: Inspect 'ContentCode' or variables. If User asks for "Deaths", select "Deaths" (not "Births" or "Rates").
        2. **Time**: 
           - If "2014", select "2014" (Year) or "2014M01"..."2014M12" (Month).
           - ALWAYS select ALL months/quarters for a requested year to get the annual sum.
        3. **Region**: Default "00" (Sweden) if not specified.
        4. **Clean**: Use "item": "ALL" or specific values.
        
        Output: JSON Query Block ONLY.
        `;

        try {
            const res = (await this.ai.run('@cf/meta/llama-3-8b-instruct', {
                messages: [{ role: 'system', content: prompt }]
            })) as { response: string };
            const jsonPart = res.response.match(/\{[\s\S]*\}/);
            return jsonPart ? JSON.parse(jsonPart[0]) : null;
        } catch (e) {
            console.error('Query Map Failed', e);
            return null;
        }
    }

    private async fetchData(id: string, apiPath: string, query: any) {
        // Generate a cache key based on the table ID and a hash of the query object
        const queryStr = JSON.stringify(query);

        // Using a digest for the query key
        const msgUint8 = new TextEncoder().encode(JSON.stringify(query));
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const cacheKey = `source:scb:v2:custom:${id}:${hashHex}`;

        if (this.kv) {
            const cached = await this.kv.get(cacheKey, 'json');
            if (cached) {
                console.log(`[SCBSpecialist] Cache HIT for ${id}`);
                return cached as any[];
            }
        }

        const url = `${BASE_URL}/${apiPath}?lang=en`;
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(query),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) return null;

        const json = await res.json() as any;
        const resultData = json.data;

        if (this.kv && resultData) {
            await this.kv.put(cacheKey, JSON.stringify(resultData), { expirationTtl: 86400 }); // 24h
            console.log(`[SCBSpecialist] Cache SET for ${id}`);
        }

        return resultData;
    }

    private formatResults(data: any[], dataset: string, tableId: string, query: any): SCBResult[] {
        // Convert SCB flat data to our Result Interface
        return data.map((d: any) => ({
            value: parseFloat(d.values[0]),
            unit: 'unit', // TODO: extract from metadata
            label: d.key.join(', '),
            year: d.key[d.key.length - 1], // Heuristic: Time is usually last key
            source: 'SCB',
            dataset,
            table_id: tableId,
            debug_query: query
        }));
    }
}
