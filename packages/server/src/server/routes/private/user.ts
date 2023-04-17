import {ParcelTypes} from '@ar1s/spec/out/parcel.js';
import {UserFlags, UserFormats} from '@ar1s/spec/out/user.js';
import {compileBit} from '@ar1s/spec/out/utils/bitwise.js';
import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {db, isFlagExists, models} from '../../../modules/database/index.js';
import type ConversationMember from '../../../modules/database/schema/conversationMember.js';
import {publish} from '../../../modules/delivery/pubsub.js';
import {ValidationErrorCodes, useValidationError} from '../../../modules/error.js';
import {createHash, validateHash} from '../../../modules/hash.js';
import {getHumanConversationMemberIds} from '../../../specs/conversationMember.js';
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

				// Create another context
				void db.tx(async t => {
					const memberProfiles = await t.query(t.sql`select cm.id, cm.conversation, cm.flag, cm."createdAt",
coalesce(nullif(cm."displayName", ''), u."displayName") as "displayName",
coalesce(nullif(cm."displayAvatarUrl", ''), u."displayAvatarUrl") as "displayAvatarUrl",
coalesce(nullif(cm."displayBio", ''), u."displayBio") as "displayBio"
from ${t.sql.ident(models.conversationMember(t).tableName)} cm
left join ${t.sql.ident(models.user(t).tableName)} u ON cm."user" = u.id
where cm.user = ${request.session.user}`) as Array<Pick<ConversationMember, 'id' | 'flag' | 'conversation' | 'displayName' | 'displayAvatarUrl' | 'displayBio' | 'createdAt'>>;

					await Promise.all(memberProfiles.map(async profile => publish(await getHumanConversationMemberIds(t, profile.conversation), {
						type: ParcelTypes.ConversationMemberUpdate,
						payload: {
							id: profile.id,
							flag: profile.flag,
							displayName: profile.displayName,
							displayAvatarUrl: profile.displayAvatarUrl,
							displayBio: profile.displayBio,
							createdAt: profile.createdAt.toString(),
						},
					})));
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

				void reply.clearCookie(SessionCookieNames.Session);

				return '';
			});
		},
	});
};
