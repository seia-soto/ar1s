import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {compileBit, hasFlag} from '../../../modules/bitwise.js';
import {db, models} from '../../../modules/database/index.js';
import type Conversation from '../../../modules/database/schema/conversation.js';
import type Message from '../../../modules/database/schema/message.js';
import {useInexistingResourceError} from '../../../modules/error.js';
import {rangedQueryType, singleRangedQueryType, useRangedQueryParams, useSingleRangedQueryParam} from '../../../modules/formats.js';
import {ConversationFormats, createConversation, deleteConversation, isUserJoinedConversation, isUserOwnedConversation, updateConversationDisplayParams} from '../../../specs/conversation.js';
import {ConversationMemberFlags} from '../../../specs/conversationMember.js';

export const conversationRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
	// Get all available conversation in range for user
	fastify.route({
		url: '/',
		method: 'GET',
		schema: {
			querystring: rangedQueryType,
		},
		async handler(request, _reply) {
			const {from, size} = useRangedQueryParams(request.query, 100);

			return db.tx(async t => {
				// Get conversation by user identifier
				const conversationTableName = models.conversation(t).tableName;
				const conversationMemberTableName = models.conversationMember(t).tableName;
				const entries = await t.query(t.sql`select c.id, c.flag, c."displayName", c."displayImageUrl", c."updatedAt" from ${t.sql.ident(conversationTableName)} c
join ${t.sql.ident(conversationMemberTableName)} cm on c.id = cm.conversation
join "user" u on cm.user = u.id
where u.id = ${request.session.user} and
c.id >= ${from}
order by c.id asc limit ${size}`) as Array<Pick<Conversation, 'id' | 'flag' | 'displayName' | 'displayImageUrl' | 'updatedAt'>>;

				return entries.map(entry => ({...entry, updatedAt: entry.updatedAt.getTime()}));
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

					return {
						...conversation,
						createdAt: conversation.createdAt.getTime(),
						updatedAt: conversation.updatedAt.getTime(),
					};
				}

				const conversation = await models.conversation(t).find({id}).select('id', 'flag', 'displayName', 'displayImageUrl', 'updatedAt').oneRequired();

				return {
					...conversation,
					updatedAt: conversation.updatedAt.getTime(),
				};
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

				return {
					...conversation,
					createdAt: conversation.createdAt.getTime(),
					updatedAt: conversation.updatedAt.getTime(),
				};
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

				await updateConversationDisplayParams(t, id, request.body);

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
			const {from, size} = useRangedQueryParams(request.query, 400);

			return db.tx(async t => {
				if (!await isUserJoinedConversation(t, request.session.user, id)) {
					throw useInexistingResourceError();
				}

				const messages = await t.query(t.sql`select * from ${t.sql.ident(models.message(t).tableName)}
where id >= ${from}
and conversation = ${id}
order by id desc
limit ${size}`) as Message[];

				return messages.map(message => ({
					...message,
					createdAt: message.createdAt.getTime(),
					updatedAt: message.updatedAt.getTime(),
				}));
			});
		},
	});

	// Create the message on the conversation
	fastify.route({
		url: '/:id/message',
		method: 'POST',
		schema: {
			querystring: singleRangedQueryType,
			body: Type.Object({
				content: Type.String(),
			}),
		},
		async handler(request, _reply) {
			const id = useSingleRangedQueryParam(request.query.id);

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
};
