import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {db, models} from '../../../modules/database/index.js';

export const platformRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	// Get the platform data
	fastify.route({
		url: '/',
		method: 'GET',
		async handler(request, _reply) {
			return db.tx(async t => {
				const platform = await models.platform(t).find({id: request.session.platform}).select('displayName', 'displayImageUrl').oneRequired();

				return platform;
			});
		},
	});
};
