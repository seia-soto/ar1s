import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {issueTicket} from '../../../specs/event.js';

export const eventRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	fastify.route({
		url: '/',
		method: 'POST',
		async handler(request, _reply) {
			const ticket = await issueTicket(request.session.platform, request.session.user);

			return {
				ticket,
			};
		},
	});
};
