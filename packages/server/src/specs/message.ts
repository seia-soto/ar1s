import {type Transaction} from '@databases/pg';
import {models} from '../modules/database/index.js';
import {type Conversation, type ConversationMember, type Message, type Platform} from '../modules/database/schema/index.js';

export type MessageRelationParams = {
	platform: Platform['id'];
	conversation: Conversation['id'];
	user: ConversationMember['id'];
};

export const createMessage = async (t: Transaction, relations: MessageRelationParams, content: string) => {
	const now = new Date();

	const [message] = await models.message(t).insert({
		flag: 0,
		platform: relations.platform,
		author: relations.user,
		conversation: relations.conversation,
		content,
		createdAt: now,
		updatedAt: now,
	});

	return message;
};

export const modifyMessage = async (t: Transaction, messageId: Message['id'], content: string) => {
	const now = new Date();

	await models.message(t).update({id: messageId}, {content, updatedAt: now});
};

export const deleteMessage = async (t: Transaction, messageId: Message['id']) => models.message(t).delete({id: messageId});
