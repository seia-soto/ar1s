import {Type, type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {addFlag, compileBit} from '../../../../modules/bitwise.js';
import {db, isFlagExists, models} from '../../../../modules/database/index.js';
import {ValidationErrorCodes, useInexistingResourceError, usePermissionError, useValidationError} from '../../../../modules/error.js';
import {deletePlatform} from '../../../../specs/platform.js';
import {UserFlags, UserFormats, createUser} from '../../../../specs/user.js';
import {SessionCookieNames} from '../../session/index.js';
import {rangedQueryType, useRangedQueryParams} from '../../../../modules/formats.js';
import {greaterThan} from '@databases/pg-typed';

export const platformRoute: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	fastify.addHook('preParsing', async (request, _reply) => {
		if (!await db.tx(async t => isFlagExists(t, 'user', request.session.user, compileBit(UserFlags.PlatformManager)))) {
			throw usePermissionError();
		}
	});

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

	// List users
	fastify.route({
		url: '/users',
		method: 'GET',
		schema: {
			querystring: rangedQueryType,
		},
		async handler(request, _reply) {
			const {from, size} = useRangedQueryParams(request.query, 100);

			return db.tx(async t => {
				const users = await models.user(t)
					.find({
						id: greaterThan(from - 1),
						platform: request.session.platform,
					})
					.select('id', 'flag', 'username', 'displayName', 'displayBio', 'displayAvatarUrl', 'createdAt', 'updatedAt')
					.orderByAsc('id')
					.limit(size);

				return users;
			});
		},
	});

	// Get a user
	fastify.route({
		url: '/user/:username',
		method: 'GET',
		schema: {
			params: Type.Object({
				username: Type.String({
					format: UserFormats.Username,
				}),
			}),
		},
		async handler(request, _reply) {
			return db.tx(async t => {
				const user = await models.user(t)
					.find({
						platform: request.session.platform,
						username: request.params.username,
					})
					.select('id', 'flag', 'username', 'displayName', 'displayBio', 'displayAvatarUrl', 'createdAt', 'updatedAt')
					.oneRequired()
					.catch(error => {
						request.log.error(error);

						throw useInexistingResourceError();
					});

				return user;
			});
		},
	});

	// Create a user
	fastify.route({
		url: '/user',
		method: 'POST',
		schema: {
			body: Type.Object({
				username: Type.String({
					format: UserFormats.Username,
				}),
				password: Type.String({
					format: UserFormats.Password,
				}),
			}),
		},
		async handler(request, _reply) {
			return db.tx(async t => {
				await createUser(t, {
					...request.body,
					flag: 0,
					platform: request.session.platform,
					displayName: '',
					displayBio: '',
					displayAvatarUrl: '',
				});

				return '';
			});
		},
	});

	// Delete a user
	fastify.route({
		url: '/:username',
		method: 'DELETE',
		schema: {
			params: Type.Object({
				username: Type.String({
					format: UserFormats.Username,
				}),
			}),
		},
		async handler(request, _reply) {
			return db.tx(async t => {
				const flag = addFlag(0, compileBit(UserFlags.PlatformManager));
				const isUserPlatformManager = (await t.query(t.sql`select exists (select 1 from ${models.user(t).tableName} where name = ${request.params.username} and flag & ${flag} = ${flag})`))[0].exists as boolean;

				if (isUserPlatformManager) {
					throw useValidationError(ValidationErrorCodes.UserIsPlatformManager);
				}

				await models.user(t).delete({id: request.session.user});

				return '';
			});
		},
	});
};
