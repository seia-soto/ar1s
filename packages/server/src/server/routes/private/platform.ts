import {UserFlags} from '@ar1s/spec/out/user.js';
import {addFlag, compileBit} from '@ar1s/spec/out/utils/bitwise.js';
import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {db, models} from '../../../modules/database/index.js';

export const platformRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	// Get the platform data
	fastify.route({
		url: '/',
		method: 'GET',
		async handler(request, _reply) {
			return db.tx(async t => {
				const platform = await models.platform(t)
					.find({id: request.session.platform})
					.select('id', 'flag', 'inviteIdentifier', 'displayName', 'displayImageUrl', 'createdAt', 'updatedAt')
					.oneRequired();

				return platform;
			});
		},
	});

	// Get all human users in the platform
	fastify.route({
		url: '/users',
		method: 'GET',
		async handler(request, _reply) {
			return db.tx(async t => {
				const systemFlag = addFlag(0, compileBit(UserFlags.System));
				const assistantFlag = addFlag(0, compileBit(UserFlags.Assistant));

				const users = await models.user(t)
					.find({
						platform: request.session.platform,
					})
					.andWhere(t.sql`not flag & ${systemFlag} = ${systemFlag} or flag & ${assistantFlag} = ${assistantFlag}`)
					.select('id', 'flag', 'platform', 'username', 'displayName', 'displayAvatarUrl', 'displayBio', 'createdAt', 'updatedAt')
					.all();

				return users;
			});
		},
	});
};
