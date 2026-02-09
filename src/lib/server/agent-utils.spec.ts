import { describe, it, expect } from 'vitest';
import { buildAnswerPayload, buildDeterministicAnswer, computeUnitLabel } from './agent-utils';

/**
 * Tests for Agent Utilities
 *
 * Verifies helper functions used by the SCB Agent, such as:
 * - Unit label inference (SEK, USD, etc.)
 * - Qualifier addition (e.g., "both sexes")
 * - Deterministic answer construction
 */
describe('agent utils', () => {
	it('infers SEK for wage-like questions', () => {
		const unit = computeUnitLabel({
			question: 'What was the average salary in Sweden 2023?',
			dataset: 'SCB data',
			contentLabel: 'Average salary',
			isRateLike: false,
			isStockLike: false,
			isWageLike: true
		});
		expect(unit).toBe('SEK');
	});

	it('returns null for index/rate-like units', () => {
		const unit = computeUnitLabel({
			question: 'CPI index 2023',
			dataset: 'SCB data',
			contentLabel: 'CPI index',
			isRateLike: true,
			isStockLike: false,
			isWageLike: false
		});
		expect(unit).toBeNull();
	});

	it('prefers explicit USD when mentioned', () => {
		const unit = computeUnitLabel({
			question: 'USD price levels in 2022',
			dataset: 'SCB data',
			contentLabel: 'Price level',
			isRateLike: false,
			isStockLike: false,
			isWageLike: true
		});
		expect(unit).toBe('USD');
	});

	it('adds qualifiers when selection includes sex/month', () => {
		const payload = buildAnswerPayload(
			[
				{
					value: 100,
					year: '2020',
					table_id: 'TAB1',
					dataset: 'Demo',
					debug_query: { selection: [{ dimension: 'Kon', items: ['1', '2'] }] }
				}
			],
			'Deaths in 2020'
		);
		expect(payload.qualifiers).toContain('both sexes');
	});

	it('builds a deterministic answer for a single year', () => {
		const text = buildDeterministicAnswer(
			[
				{
					value: 123,
					year: '2020',
					table_id: 'TAB1',
					dataset: 'Demo',
					debug_query: { selection: [] }
				}
			],
			'How many deaths in 2020?'
		);
		expect(text).toContain('TAB1');
		expect(text).toContain('2020');
		expect(text).toContain('123');
	});

	it('builds a deterministic answer for multiple years', () => {
		const text = buildDeterministicAnswer(
			[
				{
					value: 10,
					year: '2020',
					table_id: 'TAB1',
					dataset: 'Demo',
					debug_query: { selection: [] }
				},
				{
					value: 12,
					year: '2021',
					table_id: 'TAB1',
					dataset: 'Demo',
					debug_query: { selection: [] }
				}
			],
			'How many deaths in 2020-2021?'
		);
		expect(text).toContain('2020');
		expect(text).toContain('2021');
	});
});
