import {ConversationFormats} from '@ar1s/spec/out/conversation.js';
import {UserFlags} from '@ar1s/spec/out/user.js';
import {addFlag, compileBit} from '@ar1s/spec/out/utils/bitwise.js';
import {lessThan} from '@databases/pg-typed';
import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {db, models} from '../../../modules/database/index.js';
import type Conversation from '../../../modules/database/schema/conversation.js';
import type ConversationMember from '../../../modules/database/schema/conversationMember.js';
import {ValidationErrorCodes, useInexistingResourceError, useValidationError} from '../../../modules/error.js';
import {Formats, rangedQueryType, singleRangedQueryType, useReverseRangedQueryParams, useSingleRangedQueryParam} from '../../../modules/formats.js';
import {conversationStandardDataTypeObjectParams, createConversation, deleteConversation, isUserJoinedConversation, isUserOwnedConversation} from '../../../specs/conversation.js';
import {createConversationMember} from '../../../specs/conversationMember.js';

export const conversationRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	// Get all available conversation in range for user
	fastify.route({
		url: '/',
		method: 'GET',
		async handler(request, _reply) {
			return db.tx(async t => {
				// Get conversation by user identifier
				const userTableName = models.user(t).tableName;
				const conversationTableName = models.conversation(t).tableName;
				const conversationMemberTableName = models.conversationMember(t).tableName;
				const entries = await t.query(t.sql`select c.id, c.flag, c."displayName", c."displayImageUrl", c."createdAt", c."updatedAt" from ${t.sql.ident(conversationTableName)} c
join ${t.sql.ident(conversationMemberTableName)} cm on c.id = cm.conversation
join ${t.sql.ident(userTableName)} u on cm.user = u.id
where u.id = ${request.session.user}`) as Array<Pick<Conversation, 'id' | 'flag' | 'displayName' | 'displayImageUrl' | 'createdAt' | 'updatedAt'>>;

				return entries;
			});
		},
	});

	// Get a conversation for user and conversation owner
	// For conversation owner, get all metadata
	fastify.route({
		url: '/:id',
		method: 'GET',
		schema: {
			params: singleRangedQueryType,
		},
		async handler(request, _reply) {
			const id = useSingleRangedQueryParam(request.params.id);

			return db.tx(async t => {
				const conversation = await models.conversation(t).find({id}).select(...conversationStandardDataTypeObjectParams).oneRequired();

				return conversation;
			});
		},
	});

	// Create a conversation owned by the user
	fastify.route({
		url: '/',
		method: 'POST',
		schema: {
			body: Type.Object({
				model: Type.String({
					format: ConversationFormats.Model,
				}),
				systemMessage: Type.String({
					format: ConversationFormats.SystemMessage,
				}),
				displayName: Type.String({
					format: ConversationFormats.DisplayName,
				}),
			}),
		},
		async handler(request, _reply) {
			return db.tx(async t => {
				// Get the details of the user to supply as the owner
				const owner = await models.user(t).find({id: request.session.user}).select('id', 'flag', 'platform', 'displayName', 'displayAvatarUrl', 'displayBio').oneRequired();
				const conversation = await createConversation(t, owner, request.body);

				return conversation;
			});
		},
	});

	// Performs the update of display params for the conversation
	fastify.route({
		url: '/:id',
		method: 'PATCH',
		schema: {
			params: singleRangedQueryType,
			body: Type.Object({
				displayName: Type.String({
					format: ConversationFormats.DisplayName,
				}),
				displayImageUrl: Type.String(),
			}),
		},
		async handler(request, _reply) {
			const id = useSingleRangedQueryParam(request.params.id);

			return db.tx(async t => {
				if (!await isUserOwnedConversation(t, request.session.user, id)) {
					throw useInexistingResourceError();
				}

				const [conversation] = await models.conversation(t).update({id}, {
					...request.body,
					updatedAt: new Date(),
				});

				return '';
			});
		},
	});

	// Delete the conversation, or quit the conversation unless the owner is requester
	fastify.route({
		url: '/:id',
		method: 'DELETE',
		schema: {
			params: singleRangedQueryType,
		},
		async handler(request, _reply) {
			const id = useSingleRangedQueryParam(request.params.id);

			return db.tx(async t => {
				if (!await isUserJoinedConversation(t, request.session.user, id)) {
					throw useInexistingResourceError();
				}

				if (!await isUserOwnedConversation(t, request.session.user, id)) {
					const conversationMember = await models.conversationMember(t).find({conversation: id}).select('id').oneRequired();

					await models.message(t).delete({author: conversationMember.id});
					await models.conversationMember(t).delete({id: conversationMember.id});

					return '';
				}

				await deleteConversation(t, id);

				return '';
			});
		},
	});

	// Get the profile on the conversation
	fastify.route({
		url: '/:id/profile',
		method: 'GET',
		schema: {
			params: singleRangedQueryType,
		},
		async handler(request, _reply) {
			const id = useSingleRangedQueryParam(request.params.id);

			return db.tx(async t => {
				const conversationMember = await t.query(t.sql`select cm.id, cm.flag, cm."createdAt",
coalesce(nullif(cm."displayName", ''), u."displayName") as "displayName",
coalesce(nullif(cm."displayAvatarUrl", ''), u."displayAvatarUrl") as "displayAvatarUrl",
coalesce(nullif(cm."displayBio", ''), u."displayBio") as "displayBio"
from ${t.sql.ident(models.conversationMember(t).tableName)} cm
left join ${t.sql.ident(models.user(t).tableName)} u ON cm."user" = u.id
where cm.conversation = ${id}
and cm."user" = ${request.session.user}`) as [Pick<ConversationMember, 'id' | 'flag' | 'displayName' | 'displayAvatarUrl' | 'displayBio' | 'createdAt'>];

				if (conversationMember.length !== 1) {
					throw useValidationError(ValidationErrorCodes.InvalidData);
				}

				return conversationMember[0];
			});
		},
	});

	// Modify the profile on the conversation
	fastify.route({
		url: '/:id/profile',
		method: 'PATCH',
		schema: {
			params: singleRangedQueryType,
			body: Type.Object({
				displayName: Type.String(),
				displayAvatarUrl: Type.String(),
				displayBio: Type.String(),
			}),
		},
		async handler(request, _reply) {
			const id = useSingleRangedQueryParam(request.params.id);

			return db.tx(async t => {
				const [conversationMember] = await models.conversationMember(t)
					.update({
						user: request.session.user,
						conversation: id,
					}, request.body);

				return '';
			});
		},
	});

	// Get members on the conversation
	fastify.route({
		url: '/:id/members',
		method: 'GET',
		schema: {
			params: singleRangedQueryType,
		},
		async handler(request, _reply) {
			const id = useSingleRangedQueryParam(request.params.id);

			return db.tx(async t => {
				const conversationMembers = await t.query(t.sql`select cm.id, cm.flag, cm.platform, cm.conversation, cm.user, cm."createdAt", cm."updatedAt",
coalesce(nullif(cm."displayName", ''), u."displayName") as "displayName",
coalesce(nullif(cm."displayAvatarUrl", ''), u."displayAvatarUrl") as "displayAvatarUrl",
coalesce(nullif(cm."displayBio", ''), u."displayBio") as "displayBio"
from ${t.sql.ident(models.conversationMember(t).tableName)} cm
left join ${t.sql.ident(models.user(t).tableName)} u ON cm."user" = u.id
where cm.conversation = ${id}`) as Array<Pick<ConversationMember, 'id' | 'flag' | 'platform' | 'conversation' | 'user' | 'displayName' | 'displayAvatarUrl' | 'displayBio' | 'createdAt' | 'updatedAt'>>;

				return conversationMembers;
			});
		},
	});

	// Add member to the conversation
	fastify.route({
		url: '/:conversation/member/:user',
		method: 'POST',
		schema: {
			params: Type.Object({
				conversation: Type.String({
					format: Formats.NumericInt,
				}),
				user: Type.String({
					format: Formats.NumericInt,
				}),
			}),
		},
		async handler(request, _reply) {
			const conversationId = useSingleRangedQueryParam(request.params.conversation);
			const userId = useSingleRangedQueryParam(request.params.user);

			const systemFlag = addFlag(0, compileBit(UserFlags.System));
			const assistantFlag = addFlag(0, compileBit(UserFlags.Assistant));

			return db.tx(async t => {
				const user = await models.user(t)
					.find({
						id: userId,
						platform: request.session.platform,
					})
					.andWhere(t.sql`not flag ^ ${systemFlag} = ${systemFlag} and flag ^ ${assistantFlag} = ${assistantFlag}`)
					.select('id', 'platform')
					.oneRequired()
					.catch(error => {
						request.log.error(error);

						throw useInexistingResourceError();
					});

				const member = await createConversationMember(t, conversationId, user, 0);

				return member;
			});
		},
	});

	// Remove the member from the conversation
	fastify.route({
		url: '/:conversation/member/:member',
		method: 'DELETE',
		schema: {
			params: Type.Object({
				conversation: Type.String({
					format: Formats.NumericInt,
				}),
				member: Type.String({
					format: Formats.NumericInt,
				}),
			}),
		},
		async handler(request, _reply) {
			const conversationId = useSingleRangedQueryParam(request.params.conversation);
			const memberId = useSingleRangedQueryParam(request.params.member);

			return db.tx(async t => {
				if (!await isUserOwnedConversation(t, request.session.user, conversationId)) {
					throw useInexistingResourceError();
				}

				const isMemberExistsAsCommon = (await t.query(t.sql`select exists (select 1 from ${t.sql.ident(models.conversationMember(t).tableName)} where id = ${memberId} and conversation = ${conversationId} and flag = ${0})`))[0].exists as boolean;

				if (!isMemberExistsAsCommon) {
					throw useInexistingResourceError();
				}

				await models.message(t).delete({author: memberId});
				await models.conversationMember(t).delete({id: memberId});

				return '';
			});
		},
	});

	// Get messages on the conversation
	fastify.route({
		url: '/:id/messages',
		method: 'GET',
		schema: {
			params: singleRangedQueryType,
			querystring: rangedQueryType,
		},
		async handler(request, _reply) {
			const id = useSingleRangedQueryParam(request.params.id);
			const {from, size} = useReverseRangedQueryParams(request.query, 400);

			return db.tx(async t => {
				if (!await isUserJoinedConversation(t, request.session.user, id)) {
					throw useInexistingResourceError();
				}

				const query = models.message(t)
					.find({conversation: id});

				if (from) {
					query.andWhere({
						id: lessThan(from + 1),
					});
				}

				const messages = query
					.orderByDesc('id')
					.limit(size);

				return messages;
			});
		},
	});

	// Create the message on the conversation
	fastify.route({
		url: '/:id/message',
		method: 'POST',
		schema: {
			params: singleRangedQueryType,
			body: Type.Object({
				content: Type.String(),
			}),
		},
		async handler(request, _reply) {
			const id = useSingleRangedQueryParam(request.params.id);

			return db.tx(async t => {
				if (!await isUserJoinedConversation(t, request.session.user, id)) {
					throw useInexistingResourceError();
				}

				const now = new Date();

				const [message] = await models.message(t).insert({
					flag: 0,
					platform: request.session.platform,
					author: request.session.user,
					conversation: id,
					content: request.body.content,
					createdAt: now,
					updatedAt: now,
				});

				return '';
			});
		},
	});

	// Delete the message on the conversation
	fastify.route({
		url: '/:conversationId/message/:messageId',
		method: 'DELETE',
		schema: {
			params: Type.Object({
				conversationId: Type.String({
					format: Formats.NumericInt,
				}),
				messageId: Type.String({
					format: Formats.NumericInt,
				}),
			}),
		},
		async handler(request, _reply) {
			const conversationId = useSingleRangedQueryParam(request.params.conversationId);
			const messageId = useSingleRangedQueryParam(request.params.messageId);

			return db.tx(async t => {
				const isMessageExists = (await t.query(t.sql`select exists (
select 1 from ${t.sql.ident(models.message(t).tableName)}
where id = ${messageId} and conversation = ${conversationId}
)`))[0].exists as boolean;

				if (!isMessageExists) {
					throw useInexistingResourceError();
				}

				await models.message(t).delete({id: messageId});

				return '';
			});
		},
	});
};
