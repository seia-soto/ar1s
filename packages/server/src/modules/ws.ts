/**
 * MIT License Copyright (c) 2023 HoJeong Go
 *
 * This plugin is the forked version of @fastify/websocket, and adds the following features:
 *  - Determine if server need to accept upgrade request before processing it
 *
 * To use this module, you need to register it to your instance.
 * Registering this module will enable you to use `useWebSocket` and `wsHandler` optional properties in `routingOption` globally.
 * You don't need to set `useWebSocket` if you set `wsHandler`.
 *
 * To accept `upgrade` request, call `request.resolveWebSocket` function.
 * Note that this function will not available if the request is not upgrade request for WebSocket.
 * You need to check the existence of function before using it.
 *
 * Now the WebSocket connection is established and you can process the WebSocket via the return value of `resolveWebSocket` and via `wsHandler` function.
 *
 * To drop the WebSocket connection, just return the value before calling `request.resolveWebSocket`.
 * As `resolveWebSocket` defer the reply hijacking from the Fastify instance, you'll able to use `reply.send` or return value before calling the function.
 * By doing so, WebSocket client will know 101 switching protocol was not returned and the server will closed the connection by returning response.
 */
import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {type FastifyReply, type FastifyRequest, type RouteOptions} from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import {ServerResponse} from 'http';
import type internal from 'stream';
import {WebSocketServer, createWebSocketStream, type WebSocket} from 'ws';

export type WebSocketWithConnection = {
	socket: WebSocket;
} & internal.Duplex;

export const kWsPin = Symbol('ar1s-ws-pin');

const webSocketPlugin: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	const wss = new WebSocketServer({noServer: true});

	const resolveWebSocket = async (request: FastifyRequest, reply: FastifyReply, wsHandler?: RouteOptions['wsHandler']) => new Promise<WebSocketWithConnection>(resolve => {
		void reply.hijack();

		// Note that the existence of pin is already checked in `routeOptions.handler` proxy
		const pin = request.raw[kWsPin]!;

		wss.handleUpgrade(request.raw, pin.socket, pin.head, socket => {
			pin.isResolved = true;

			wss.emit('connection', socket, request.raw);

			const connection = createWebSocketStream(socket) as WebSocketWithConnection;

			connection.on('error', error => {
				fastify.log.error(error);
			});

			socket.on('newListener', event => {
				if (event === 'message') {
					connection.resume();
				}
			});

			connection.socket = socket;

			if (typeof wsHandler === 'function') {
				void wsHandler(wss, connection, request);
			}

			resolve(connection);
		});
	});

	// Attach wss
	fastify.decorate('wss', null);
	fastify.decorateRequest('resolveWebSocket', null);

	fastify.wss = wss;

	// Add route option
	fastify.addHook('onRoute', routeOptions => {
		const useWebSocket = routeOptions.useWebSocket ?? typeof routeOptions.wsHandler === 'function';

		if (routeOptions.method === 'HEAD') {
			return;
		}

		if (useWebSocket && routeOptions.method !== 'GET') {
			throw new Error('WebSocket connection should be made in GET method!');
		}

		routeOptions.handler = new Proxy(routeOptions.handler, {
			apply(target, thisArg, argArray) {
				const [request, reply] = argArray as [FastifyRequest, FastifyReply];

				// Check if this request is upgrade request
				const pin = request.raw[kWsPin];

				if (!pin) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return Reflect.apply(target, thisArg, argArray);
				}

				if (!useWebSocket) {
					// Close the web socket request
					throw new Error('WebSocket connection is not available in current path!');
				}

				request.resolveWebSocket = async () => resolveWebSocket(request, reply, routeOptions.wsHandler);

				return (Reflect.apply(target, thisArg, argArray) as Promise<unknown>)
					.catch((error: unknown) => {
						// If `pin.isResolved` is set to `true`, we know that the reply is already hijacked in the workflow.
						if (pin.isResolved) {
							pin.socket.destroy();

							return;
						}

						throw error;
					});
			},
		});
	});

	// Add close hook (see https://github.com/fastify/fastify-websocket/blob/master/index.js#L155)
	fastify.server.close = new Proxy(fastify.server.close, {
		apply(target, thisArg, argArray) {
			for (const client of fastify.wss.clients) {
				client.close();
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return Reflect.apply(target, thisArg, argArray);
		},
	});

	fastify.server.on('upgrade', (request, socket, head) => {
		if (request.method !== 'GET') {
			throw new Error('WebSocket request should be made in GET request!');
		}

		const response = new ServerResponse(request);

		request[kWsPin] = {
			socket,
			head,
		};

		// @ts-expect-error It's just ok.
		response.assignSocket(socket);

		fastify.routing(request, response);
	});
};

export const useWebSocket = fastifyPlugin(webSocketPlugin);
