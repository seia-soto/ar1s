import {type Aris} from '../index.js';
import {Context} from './aacontext.js';
import {type Conversation} from './conversation.js';
import {type ConversationMember} from './conversationMember.js';
import {type Platform} from './platform.js';

export type MessageReflection = {
	id: Message['id'];
	flag: Message['flag'];
	platform: Platform['id'];
	author: ConversationMember['id'];
	conversation: Conversation['id'];
	content: Message['content'];
	createdAt: string | Message['createdAt'];
	updatedAt: string | Message['updatedAt'];
};

/**
 * Message instance
 */
export class Message extends Context {
	readonly id: number & {__type: 'message.id'};
	flag: number;
	content: string;
	readonly createdAt: Date;
	updatedAt: Date;

	constructor(
		readonly context: Aris,
		readonly conversation: Conversation,
		readonly author: ConversationMember,
		params: MessageReflection,
	) {
		super(context, params.id);

		this.id = params.id;
		this.flag = params.flag;
		this.content = params.content;
		this.createdAt = new Date(params.createdAt);
		this.updatedAt = new Date(params.updatedAt);
	}
}
