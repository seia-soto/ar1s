import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {addFlag, compileBit, hasFlag} from '../../../modules/bitwise.js';
import {db, models} from '../../../modules/database/index.js';
import {ValidationErrorCodes, useInexistingResourceError, useValidationError} from '../../../modules/error.js';
import {validateHash} from '../../../modules/hash.js';
import {TokenFlags, encodeToken} from '../../../modules/token.js';
import {UserFlags, UserFormats} from '../../../specs/user.js';

export enum SessionCookieNames {
	Session = '__Host-ab_session',
}

export const sessionRoute: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
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
				isTrustedEnvironment: Type.Boolean({
					default: false,
				}),
			}),
		},
		async handler(request, reply) {
			return db.tx(async t => {
				const user = await models.user(t).find({username: request.body.username}).select('id', 'flag', 'platform', 'password').oneRequired()
					.catch(error => {
						request.log.error(error);

						throw useInexistingResourceError();
					});

				if (hasFlag(user.flag, compileBit(UserFlags.IsUserDeactivated))) {
					throw useValidationError(ValidationErrorCodes.UserDeactivated);
				}

				if (!await validateHash(user.password, request.body.password)) {
					throw useValidationError(ValidationErrorCodes.InvalidCredentials);
				}

				const token = await encodeToken({
					platform: user.platform,
					user: user.id,
					flag: request.body.isTrustedEnvironment ? 0 : addFlag(0, compileBit(TokenFlags.IsTemporaryToken)),
				});

				void reply.setCookie(SessionCookieNames.Session, token);

				return '';
			});
		},
	});

	fastify.route({
		url: '/',
		method: 'DELETE',
		async handler(_request, reply) {
			void reply.clearCookie(SessionCookieNames.Session);

			return '';
		},
	});
};
