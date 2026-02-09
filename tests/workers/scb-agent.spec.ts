import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { SCBSpecialist } from '../../src/lib/server/scb-agent';
import { insertScbTable } from './setup';

describe('SCBSpecialist', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('resolves data using mocked metadata and data fetches', async () => {
		await insertScbTable({ id: 'TABTEST', title: 'Test Table', apiPath: 'tables/TABTEST' });

		const aiRun = vi.fn().mockResolvedValue({ response: 'TABTEST' });

		const metadata = {
			dimension: {
				Tid: {
					label: 'Year',
					category: {
						index: { '2020': 0 },
						label: { '2020': '2020' }
					}
				},
				ContentsCode: {
					label: 'Contents',
					category: {
						index: { C01: 0 },
						label: { C01: 'Deaths' }
					}
				}
			}
		};

		const dataset = {
			id: ['Tid', 'ContentsCode'],
			size: [1, 1],
			dimension: metadata.dimension,
			value: [123]
		};

		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = typeof input === 'string' ? input : input.toString();
			if (url.includes('/metadata')) {
				return new Response(JSON.stringify(metadata), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			if (url.includes('/data')) {
				return new Response(JSON.stringify(dataset), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			return new Response('Not Found', { status: 404 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const agent = new SCBSpecialist(aiRun, env.DB);
		const result = await agent.resolve('How many deaths in 2020?');

		expect(result).toBeTruthy();
		expect(result?.[0].table_id).toBe('TABTEST');
		expect(result?.[0].dataset).toBe('Test Table');
		expect(result?.[0].value).toBe(123);
	});
});
