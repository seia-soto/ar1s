import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {compileBit} from '../../../../modules/bitwise.js';
import {db, isFlagExists} from '../../../../modules/database/index.js';
import {usePermissionError} from '../../../../modules/error.js';
import {UserFlags} from '../../../../specs/user.js';
import {instanceRouter} from './instance.js';

export const adminRoute: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	fastify.addHook('preParsing', async (request, _reply) => {
		const bootstrapFlag = compileBit(UserFlags.Bootstrap);

		if (!await db.tx(async t => isFlagExists(t, 'user', request.session.user, bootstrapFlag))) {
			throw usePermissionError();
		}
	});

	await fastify.register(instanceRouter, {prefix: '/instance'});
};
