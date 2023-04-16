import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {registerPeer, unregisterPeer} from '../../modules/delivery/peer.js';
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
		async handler(request, _reply) {
			if (!request.resolveWebSocket) {
				throw usePermissionError();
			}

			const pin = await retrieveTicket(request.params.pin);

			if (!pin) {
				throw usePermissionError();
			}

			const ws = await request.resolveWebSocket();
			const id = await registerPeer(pin.userId, ws);

			const unregister = () => {
				void unregisterPeer(id);
			};

			ws.socket.once('close', unregister);
			ws.socket.once('error', unregister);
		},
	});
};
