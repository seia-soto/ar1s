import {ConversationFormats} from '@ar1s/spec/out/conversation.js';
import {ConversationMemberFlags} from '@ar1s/spec/out/conversationMember.js';
import {compileBit, hasFlag} from '@ar1s/spec/out/utils/bitwise.js';
import {lessThan} from '@databases/pg-typed';
import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {db, models} from '../../../modules/database/index.js';
import type Conversation from '../../../modules/database/schema/conversation.js';
import type ConversationMember from '../../../modules/database/schema/conversationMember.js';
import {ValidationErrorCodes, useInexistingResourceError, useValidationError} from '../../../modules/error.js';
import {Formats, rangedQueryType, singleRangedQueryType, useRangedQueryParams, useReverseRangedQueryParams, useSingleRangedQueryParam} from '../../../modules/formats.js';
import {createConversation, deleteConversation, isUserJoinedConversation, isUserOwnedConversation} from '../../../specs/conversation.js';

export const conversationRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	// Get all available conversation in range for user
	fastify.route({
		url: '/',
		method: 'GET',
		schema: {
			querystring: rangedQueryType,
		},
		async handler(request, _reply) {
			const {from, size} = useRangedQueryParams(request.query, 200);

			return db.tx(async t => {
				// Get conversation by user identifier
				const userTableName = models.user(t).tableName;
				const conversationTableName = models.conversation(t).tableName;
				const conversationMemberTableName = models.conversationMember(t).tableName;
				const entries = await t.query(t.sql`select c.id, c.flag, c."displayName", c."displayImageUrl", c."updatedAt" from ${t.sql.ident(conversationTableName)} c
join ${t.sql.ident(conversationMemberTableName)} cm on c.id = cm.conversation
join ${t.sql.ident(userTableName)} u on cm.user = u.id
where u.id = ${request.session.user} and
c.id >= ${from}
order by c.id asc limit ${size}`) as Array<Pick<Conversation, 'id' | 'flag' | 'displayName' | 'displayImageUrl' | 'updatedAt'>>;

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
				// Get if the user is the member of the conversation
				const conversationMember = await models.conversationMember(t)
					.find({user: request.session.user})
					.andWhere({conversation: id})
					.select('flag')
					.oneRequired()
					.catch(error => {
						request.log.error(error);

						throw useInexistingResourceError();
					});

				// If the user is the owner of the conversation
				if (hasFlag(conversationMember.flag, compileBit(ConversationMemberFlags.IsOwner))) {
					const conversation = await models.conversation(t).findOneRequired({id});

					return conversation;
				}

				const conversation = await models.conversation(t).find({id}).select('id', 'flag', 'displayName', 'displayImageUrl', 'updatedAt').oneRequired();

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

				await models.conversation(t).update({id}, {
					...request.body,
					updatedAt: new Date(),
				});

				return '';
			});
		},
	});

	// Delete the conversation
	fastify.route({
		url: '/:id',
		method: 'DELETE',
		schema: {
			params: singleRangedQueryType,
		},
		async handler(request, _reply) {
			const id = useSingleRangedQueryParam(request.params.id);

			return db.tx(async t => {
				if (!await isUserOwnedConversation(t, request.session.user, id)) {
					throw useInexistingResourceError();
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
				await models.conversationMember(t)
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
				const conversationMembers = await t.query(t.sql`select cm.id, cm.flag, cm."createdAt",
coalesce(nullif(cm."displayName", ''), u."displayName") as "displayName",
coalesce(nullif(cm."displayAvatarUrl", ''), u."displayAvatarUrl") as "displayAvatarUrl",
coalesce(nullif(cm."displayBio", ''), u."displayBio") as "displayBio"
from ${t.sql.ident(models.conversationMember(t).tableName)} cm
left join ${t.sql.ident(models.user(t).tableName)} u ON cm."user" = u.id
where cm.conversation = ${id}`) as Array<Pick<ConversationMember, 'id' | 'flag' | 'displayName' | 'displayAvatarUrl' | 'displayBio' | 'createdAt'>>;

				return conversationMembers;
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

				await models.message(t).insert({
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