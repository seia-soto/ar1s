/* eslint-disable @typescript-eslint/consistent-type-definitions */
import 'fastify';
import {type WebSocket, type WebSocketServer} from 'ws';
import {type TokenPayload} from '../src/modules/token.js';

declare module 'fastify' {
	interface FastifyInstance {
		wss: WebSocketServer;
	}

	interface FastifyRequest {
		session: TokenPayload;
		resolveWebSocket?: () => Promise<WebSocket>;
	}

	interface RouteOptions {
		useWebSocket?: boolean;
		wsHandler?: (wss: WebSocketServer, ws: WebSocket, request: FastifyRequest) => unknown;
	}
}
