import { describe, it, expect } from 'vitest';
import { parseJsonStat2 } from './scb-jsonstat';

/**
 * Tests for SCB JSON-stat v2 Parser
 *
 * Verifies that the parser correctly flattens nested JSON-stat v2 structures
 * into a linear array of observation objects with mapped labels.
 */
describe('parseJsonStat2', () => {
	it('flattens a JSON-stat v2 dataset into observations', () => {
		const dataset = {
			dimension: {
				Region: {
					category: {
						index: { '00': 0, '01': 1 },
						label: { '00': 'Sweden', '01': 'Stockholm' }
					}
				},
				Year: {
					category: {
						index: { '2020': 0, '2021': 1 },
						label: { '2020': '2020', '2021': '2021' }
					}
				}
			},
			size: [2, 2],
			value: [10, 11, 12, 13]
		};

		const result = parseJsonStat2(dataset) as { Region: string; Year: string; value: number }[];
		expect(result).toHaveLength(4);
		expect(result[0]).toMatchObject({ Region: 'Sweden', Year: '2020', value: 10 });
		expect(result[1]).toMatchObject({ Region: 'Sweden', Year: '2021', value: 11 });
		expect(result[2]).toMatchObject({ Region: 'Stockholm', Year: '2020', value: 12 });
	});
});
