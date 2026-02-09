export type JsonStat2Dataset = {
	dimension: Record<string, unknown>;
	size: number[];
	value: unknown[];
};

/**
 * Parses JSON-stat 2.0 response into a flat array of observations.
 */
export function parseJsonStat2(json: JsonStat2Dataset) {
	if (!json.dimension || !json.value) return json;

	const dimensions = Object.keys(json.dimension);
	const size = json.size;
	const value = json.value;

	const categoryMap: Record<string, string[]> = {};
	dimensions.forEach((dimId) => {
		const dim = json.dimension[dimId] as {
			category: { label: Record<string, string>; index: Record<string, number> };
		};
		const labels = dim.category.label;
		const indexObj = dim.category.index;
		const codes = Object.keys(indexObj).sort((a, b) => indexObj[a] - indexObj[b]);

		categoryMap[dimId] = codes.map((c) => labels[c] || c);
	});

	const observations = [];
	const totalCells = value.length;

	for (let i = 0; i < totalCells; i++) {
		let remainder = i;
		const coords: Record<string, string> = {};

		for (let j = dimensions.length - 1; j >= 0; j--) {
			const dimId = dimensions[j];
			const explicitSize = size[j];
			const coordIndex = remainder % explicitSize;
			coords[dimId] = categoryMap[dimId][coordIndex];
			remainder = Math.floor(remainder / explicitSize);
		}

		observations.push({
			...coords,
			value: value[i]
		});
	}

	return observations;
}
