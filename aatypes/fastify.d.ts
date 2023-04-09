/* eslint-disable @typescript-eslint/consistent-type-definitions */
import {type FastifyRequest as _FastifyRequest} from 'fastify';
import {type TokenPayload} from '../src/modules/token.js';

declare module 'fastify' {
	interface FastifyRequest {
		session: TokenPayload;
	}
}
