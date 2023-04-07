import {type Transaction} from '@databases/pg';
import {addFlag} from '../modules/bitwise.js';
import {models} from '../modules/database/index.js';
import {type Conversation, type ConversationMember, type User} from '../modules/database/schema/index.js';

export enum ConversationMemberFlags {
	IsOwner = 0,
}

export const createConversationMember = async (t: Transaction, conversationId: Conversation['id'], user: User, isOwner = false) => {
	const now = new Date();

	let flag = 0;

	if (isOwner) {
		flag = addFlag(flag, ConversationMemberFlags.IsOwner);
	}

	const [member] = await models.conversationMember(t).insert({
		flag,
		conversation: conversationId,
		user: user.id,
		displayName: user.displayName,
		displayAvatarUrl: user.displayAvatarUrl,
		displayBio: user.displayBio,
		usedTokens: 0,
		usedMessages: 0,
		createdAt: now,
		updatedAt: now,
	});

	return member;
};

export const updateConversationMemberDisplayParams = async (t: Transaction, conversationMemberId: ConversationMember['id'], params: Pick<ConversationMember, 'displayName' | 'displayBio' | 'displayAvatarUrl'>) => {
	const now = new Date();

	await models.conversationMember(t).update({id: conversationMemberId}, {
		...params,
		updatedAt: now,
	});
};

export const deleteConversationMember = async (t: Transaction, conversationMemberId: ConversationMember['id']) => {
	await models.message(t).delete({author: conversationMemberId});
	await models.conversationMember(t).delete({id: conversationMemberId});
};
