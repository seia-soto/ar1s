import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {db, isExist} from '../../../modules/database/index.js';
import {usePermissionError} from '../../../modules/error.js';
import {decodeToken, encodeToken, isTokenRequiresRenewal} from '../../../modules/token.js';
import {SessionCookieNames} from '../session/index.js';
import {adminRoute} from './admin/index.js';
import {conversationRouter} from './conversation.js';
import {managerRoute} from './manager/index.js';
import {platformRouter} from './platform.js';
import {userRouter} from './user.js';
import {eventRouter} from './event.js';

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

		if (!await db.tx(async t => isExist(t, 'user', 'id', payload.user))) {
			void reply.clearCookie(SessionCookieNames.Session);

			throw usePermissionError();
		}

		if (isTokenRequiresRenewal(payload.iat)) {
			const newToken = await encodeToken({
				platform: payload.platform,
				user: payload.user,
				flag: payload.flag,
			});

			void reply.clearCookie(SessionCookieNames.Session, {
				path: '/',
				secure: true,
				httpOnly: true,
			});
			void reply.setCookie(SessionCookieNames.Session, newToken, {
				path: '/',
				maxAge: 1000 * 60 * 60 * 24 * 2,
				secure: true,
				httpOnly: true,
			});
		}

		request.session = {
			platform: payload.platform,
			user: payload.user,
			flag: payload.flag,
		};
	});

	await fastify.register(adminRoute, {prefix: '/admin'});
	await fastify.register(managerRoute, {prefix: '/manager'});
	await fastify.register(conversationRouter, {prefix: '/conversation'});
	await fastify.register(eventRouter, {prefix: '/event'});
	await fastify.register(platformRouter, {prefix: '/platform'});
	await fastify.register(userRouter, {prefix: '/user'});
};
