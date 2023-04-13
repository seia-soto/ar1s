import {PlatformFlags, PlatformFormats} from '@ar1s/spec/out/platform.js';
import {UserFormats} from '@ar1s/spec/out/user.js';
import {compileBit, hasFlag} from '@ar1s/spec/out/utils/bitwise.js';
import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {db, models} from '../../modules/database/index.js';
import {ValidationErrorCodes, useInexistingResourceError, useValidationError} from '../../modules/error.js';
import {getDefaultPlatform, getPlatformByInvite} from '../../specs/platform.js';
import {createUser} from '../../specs/user.js';

export const platformRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	// Get default platform for the first look page
	fastify.route({
		url: '/',
		method: 'GET',
		async handler(_request, _reply) {
			return db.tx(async t => {
				const platform = await getDefaultPlatform(t);

				if (!platform) {
					// We expect the frontend to be redirected to bootstrap the instance
					throw useInexistingResourceError();
				}

				return platform;
			});
		},
	});

	// Get platform metdata by inviteIdentifier
	fastify.route({
		url: '/invite/:inviteIdentifier',
		method: 'GET',
		schema: {
			params: Type.Object({
				inviteIdentifier: Type.String({
					format: PlatformFormats.InviteIdentifier,
				}),
			}),
		},
		async handler(request, _reply) {
			return db.tx(async t => {
				const platform = await getPlatformByInvite(t, request.params.inviteIdentifier);

				if (!platform) {
					// We need to return the not found error to protect private platforms
					throw useInexistingResourceError();
				}

				return platform;
			});
		},
	});

	// Sign up for the platform
	fastify.route({
		url: '/invite/:inviteIdentifier',
		method: 'POST',
		schema: {
			params: Type.Object({
				inviteIdentifier: Type.String({
					format: PlatformFormats.InviteIdentifier,
				}),
			}),
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
				const platform = await models.platform(t)
					.find({inviteIdentifier: request.params.inviteIdentifier})
					.select('id', 'flag')
					.oneRequired()
					.catch(error => {
						request.log.error(error);

						throw useInexistingResourceError();
					});

				if (hasFlag(platform.flag, compileBit(PlatformFlags.IsSignUpDisabled))) {
					throw useValidationError(ValidationErrorCodes.PlatformNotOpenForSignUp);
				}

				await createUser(t, {
					flag: 0,
					username: request.body.username,
					password: request.body.password,
					displayName: request.body.username,
					displayAvatarUrl: '',
					displayBio: '',
					platform: platform.id,
				});

				return '';
			});
		},
	});
};
