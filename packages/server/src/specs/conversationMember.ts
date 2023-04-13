import {type Transaction} from '@databases/pg';
import {models} from '../modules/database/index.js';
import {type Conversation, type ConversationMember, type User} from '../modules/database/schema/index.js';

export const getConversationMembers = async (t: Transaction, conversationId: Conversation['id']) => models.conversationMember(t)
	.find({conversation: conversationId});

export type ConversationMemberInsertParams = Pick<User, 'id' | 'platform' | 'displayName' | 'displayAvatarUrl' | 'displayBio'>;

export const createConversationMember = async (t: Transaction, conversationId: Conversation['id'], user: ConversationMemberInsertParams, flag = 0) => {
	const now = new Date();

	const [member] = await models.conversationMember(t).insert({
		flag,
		platform: user.platform,
		conversation: conversationId,
		user: user.id,
		displayName: '',
		displayAvatarUrl: '',
		displayBio: '',
		createdAt: now,
		updatedAt: now,
	});

	return member;
};

export const deleteConversationMember = async (t: Transaction, conversationMemberId: ConversationMember['id']) => {
	await models.message(t).delete({author: conversationMemberId});
	await models.conversationMember(t).delete({id: conversationMemberId});
};
