/**
 * SCB (Statistiska centralbyrån) API Client (v2)
 * Base URL: https://statistikdatabasen.scb.se/api/v2
 */

import { parseJsonStat2 } from './scb-jsonstat';

const BASE_URL = 'https://statistikdatabasen.scb.se/api/v2';

/**
 * Searches the SCB API v2 for tables matching the query.
 * Uses the proper /tables?query= endpoint.
 */
export async function searchSCB(query: string): Promise<string> {
	try {
		const url = `${BASE_URL}/tables?query=${encodeURIComponent(query)}&lang=en`;
		const res = await fetch(url);

		if (!res.ok) {
			return JSON.stringify({ error: `Search failed: ${res.status}` });
		}

		const data = (await res.json()) as {
			tables: {
				id: string;
				label: string;
				updated: string;
				firstPeriod: string;
				lastPeriod: string;
			}[];
		};

		if (data.tables) {
			const tables = data.tables
				.map(
					(t: {
						id: string;
						label: string;
						updated: string;
						firstPeriod: string;
						lastPeriod: string;
					}) => ({
						id: t.id,
						label: t.label,
						description: t.label, // Use label as description since description is often empty
						updated: t.updated,
						period: `${t.firstPeriod} - ${t.lastPeriod}`
					})
				)
				.slice(0, 5); // Limit result to top 5

			return JSON.stringify({
				topic: query,
				tables
			});
		}

		return JSON.stringify({ tables: [] });
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : String(e);
		return JSON.stringify({ error: message });
	}
}

/**
 * Fetches actual data from a table using API v2.
 * filters for the last 2 time periods.
 */
export async function fetchTableData(tableId: string, kv?: KVNamespace, timeFilter?: string) {
	// (Note: cacheKey doesn't include timeFilter, which is a bug if we cache different years!)
	// We should append timeFilter to cache key.
	const cacheKey = `source:scb:v2:${tableId}:${timeFilter || 'latest'}`;

	// 1. Try Cache
	if (kv) {
		try {
			const cached = await kv.get(cacheKey, 'json');
			if (cached) {
				console.log(`[SCB] Cache HIT for ${tableId} (${timeFilter || 'latest'})`);
				return cached;
			}
		} catch (e) {
			console.warn('[SCB] Cache read failed', e);
		}
	}

	try {
		// ... (metadata fetch unchanged) ...
		const metaRes = await fetch(`${BASE_URL}/tables/${tableId}?lang=en`);
		if (!metaRes.ok) throw new Error(`Meta failed: ${metaRes.status}`);
		const meta = (await metaRes.json()) as { links?: { rel: string; href: string }[] };

		const metaLink = meta.links?.find(
			(l: { rel: string; href: string }) => l.rel === 'metadata'
		)?.href;
		if (!metaLink) throw new Error('No metadata link found');

		const fullMetaRes = await fetch(metaLink);
		const fullMeta = (await fullMetaRes.json()) as {
			role: { time?: string[]; metric?: string[] };
			dimension: Record<string, { category: { index: Record<string, number> } }>;
		};

		// 4. Identify Time Variable
		const timeId = fullMeta.role?.time?.[0];
		if (!timeId) throw new Error('No time variable found in metadata');

		const timeDim = fullMeta.dimension[timeId];
		const sortedCodes = Object.keys(timeDim.category.index).sort((a, b) => {
			return timeDim.category.index[a] - timeDim.category.index[b];
		});

		// Smart Selection
		let selectedCodes: string[] = [];
		if (timeFilter) {
			// Find codes containing the filter (e.g. "2015" matches "2015", "2015M01")
			selectedCodes = sortedCodes.filter((c) => c.includes(timeFilter));
		}

		// Fallback or explicit latest
		if (selectedCodes.length === 0) {
			selectedCodes = sortedCodes.slice(-4);
		} else if (selectedCodes.length > 12) {
			// If filter is too broad (e.g. "19" matches 1900-1999), limit to top 12 to avoid payload issues
			selectedCodes = selectedCodes.slice(0, 12);
		}

		// 5. Identify Metric/Contents Variable to fetch ALL values (e.g. Births AND Deaths)
		let metricSelection = '';
		const metricId = fullMeta.role?.metric?.[0]; // Usually "ContentsCode"
		if (metricId && fullMeta.dimension[metricId]) {
			const metricDim = fullMeta.dimension[metricId];
			const allMetricCodes = Object.keys(metricDim.category.index);
			metricSelection = `&${metricId}=${allMetricCodes.join(',')}`;
		}

		// 6. Fetch Data (JSON-stat2)
		const selection = `${timeId}=${selectedCodes.join(',')}${metricSelection}`;
		const dataUrl = `${BASE_URL}/tables/${tableId}/data?lang=en&${selection}&outputFormat=json-stat2`;

		const dataRes = await fetch(dataUrl);
		if (!dataRes.ok) throw new Error(`Data fetch failed: ${dataRes.status}`);

		const rawData = await dataRes.json();

		const parsedData = parseJsonStat2(
			rawData as { dimension: Record<string, unknown>; size: number[]; value: unknown[] }
		);

		// 7. Store in Cache
		if (kv && parsedData) {
			try {
				await kv.put(cacheKey, JSON.stringify(parsedData), { expirationTtl: 86400 });
				console.log(`[SCB] Cache SET for ${tableId}`);
			} catch (e) {
				console.warn('[SCB] Cache write failed', e);
			}
		}

		return parsedData;
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : String(e);
		return { error: message };
	}
}
