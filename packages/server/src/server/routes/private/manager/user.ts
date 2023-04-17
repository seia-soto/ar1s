import {UserFlags, UserFormats} from '@ar1s/spec/out/user.js';
import {addFlag, compileBit} from '@ar1s/spec/out/utils/bitwise.js';
import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {db, models} from '../../../../modules/database/index.js';
import {ValidationErrorCodes, useInexistingResourceError, useValidationError} from '../../../../modules/error.js';
import {createUser, userStandardDataTypeObjectParams} from '../../../../specs/user.js';

export const userRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	// Get a user
	fastify.route({
		url: '/:username',
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
					.select(...userStandardDataTypeObjectParams)
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
		url: '/',
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
