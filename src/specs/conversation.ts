import {type Transaction} from '@databases/pg';
import {TypeSystem} from '@sinclair/typebox/system';
import {addFlag} from '../modules/bitwise.js';
import {models} from '../modules/database/index.js';
import {type Conversation, type User} from '../modules/database/schema/index.js';
import {ConversationMemberFlags, createConversationMember, type ConversationMemberInsertParams} from './conversationMember.js';

export enum ConversationFormats {
	Model = 'ar1s.conversation.model',
	SystemMessage = 'ar1s.conversation.systemMessage',
	DisplayName = 'ar1s.conversation.displayName',
}

export const formatModel = (value: string) => (
	!/[^a-z\d.-]/.test(value)
	&& value.length >= 'gpt-n'.length
	&& value.length < 32
);

// eslint-disable-next-line new-cap
TypeSystem.Format(ConversationFormats.Model, formatModel);

export const formatSystemMessage = (value: string) => (
	value.length < 1024
);

// eslint-disable-next-line new-cap
TypeSystem.Format(ConversationFormats.SystemMessage, formatSystemMessage);

export const formatDisplayName = (value: string) => (
	value.length >= 1
	&& value.length < 32
);

// eslint-disable-next-line new-cap
TypeSystem.Format(ConversationFormats.DisplayName, formatDisplayName);

export type ConversationInsertParams = {
	model: string;
	systemMessage: string;
	displayName: string;
};

export const isUserOwnedConversation = async (t: Transaction, userId: User['id'], conversationId: Conversation['id']) => {
	const flag = addFlag(0, ConversationMemberFlags.IsOwner);
	const exists = (await t.query(t.sql`select exists (
select 1 from ${t.sql.ident(models.conversationMember(t).tableName)}
where conversation = ${conversationId}
and user = ${userId}
and flag & ${flag} = ${flag}
)`))[0].exists as boolean;

	return exists;
};

export const isUserJoinedConversation = async (t: Transaction, userId: User['id'], conversationId: Conversation['id']) => {
	const exists = (await t.query(t.sql`select exists (
select 1 from ${t.sql.ident(models.conversationMember(t).tableName)}
where conversation = ${conversationId}
and user = ${userId}
)`))[0].exists as boolean;

	return exists;
};

export const getOwnedConversations = async (t: Transaction, userId: User['id']) => {
	const flag = addFlag(0, ConversationMemberFlags.IsOwner);
	const ownedConversations = await models.conversationMember(t)
		.find(t.sql`flag & ${flag} = ${flag}`)
		.andWhere({user: userId})
		.select('conversation')
		.all();

	return ownedConversations;
};

export const createConversation = async (t: Transaction, owner: ConversationMemberInsertParams, params: ConversationInsertParams) => {
	const now = new Date();

	const [conversation] = await models.conversation(t).insert({
		flag: 0,
		platform: owner.platform,
		model: params.model,
		systemMessage: params.systemMessage,
		displayName: params.displayName,
		displayImageUrl: '',
		createdAt: now,
		updatedAt: now,
	});

	await createConversationMember(t, conversation.id, owner, true);

	return conversation;
};

export const deleteConversation = async (t: Transaction, conversationId: Conversation['id']) => {
	await models.message(t).delete({conversation: conversationId});
	await models.conversationMember(t).delete({conversation: conversationId});
	await models.conversation(t).delete({id: conversationId});
};
