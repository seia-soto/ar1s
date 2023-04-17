import {ClientParcelTypes, ParcelTypes, type StaticClientParcelTypes, type StaticParcelTypes} from '@ar1s/spec/out/parcel.js';
import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {type RawData} from 'ws';
import {db} from '../../modules/database/index.js';
import {validateClientParcelType} from '../../modules/delivery/parcel.js';
import {getPeerById, registerPeer, unregisterPeer} from '../../modules/delivery/peer.js';
import {usePermissionError} from '../../modules/error.js';
import {isUserJoinedConversation} from '../../specs/conversation.js';
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

			const acknowledge = () => {
				const message: StaticParcelTypes = {
					type: ParcelTypes.Acknowledge,
				};

				ws.socket.send(JSON.stringify(message));
			};

			const ignore = () => {
				const message: StaticParcelTypes = {
					type: ParcelTypes.Ignore,
				};

				ws.socket.send(JSON.stringify(message));
			};

			const deserializeMessage = (data: RawData) => {
				if (Array.isArray(data)) {
					return Buffer.concat(data).toString();
				}

				return Buffer.from(data).toString();
			};

			const handlePackage = async (pkg: StaticClientParcelTypes) => {
				switch (pkg.type) {
					case ClientParcelTypes.Subscribe: {
						await db.tx(async t => {
							if (!await isUserJoinedConversation(t, request.session.user, pkg.payload)) {
								ignore();

								return;
							}

							const peer = getPeerById(id);

							if (!peer) {
								return;
							}

							peer.data.focusedOnConversation = pkg.payload;

							acknowledge();
						});

						break;
					}

					default: {
						ignore();

						break;
					}
				}
			};

			const handleMessage = (data: RawData) => {
				const text = deserializeMessage(data);
				const json = JSON.parse(text) as unknown;

				if (validateClientParcelType(json)) {
					void handlePackage(json);

					return;
				}

				ignore();
			};

			ws.socket.once('close', unregister);
			ws.socket.once('error', unregister);
			ws.socket.on('message', handleMessage);
		},
	});
};
