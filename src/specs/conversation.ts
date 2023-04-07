import {type Transaction} from '@databases/pg';
import {type Conversation, type User} from '../modules/database/schema/index.js';
import {models} from '../modules/database/index.js';
import {createConversationMember} from './conversationMember.js';

export type ConversationInsertParams = {
	model: string;
	systemMessage: string;
};

export const createConversation = async (t: Transaction, owner: User, params: ConversationInsertParams) => {
	const now = new Date();

	const [conversation] = await models.conversation(t).insert({
		flag: 0,
		model: params.model,
		systemMessage: params.systemMessage,
		displayName: `Another ${owner.displayName}'s room`,
		displayImageUrl: '',
		usedTokens: 0,
		usedMessages: 0,
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
