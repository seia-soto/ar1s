import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {registerPeer} from '../../../modules/delivery/peer.js';
import {usePermissionError} from '../../../modules/error.js';
import {EventFormats, issueTicket, retrieveTicket} from '../../../specs/event.js';

export const eventRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	// Issue ticket for the WebSocket connection
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

	// Accept WebSocket connection here
	fastify.route({
		url: '/:pin',
		method: 'GET',
		schema: {
			params: Type.Object({
				pin: Type.String({
					format: EventFormats.Pin,
				}),
			}),
		},
		async handler(request, _reply) {
			if (!request.resolveWebSocket) {
				throw usePermissionError();
			}

			const pin = await retrieveTicket(request.params.pin);

			if (!pin) {
				throw usePermissionError();
			}

			const ws = await request.resolveWebSocket();

			await registerPeer(pin.userId, ws);
		},
	});
};
