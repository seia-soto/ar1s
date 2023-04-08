import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {db, models} from '../../modules/database/index.js';
import {PlatformFlags, PlatformFormats, getDefaultPlatform, getPlatformByInvite} from '../../specs/platform.js';
import {ValidationErrorCodes, useInexistingResourceError, useValidationError} from '../../modules/error.js';
import {UserFormats, createUser} from '../../specs/user.js';
import {compileBit, hasFlag} from '../../modules/bitwise.js';

const displayPlatformType = Type.Object({
	id: Type.Number(),
	flag: Type.Number(),
	displayName: Type.String(),
	displayImageUrl: Type.String(),
});

export const platformRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	fastify.route({
		url: '/',
		method: 'GET',
		schema: {
			response: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				200: displayPlatformType,
			},
		},
		async handler(_request, _reply) {
			return db.tx(async t => {
				const platform = await getDefaultPlatform(t);

				if (!platform) {
					throw useInexistingResourceError();
				}

				return platform;
			});
		},
	});

	fastify.route({
		url: '/invite/:inviteIdentifier',
		method: 'GET',
		schema: {
			params: Type.Object({
				inviteIdentifier: Type.String({
					format: PlatformFormats.InviteIdentifier,
				}),
			}),
			response: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				200: displayPlatformType,
			},
		},
		async handler(request, _reply) {
			return db.tx(async t => {
				const platform = await getPlatformByInvite(t, request.params.inviteIdentifier);

				if (!platform) {
					throw useInexistingResourceError();
				}

				return platform;
			});
		},
	});

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

				if (
					hasFlag(platform.flag, compileBit(PlatformFlags.IsSignUpDisabled))
					|| hasFlag(platform.flag, compileBit(PlatformFlags.IsDeactivated))
				) {
					throw useValidationError(ValidationErrorCodes.PlatformNotOpenForSignUp);
				}

				await createUser(t, {
					flag: 0,
					username: request.body.username,
					password: request.body.password,
					displayName: '',
					displayAvatarUrl: '',
					displayBio: '',
					platform: platform.id,
				});

				return '';
			});
		},
	});
};
