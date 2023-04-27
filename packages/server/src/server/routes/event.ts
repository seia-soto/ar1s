import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {usePermissionError} from '../../modules/error.js';
import {EventFormats, retrieveTicket} from '../../specs/event.js';

export const eventRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
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
		useWebSocket: true,
		async handler(request, _reply) {
			if (typeof request.resolveWebSocket === 'undefined') {
				throw usePermissionError();
			}

			const pin = await retrieveTicket(request.params.pin);

			if (!pin) {
				throw usePermissionError();
			}

			const ws = await request.resolveWebSocket();

			ws.send('Not implemented');
			ws.close();
		},
	});
};
