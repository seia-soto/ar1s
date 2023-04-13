import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {db} from '../../../../modules/database/index.js';
import {clear} from '../../../../specs/bootstrap.js';
import {SessionCookieNames} from '../../session/index.js';

export const instanceRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	fastify.route({
		url: '/',
		method: 'DELETE',
		async handler(_request, reply) {
			return db.tx(async t => {
				await clear(t);
				void reply.clearCookie(SessionCookieNames.Session);

				return '';
			});
		},
	});
};
