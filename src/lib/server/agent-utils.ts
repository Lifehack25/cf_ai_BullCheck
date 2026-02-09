type ResultRow = {
	value: number;
	year?: string;
	dataset?: string;
	table_id?: string;
	debug_query?: { selection?: unknown; contentsLabel?: string } | Record<string, unknown>;
};

export function computeUnitLabel(params: {
	question: string;
	dataset: string;
	contentLabel: string | null;
	isRateLike: boolean;
	isStockLike: boolean;
	isWageLike: boolean;
}): string | null {
	const text = `${params.question} ${params.dataset} ${params.contentLabel ?? ''}`.toLowerCase();
	const monetary =
		params.isWageLike ||
		/\b(salary|wage|pay|earnings|income|rent|price|cost|expenditure|spending|revenue|sales)\b/.test(
			text
		);
	const isPercentLike = /percent|percentage/.test(text);
	const isIndexLike = /index/.test(text);
	const isRateWord = /\brate\b/.test(text) && !monetary;
	if (isPercentLike || isIndexLike || isRateWord) return null;

	const hasSek = /\bsek\b|krona|kr\b/.test(text);
	const hasEur = /\beur\b|€/.test(text);
	const hasUsd = /\busd\b|\$/.test(text);

	if (hasSek) {
		if (/million|mn|msek/.test(text)) return 'SEK million';
		if (/thousand|tsek/.test(text)) return 'SEK thousand';
		return 'SEK';
	}
	if (hasEur) return 'EUR';
	if (hasUsd) return 'USD';

	if (monetary) return 'SEK';

	return null;
}

export function buildAnswerPayload(results: ResultRow[], question: string) {
	// Validate input
	if (!results || !Array.isArray(results) || results.length === 0) {
		throw new Error('buildAnswerPayload: results must be a non-empty array');
	}

	if (!question || typeof question !== 'string') {
		throw new Error('buildAnswerPayload: question must be a non-empty string');
	}

	const lowerQ = question.toLowerCase();
	const tableId = results[0].table_id ?? 'SCB';
	const dataset = results[0].dataset ?? 'SCB data';
	const contentLabelRaw = results[0].debug_query?.contentsLabel;
	const contentLabel =
		typeof contentLabelRaw === 'string' && contentLabelRaw.trim() ? contentLabelRaw.trim() : null;
	const labelLower = contentLabel ? contentLabel.toLowerCase() : '';
	const isInflation = /\b(inflation|cpi)\b/i.test(question);
	const isRateLike =
		/ratio|rate|index|percent|percentage|per |mean|average/.test(labelLower) ||
		/\brate\b|\bindex\b|percent|percentage|\baverage\b|\bmean\b/.test(lowerQ);
	const isStockLike = /population|stock/.test(labelLower);
	const isWageLike =
		/salary|wage|pay|earnings|income/.test(labelLower) ||
		/\b(salary|wage|pay|earnings|income)\b/.test(lowerQ);
	const useAverage = isInflation || isRateLike || isStockLike || isWageLike;
	const unitLabel = computeUnitLabel({
		question,
		dataset,
		contentLabel,
		isRateLike,
		isStockLike,
		isWageLike
	});

	const yearAgg = new Map<string, { sum: number; count: number }>();
	for (const row of results) {
		const value = Number(row.value);
		if (!Number.isFinite(value)) continue;
		const year = row.year ?? 'unknown';
		const current = yearAgg.get(year) ?? { sum: 0, count: 0 };
		yearAgg.set(year, { sum: current.sum + value, count: current.count + 1 });
	}

	const selection = (results[0].debug_query?.selection as Array<Record<string, unknown>>) ?? [];
	const sexSel = selection.find((s: Record<string, unknown>) => s.dimension === 'Kon');
	const monthSel = selection.find((s: Record<string, unknown>) => s.dimension === 'Manad');
	const qualifiers: string[] = [];
	if (sexSel && Array.isArray(sexSel.items)) {
		qualifiers.push(sexSel.items.length > 1 ? 'both sexes' : `sex code ${sexSel.items[0]}`);
	}
	if (monthSel && Array.isArray(monthSel.items)) {
		qualifiers.push(monthSel.items.length >= 12 ? 'all months' : `month code ${monthSel.items[0]}`);
	}

	let metricLabel = contentLabel;
	if (!metricLabel) {
		if (/\bdivorc/.test(lowerQ)) metricLabel = 'Divorces';
		else if (/\b(marriage|married|wedding|wed)\b/.test(lowerQ)) metricLabel = 'Marriages';
		else if (/\bdeath/.test(lowerQ)) metricLabel = 'Deaths';
		else if (/\bbirth/.test(lowerQ)) metricLabel = 'Births';
		else if (/\bimmigra/.test(lowerQ)) metricLabel = 'Immigrations';
		else if (/\bemigra/.test(lowerQ)) metricLabel = 'Emigrations';
		else if (/\bpopulation\b/.test(lowerQ)) metricLabel = 'Population';
	}

	const years = Array.from(yearAgg.keys()).sort();
	const values = years.map((year) => {
		const agg = yearAgg.get(year) ?? { sum: 0, count: 0 };
		const value = useAverage && agg.count ? agg.sum / agg.count : agg.sum;
		return { year, value };
	});

	return {
		question,
		tableId,
		dataset,
		metricLabel,
		aggregation: useAverage ? 'average' : 'total',
		qualifiers,
		unit: unitLabel,
		values
	};
}

