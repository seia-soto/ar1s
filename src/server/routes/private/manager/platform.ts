import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {db, models} from '../../../../modules/database/index.js';
import {deletePlatform} from '../../../../specs/platform.js';
import {SessionCookieNames} from '../../session/index.js';

export const platformRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	fastify.route({
		url: '/',
		method: 'PATCH',
		schema: {
			body: Type.Object({
				// eslint-disable-next-line new-cap
				displayName: Type.Optional(Type.String()),
				// eslint-disable-next-line new-cap
				displayImageUrl: Type.Optional(Type.String()),
			}),
		},
		async handler(request, _reply) {
			return db.tx(async t => {
				await models.platform(t).update({id: request.session.platform}, request.body);

				return '';
			});
		},
	});

	fastify.route({
		url: '/',
		method: 'DELETE',
		async handler(request, reply) {
			return db.tx(async t => {
				await deletePlatform(t, request.session.platform);
				void reply.clearCookie(SessionCookieNames.Session);

				return '';
			});
		},
	});
};
