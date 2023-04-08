import {type Transaction} from '@databases/pg';
import {type Conversation, type User} from '../modules/database/schema/index.js';
import {db, models} from '../modules/database/index.js';
import {ConversationMemberFlags, createConversationMember} from './conversationMember.js';
import {addFlag} from '../modules/bitwise.js';

export type ConversationInsertParams = {
	model: string;
	systemMessage: string;
};

export const getOwnedConversation = async (t: Transaction, userId: User['id']) => {
	const isUserConversationOwner = addFlag(0, ConversationMemberFlags.IsOwner);
	const ownedConversations = await models.conversationMember(t)
		.find(db.sql`flag & ${isUserConversationOwner} = ${isUserConversationOwner}`)
		.andWhere({user: userId})
		.select('conversation')
		.all();

	return ownedConversations;
};

export const createConversation = async (t: Transaction, owner: User, params: ConversationInsertParams) => {
	const now = new Date();

	const [conversation] = await models.conversation(t).insert({
		flag: 0,
		model: params.model,
		systemMessage: params.systemMessage,
		displayName: '',
		displayImageUrl: '',
		createdAt: now,
		updatedAt: now,
	});

	await createConversationMember(t, conversation.id, owner, true);

	return conversation;
};

export const updateConversationDisplayParams = async (t: Transaction, conversationId: Conversation['id'], params: Pick<Conversation, 'displayName' | 'displayImageUrl'>) => {
	const now = new Date();

	await models.conversation(t).update({id: conversationId}, {
		...params,
		updatedAt: now,
	});
};

export const deleteConversation = async (t: Transaction, conversationId: Conversation['id']) => {
	await models.message(t).delete({conversation: conversationId});
	await models.conversationMember(t).delete({conversation: conversationId});
	await models.conversation(t).delete({id: conversationId});
};