export function buildDeterministicAnswer(results: ResultRow[], question: string): string {
	// Validate input
	if (!results || !Array.isArray(results) || results.length === 0) {
		return 'I could not find any matching statistics for your question.';
	}

	if (!question || typeof question !== 'string') {
		return 'Unable to process your question. Please try rephrasing it.';
	}

	// Validate at least one result has a finite value
	const hasValidValue = results.some(
		(r) => r.value !== null && r.value !== undefined && Number.isFinite(Number(r.value))
	);
	if (!hasValidValue) {
		return 'Retrieved data is incomplete or invalid. Please try a different question.';
	}

	const lowerQ = question.toLowerCase();
	const isInflation = /\b(inflation|cpi)\b/i.test(question);
	const contentLabelRaw = results[0].debug_query?.contentsLabel;
	const contentLabel =
		typeof contentLabelRaw === 'string' && contentLabelRaw.trim() ? contentLabelRaw.trim() : null;
	const labelLower = contentLabel ? contentLabel.toLowerCase() : '';
	const isRateLike =
		/ratio|rate|index|percent|percentage|per |mean|average/.test(labelLower) ||
		/\brate\b|\bindex\b|percent|percentage|\baverage\b|\bmean\b/.test(lowerQ);
	const isWageLike =
		/salary|wage|pay|earnings|income/.test(labelLower) ||
		/\b(salary|wage|pay|earnings|income)\b/.test(lowerQ);
	const isStockLike = /population|stock/.test(labelLower);
	const useAverage = isInflation || isRateLike || isStockLike || isWageLike;
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
	const unitLabel = computeUnitLabel({
		question,
		dataset,
		contentLabel,
		isRateLike,
		isStockLike,
		isWageLike
	});
	const unitSuffix = unitLabel ? ` ${unitLabel}` : '';

	const selection = (results[0].debug_query?.selection as Array<Record<string, unknown>>) ?? [];
	const sexSel = selection.find((s: Record<string, unknown>) => s.dimension === 'Kon');
	const monthSel = selection.find((s: Record<string, unknown>) => s.dimension === 'Manad');
	const qualifiers: string[] = [];
	if (sexSel && Array.isArray(sexSel.items)) {
		qualifiers.push(sexSel.items.length > 1 ? 'both sexes' : `sex code ${sexSel.items[0]}`);
	}
	if (monthSel && Array.isArray(monthSel.items)) {
		qualifiers.push(monthSel.items.length >= 12 ? 'all months' : `month code ${monthSel.items[0]}`);
	}
	const qualifierText = qualifiers.length ? ` (${qualifiers.join(', ')})` : '';

	let metricLabel = contentLabel;
	if (!metricLabel) {
		if (/\bdivorc/.test(lowerQ)) metricLabel = 'Divorces';
		else if (/\b(marriage|married|wedding|wed)\b/.test(lowerQ)) metricLabel = 'Marriages';
		else if (/\bdeath/.test(lowerQ)) metricLabel = 'Deaths';
		else if (/\bbirth/.test(lowerQ)) metricLabel = 'Births';
		else if (/\bimmigra/.test(lowerQ)) metricLabel = 'Immigrations';
		else if (/\bemigra/.test(lowerQ)) metricLabel = 'Emigrations';
		else if (/\bpopulation\b/.test(lowerQ)) metricLabel = 'Population';
	}

	const years = Array.from(yearAgg.keys()).sort();
	if (years.length === 1) {
		const year = years[0];
		const agg = yearAgg.get(year) ?? { sum: 0, count: 0 };
		if (useAverage) {
			const avg = agg.count ? agg.sum / agg.count : 0;
			const label = metricLabel ? ` ${metricLabel}` : '';
			return addFriendlyFollowup(
				`According to SCB table ${tableId} ("${dataset}"), the average${label} for ${year}${qualifierText} is ${avg.toFixed(2)}${unitSuffix}.`
			);
		}
		const total = Math.round(agg.sum);
		const label = metricLabel ? ` ${metricLabel}` : ' value';
		return addFriendlyFollowup(
			`According to SCB table ${tableId} ("${dataset}"), total${label} for ${year}${qualifierText} were ${total.toLocaleString()}${unitSuffix}.`
		);
	}

	const parts = years
		.map((y) => {
			const agg = yearAgg.get(y) ?? { sum: 0, count: 0 };
			if (useAverage) {
				const avg = agg.count ? agg.sum / agg.count : 0;
				return `${y}: ${avg.toFixed(2)}${unitSuffix}`;
			}
			return `${y}: ${Math.round(agg.sum).toLocaleString()}${unitSuffix}`;
		})
		.join('; ');
	const label = metricLabel ? ` ${metricLabel}` : '';
	return addFriendlyFollowup(
		`According to SCB table ${tableId} ("${dataset}"), ${useAverage ? 'average' : 'totals'}${label} by year${qualifierText} are: ${parts}.`
	);
}

export function addFriendlyFollowup(text: string): string {
	return `${text} If you want, I can compare this to another year or show a longer trend.`;
}
