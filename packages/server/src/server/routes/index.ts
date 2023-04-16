import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {bootstrapRouter} from './bootstrap.js';
import {eventRouter} from './event.js';
import {platformRouter} from './platform.js';
import {privateRoute} from './private/index.js';
import {sessionRoute} from './session/index.js';

// If the route has scoped context, we call `route` instead of `router`
export const route: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	await fastify.register(sessionRoute, {prefix: '/session'});
	await fastify.register(privateRoute, {prefix: '/private'});
	await fastify.register(bootstrapRouter, {prefix: '/bootstrap'});
	await fastify.register(eventRouter, {prefix: '/event'});
	await fastify.register(platformRouter, {prefix: '/platform'});
};
