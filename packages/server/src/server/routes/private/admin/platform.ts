import {PlatformFormats} from '@ar1s/spec/out/platform.js';
import {UserFlags, UserFormats} from '@ar1s/spec/out/user.js';
import {addFlag, compileBit} from '@ar1s/spec/out/utils/bitwise.js';
import {greaterThan} from '@databases/pg-typed';
import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {db, models} from '../../../../modules/database/index.js';
import {useInexistingResourceError} from '../../../../modules/error.js';
import {rangedQueryType, singleRangedQueryType, useRangedQueryParams, useSingleRangedQueryParam} from '../../../../modules/formats.js';
import {createPlatform, deletePlatform} from '../../../../specs/platform.js';

export const platformRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	fastify.route({
		url: '/',
		method: 'GET',
		schema: {
			querystring: rangedQueryType,
		},
		async handler(request, _reply) {
			const {from, size} = useRangedQueryParams(request.query, 50);

			return db.tx(async t => {
				const platforms = await models.platform(t)
					.find({id: greaterThan(from - 1)})
					.select('id', 'flag', 'inviteIdentifier', 'displayName', 'displayImageUrl')
					.orderByAsc('id')
					.limit(size);

				return platforms;
			});
		},
	});

	fastify.route({
		url: '/:id',
		method: 'GET',
		schema: {
			params: singleRangedQueryType,
		},
		async handler(request, _reply) {
			const id = useSingleRangedQueryParam(request.params.id);

			return db.tx(async t => {
				const platform = await models.platform(t).find({id}).select('id', 'flag', 'inviteIdentifier', 'displayName', 'displayImageUrl').oneRequired()
					.catch(error => {
						request.log.error(error);

						throw useInexistingResourceError();
					});

				return platform;
			});
		},
	});

	fastify.route({
		url: '/',
		method: 'POST',
		schema: {
			body: Type.Object({
				platform: Type.Object({
					inviteIdentifier: Type.String({
						format: PlatformFormats.InviteIdentifier,
					}),
					displayName: Type.String({
						format: PlatformFormats.DisplayName,
					}),
					token: Type.String(),
				}),
				user: Type.Object({
					username: Type.String({
						format: UserFormats.Username,
					}),
					password: Type.String({
						format: UserFormats.Password,
					}),
				}),
			}),
		},
		async handler(request, _reply) {
			return db.tx(async t => {
				const {platform: platformParams, user: managerUserParams} = request.body;
				let managerFlag = 0;

				// We use UserFlags.Bootstrap flag to know if the user is instance manager (global superuser)
				managerFlag = addFlag(managerFlag, compileBit(UserFlags.Bootstrap));
				managerFlag = addFlag(managerFlag, compileBit(UserFlags.PlatformManager));

				await createPlatform(
					t,
					{
						...platformParams,
						displayImageUrl: '',
					},
					{
						...managerUserParams,
						flag: managerFlag,
						displayName: '',
						displayAvatarUrl: '',
						displayBio: '',
					},
					false,
				);

				return '';
			});
		},
	});

	fastify.route({
		url: '/:id',
		method: 'DELETE',
		schema: {
			params: singleRangedQueryType,
		},
		async handler(request, _reply) {
			const id = useSingleRangedQueryParam(request.params.id);

			return db.tx(async t => {
				await deletePlatform(t, id);

				return '';
			});
		},
	});
};
