import {createClient} from 'redis';
import genericPool from 'generic-pool';
import {shouldEnvBeTypeOrFallback} from './env.js';

shouldEnvBeTypeOrFallback('KEYDB_POOL_MIN', 2);
shouldEnvBeTypeOrFallback('KEYDB_POOL_MAX', 10);

const min = parseInt(process.env.KEYDB_POOL_MIN, 10) || 2;
const max = parseInt(process.env.KEYDB_POOL_MAX, 10) || 10;

export const keydb = genericPool.createPool({
	async create() {
		const client = createClient();

		await client.connect();

		return client;
	},
	async destroy(resource) {
		await resource.disconnect();
	},
}, {
	min,
	max,
});
