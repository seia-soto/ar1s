import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {compileBit} from '../../../../modules/bitwise.js';
import {db, isFlagExists} from '../../../../modules/database/index.js';
import {usePermissionError} from '../../../../modules/error.js';
import {deletePlatform} from '../../../../specs/platform.js';
import {UserFlags} from '../../../../specs/user.js';
import {SessionCookieNames} from '../../session/index.js';

export const platformRoute: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	fastify.addHook('preParsing', async (request, _reply) => {
		const managerFlag = compileBit(UserFlags.PlatformManager);

		if (!await db.tx(async t => isFlagExists(t, 'user', request.session.user, managerFlag))) {
			throw usePermissionError();
		}
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
