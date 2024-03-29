import {UserFlags} from '@ar1s/spec/out/user.js';
import {compileBit} from '@ar1s/spec/out/utils/bitwise.js';
import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {db, isFlagExists} from '../../../../modules/database/index.js';
import {usePermissionError} from '../../../../modules/error.js';
import {platformRouter} from './platform.js';
import {userRouter} from './user.js';

export const managerRoute: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	fastify.addHook('preParsing', async (request, _reply) => {
		if (!await db.tx(async t => isFlagExists(t, 'user', request.session.user, compileBit(UserFlags.PlatformManager)))) {
			throw usePermissionError();
		}
	});

	await fastify.register(platformRouter, {prefix: '/platform'});
	await fastify.register(userRouter, {prefix: '/user'});
};
