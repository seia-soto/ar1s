import {ConversationMemberFlags} from '@ar1s/spec/out/conversationMember.js';
import {addFlag, compileBit} from '@ar1s/spec/out/utils/bitwise.js';
import {type Transaction} from '@databases/pg';
import {models} from '../modules/database/index.js';
import {type Conversation, type User} from '../modules/database/schema/index.js';
import {createConversationMember, type ConversationMemberInsertParams} from './conversationMember.js';

export const conversationStandardDataTypeObjectParams: [keyof Conversation, ...Array<keyof Conversation>] = ['id', 'flag', 'displayName', 'displayImageUrl', 'createdAt', 'updatedAt'];

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
and "user" = ${userId}
and flag & ${flag} = ${flag}
)`))[0].exists as boolean;

	return exists;
};

export const isUserJoinedConversation = async (t: Transaction, userId: User['id'], conversationId: Conversation['id']) => {
	const exists = (await t.query(t.sql`select exists (
select 1 from ${t.sql.ident(models.conversationMember(t).tableName)}
where conversation = ${conversationId}
and "user" = ${userId}
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

	await createConversationMember(t, conversation.id, owner, addFlag(0, compileBit(ConversationMemberFlags.IsOwner)));

	const systemUser = await models.user(t).find({username: 'system:' + owner.platform.toString()})
		.select('id', 'platform', 'displayName', 'displayBio', 'displayAvatarUrl')
		.oneRequired();
	const assistantUser = await models.user(t).find({username: 'assistant:' + owner.platform.toString()})
		.select('id', 'platform', 'displayName', 'displayBio', 'displayAvatarUrl')
		.oneRequired();

	await createConversationMember(t, conversation.id, systemUser, addFlag(0, compileBit(ConversationMemberFlags.IsSystem)));
	await createConversationMember(t, conversation.id, assistantUser, addFlag(0, compileBit(ConversationMemberFlags.IsAssistant)));

	return conversation;
};

export const deleteConversation = async (t: Transaction, conversationId: Conversation['id']) => {
	await models.message(t).delete({conversation: conversationId});
	await models.conversationMember(t).delete({conversation: conversationId});
	await models.conversation(t).delete({id: conversationId});
};
