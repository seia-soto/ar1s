import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {platformRouter} from './platform.js';
import {bootstrapRouter} from './bootstrap.js';

export const route: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	await fastify.register(bootstrapRouter, {prefix: '/bootstrap'});
	await fastify.register(platformRouter, {prefix: '/platform'});
};
