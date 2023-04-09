import {type FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {Type} from '@sinclair/typebox';
import {db, models} from '../../../modules/database/index.js';
import type Conversation from '../../../modules/database/schema/conversation.js';
import {rangedQueryType, singleRangedQueryType, useRangedQueryParams, useSingleRangedQueryParam} from '../../../modules/formats.js';
import {useInexistingResourceError, usePermissionError} from '../../../modules/error.js';
import {addFlag, compileBit, hasFlag} from '../../../modules/bitwise.js';
import {ConversationMemberFlags} from '../../../specs/conversationMember.js';
import {ConversationFormats, createConversation, deleteConversation, isUserOwnedConversation, updateConversationDisplayParams} from '../../../specs/conversation.js';

export const conversationRouter: FastifyPluginAsyncTypebox = async (fastify, _opts) => {
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
				const entries = await t.query(t.sql`select c.id, c.flag, c.displayName, c.displayImageUrl, c.updatedAt from ${t.sql.ident(conversationTableName)} c
join ${t.sql.ident(conversationMemberTableName)} cm on c.id = cm.conversation
join "user" u on m.user = u.id
where u.id = ${request.session.user} and
c.id >= ${from}
order by c.id asc limit ${size}`) as Array<Pick<Conversation, 'id' | 'flag' | 'displayName' | 'displayImageUrl' | 'updatedAt'>>;

				return entries.map(entry => ({...entry, updatedAt: entry.updatedAt.getTime()}));
			});
		},
	});

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
					throw usePermissionError();
				}

				await updateConversationDisplayParams(t, id, request.body);

				return '';
			});
		},
	});

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
					throw usePermissionError();
				}

				await deleteConversation(t, id);

				return '';
			});
		},
	});
};
