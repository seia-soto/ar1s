import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {addFlag, compileBit} from '../../../../modules/bitwise.js';
import {UserFlags, UserFormats} from '../../../../specs/user.js';
import {db, isFlagExists} from '../../../../modules/database/index.js';
import {usePermissionError} from '../../../../modules/error.js';
import {clear} from '../../../../specs/bootstrap.js';
import {SessionCookieNames} from '../../session/index.js';
import {PlatformFormats, createPlatform} from '../../../../specs/platform.js';

export const bootstrapRoute: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	fastify.addHook('preParsing', async (request, _reply) => {
		const bootstrapFlag = compileBit(UserFlags.Bootstrap);

		if (!await db.tx(async t => isFlagExists(t, 'user', request.session.user, bootstrapFlag))) {
			throw usePermissionError();
		}
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
		url: '/',
		method: 'DELETE',
		async handler(_request, reply) {
			return db.tx(async t => {
				await clear(t);
				void reply.clearCookie(SessionCookieNames.Session);

				return '';
			});
		},
	});
};
