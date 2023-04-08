import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {db} from '../../modules/database/index.js';
import {isBootstrapRequired} from '../../specs/bootstrap.js';
import {usePermissionError} from '../../modules/error.js';
import {PlatformFormats, createPlatform} from '../../specs/platform.js';
import {UserFormats} from '../../specs/user.js';
import {addFlag, compileBit} from '../../modules/bitwise.js';
import {UserFlags} from '../../specs/user.js';

export const bootstrapRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	fastify.route({
		url: '/',
		method: 'POST',
		schema: {
			body: Type.Object({
				platform: Type.Object({
					inviteIdentifier: Type.String({
						format: PlatformFormats.InviteIdentifier,
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
					throw usePermissionError();
				}

				const {platform: platformParams, user: managerUserParams} = request.body;
				let managerFlag = 0;

				managerFlag = addFlag(managerFlag, compileBit(UserFlags.Bootstrap));
				managerFlag = addFlag(managerFlag, compileBit(UserFlags.PlatformManager));

				await createPlatform(
					t,
					{
						...platformParams,
						displayName: '',
						displayImageUrl: '',
					},
					{
						...managerUserParams,
						flag: managerFlag,
						displayName: '',
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
