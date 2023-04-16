import {ConversationMemberFlags} from '@ar1s/spec/out/conversationMember.js';
import {addFlag, compileBit} from '@ar1s/spec/out/utils/bitwise.js';
import {type Transaction} from '@databases/pg';
import {models} from '../modules/database/index.js';
import {type Conversation, type ConversationMember, type User} from '../modules/database/schema/index.js';

export const getConversationMembers = async (t: Transaction, conversationId: Conversation['id']) => models.conversationMember(t)
	.find({conversation: conversationId});

export const getHumanConversationMemberIds = async (t: Transaction, conversationId: Conversation['id']) => {
	const ownerFlag = addFlag(0, compileBit(ConversationMemberFlags.IsOwner));
	const members = await t.query(t.sql`select id from ${t.sql.ident(models.conversationMember(t).tableName)}
where conversation = ${conversationId}
and (flag = 0 or flag & ${ownerFlag} = ${ownerFlag})`) as Array<Pick<ConversationMember, 'id'>>;

	return members.map(member => member.id);
};

export type ConversationMemberInsertParams = Pick<User, 'id' | 'platform'>;

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
