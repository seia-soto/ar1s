import {type Transaction} from '@databases/pg';
import {models} from '../modules/database/index.js';
import {type Message, type Conversation, type ConversationMember} from '../modules/database/schema/index.js';

export const createMessage = async (t: Transaction, conversationId: Conversation['id'], author: ConversationMember['id'], content: string) => {
	const now = new Date();

	const [message] = await models.message(t).insert({
		flag: 0,
		author,
		conversation: conversationId,
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
