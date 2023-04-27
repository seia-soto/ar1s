import {UserFlags, UserFormats} from '@ar1s/spec/out/user.js';
import {compileBit} from '@ar1s/spec/out/utils/bitwise.js';
import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {db, isFlagExists, models} from '../../../modules/database/index.js';
import {ValidationErrorCodes, useValidationError} from '../../../modules/error.js';
import {createHash, validateHash} from '../../../modules/hash.js';
import {deletePlatform} from '../../../specs/platform.js';
import {deleteUser, userStandardDataTypeObjectParams} from '../../../specs/user.js';
import {SessionCookieNames} from '../session/index.js';

export const userRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	fastify.route({
		url: '/',
		method: 'GET',
		async handler(request, _reply) {
			return db.tx(async t => {
				const user = await models.user(t)
					.find({id: request.session.user})
					.select(...userStandardDataTypeObjectParams)
					.oneRequired();

				return user;
			});
		},
	});

	fastify.route({
		url: '/',
		method: 'PATCH',
		schema: {
			body: Type.Object({
				displayName: Type.String(),
				displayBio: Type.String(),
				displayAvatarUrl: Type.String(),
			}),
		},
		async handler(request, _reply) {
			return db.tx(async t => {
				await models.user(t).update({id: request.session.user}, {
					...request.body,
					updatedAt: new Date(),
				});

				return '';
			});
		},
	});

	fastify.route({
		url: '/password',
		method: 'PATCH',
		schema: {
			body: Type.Object({
				currentPassword: Type.String({
					format: UserFormats.Password,
				}),
				newPassword: Type.String({
					format: UserFormats.Password,
				}),
			}),
		},
		async handler(request, _reply) {
			return db.tx(async t => {
				const user = await models.user(t).find({id: request.session.user}).select('password').oneRequired();

				if (!await validateHash(user.password, request.body.currentPassword)) {
					throw useValidationError(ValidationErrorCodes.InvalidCredentials);
				}

				await models.user(t).update({id: request.session.user}, {
					password: await createHash(request.body.newPassword),
				});

				return '';
			});
		},
	});

	fastify.route({
		url: '/',
		method: 'DELETE',
		async handler(request, reply) {
			return db.tx(async t => {
				if (await isFlagExists(t, 'user', request.session.user, compileBit(UserFlags.PlatformManager))) {
					await deletePlatform(t, request.session.platform);
				} else {
					await deleteUser(t, request.session.user);
				}

				void reply.clearCookie(SessionCookieNames.Session, {
					path: '/',
					httpOnly: true,
					secure: true,
				});

				return '';
			});
		},
	});
};
