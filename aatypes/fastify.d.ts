/* eslint-disable @typescript-eslint/consistent-type-definitions */
import {type FastifyRequest as _FastifyRequest} from 'fastify';

declare module 'fastify' {
	interface FastifyRequest {
		user: {
			id: number;
			flags: number;
		};
	}
}
