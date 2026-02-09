/**
 * Cloudflare Worker Entry Point
 *
 * This file exports the Durable Object class `BullCheckAgent`.
 * Cloudflare's runtime automatically routes requests to this object based on
 * the configuration in `wrangler.jsonc`.
 */
export { BullCheckAgent } from '$lib/agent';
