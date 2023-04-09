import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {db, isExist} from '../../../modules/database/index.js';
import {usePermissionError} from '../../../modules/error.js';
import {decodeToken, encodeToken, isTokenRequiresRenewal} from '../../../modules/token.js';
import {SessionCookieNames} from '../session/index.js';
import {conversationRouter} from './conversation.js';

export const privateRoute: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	// We should decorate user 'object' into 'null' for performance reason
	// https://www.fastify.io/docs/latest/Reference/Decorators/
	fastify.decorateRequest('user', null);

	fastify.addHook('preParsing', async (request, reply) => {
		const cookie = request.cookies[SessionCookieNames.Session];

		if (!cookie) {
			throw usePermissionError();
		}

		const payload = await decodeToken(cookie)
			.catch(_error => false as const);

		if (!payload) {
			void reply.clearCookie(SessionCookieNames.Session);

			throw usePermissionError();
		}

		const [isUserExists] = await db.tx(async t => isExist(t, 'user', 'id', payload.user));

		if (!isUserExists) {
			void reply.clearCookie(SessionCookieNames.Session);

			throw usePermissionError();
		}

		if (isTokenRequiresRenewal(payload.iat, payload.exp)) {
			const newToken = await encodeToken({
				platform: payload.platform,
				user: payload.user,
				flag: payload.flag,
			});

			void reply.setCookie(SessionCookieNames.Session, newToken, {
				httpOnly: true,
				secure: true,
			});
		}

		request.session = {
			platform: payload.platform,
			user: payload.user,
			flag: payload.flag,
		};
	});

	await fastify.register(conversationRouter, {prefix: '/conversation'});
};
