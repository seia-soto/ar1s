import {PlatformFormats} from '@ar1s/spec/out/platform.js';
import {UserFlags, UserFormats} from '@ar1s/spec/out/user.js';
import {addFlag, compileBit} from '@ar1s/spec/out/utils/bitwise.js';
import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {db} from '../../modules/database/index.js';
import {useInexistingResourceError} from '../../modules/error.js';
import {isBootstrapRequired} from '../../specs/bootstrap.js';
import {createPlatform} from '../../specs/platform.js';

export const bootstrapRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	// Bootstrap
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
				if (!await isBootstrapRequired(t)) {
					throw useInexistingResourceError();
				}

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
						displayName: managerUserParams.username,
						displayAvatarUrl: '',
						displayBio: '',
					},
					true,
				);

				return '';
			});
		},
	});
};
