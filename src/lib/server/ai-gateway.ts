type GatewayEnv = {
	AI_GATEWAY_ACCOUNT_ID: string;
	AI_GATEWAY_ID: string;
	AI_GATEWAY_TOKEN: string;
	WORKERS_AI_TOKEN: string;
};

type GatewayRunArgs = {
	env: GatewayEnv;
	model: string;
	inputs: unknown;
	userId?: string | null;
};

/**
 * Cloudflare AI Gateway Client
 *
 * Wraps calls to Workers AI through the AI Gateway.
 * Benefits:
 * - Analytics & Logging: Track request usage and costs for the internship project.
 * - Caching: Responses from the LLM can be cached at the edge.
 * - Rate Limiting: Protects the backend from abuse.
 */
export async function runWorkersAiGateway({
	env,
	model,
	inputs,
	userId
}: GatewayRunArgs): Promise<unknown> {
	const accountId = env.AI_GATEWAY_ACCOUNT_ID;
	const gatewayId = env.AI_GATEWAY_ID;

	if (!accountId || !gatewayId) {
		throw new Error('AI Gateway account id or gateway id is missing.');
	}
	if (!env.AI_GATEWAY_TOKEN) {
		throw new Error('AI Gateway auth token is missing.');
	}
	if (!env.WORKERS_AI_TOKEN) {
		throw new Error('Workers AI token is missing.');
	}

	const url = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/workers-ai/${model}`;
	const headers: Record<string, string> = {
		Authorization: `Bearer ${env.WORKERS_AI_TOKEN}`,
		'cf-aig-authorization': `Bearer ${env.AI_GATEWAY_TOKEN}`,
		'Content-Type': 'application/json'
	};

	if (userId) {
		headers['cf-aig-metadata'] = JSON.stringify({ user_id: userId });
	}

	const response = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify(inputs)
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(
			`AI Gateway request failed (${response.status} ${response.statusText}): ${text}`
		);
	}

	const json = (await response.json()) as Record<string, unknown> | unknown;
	if (json && typeof json === 'object' && 'result' in json) {
		return (json as { result: unknown }).result;
	}
	return json;
}
