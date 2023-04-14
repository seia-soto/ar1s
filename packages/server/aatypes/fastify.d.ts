/* eslint-disable @typescript-eslint/consistent-type-definitions */
import 'fastify';
import {type WebSocketServer} from 'ws';
import {type TokenPayload} from '../src/modules/token.js';
import {type WebSocketWithConnection} from '../src/modules/ws.js';

declare module 'fastify' {
	interface FastifyInstance {
		wss: WebSocketServer;
	}

	interface FastifyRequest {
		session: TokenPayload;
		resolveWebSocket?: () => Promise<WebSocketWithConnection>;
	}

	interface RouteOptions {
		useWebSocket?: boolean;
		wsHandler?: (wss: WebSocketServer, ws: WebSocketWithConnection, request: FastifyRequest) => unknown;
	}
}
