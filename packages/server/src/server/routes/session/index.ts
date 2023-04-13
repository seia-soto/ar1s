import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {addFlag, compileBit} from '../../../modules/bitwise.js';
import {db, models} from '../../../modules/database/index.js';
import {ValidationErrorCodes, useInexistingResourceError, useValidationError} from '../../../modules/error.js';
import {validateHash} from '../../../modules/hash.js';
import {TokenFlags, encodeToken} from '../../../modules/token.js';
import {UserFormats} from '../../../specs/user.js';

export enum SessionCookieNames {
	Session = '__Host-ab_session',
}

export const sessionRoute: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	// Sign In, or session creation
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

				// Hashing is high cost action, so we defer this as possible
				if (!await validateHash(user.password, request.body.password)) {
					throw useValidationError(ValidationErrorCodes.InvalidCredentials);
				}

				const token = await encodeToken({
					platform: user.platform,
					user: user.id,
					flag: request.body.isTrustedEnvironment ? 0 : addFlag(0, compileBit(TokenFlags.IsTemporaryToken)),
				});

				void reply.setCookie(SessionCookieNames.Session, token, {
					path: '/',
					maxAge: 1000 * 60 * 60 * 24 * 2,
					secure: true,
					httpOnly: true,
				});

				return '';
			});
		},
	});

	// Destroy the session
	fastify.route({
		url: '/',
		method: 'DELETE',
		async handler(_request, reply) {
			void reply.clearCookie(SessionCookieNames.Session);

			return '';
		},
	});
};
