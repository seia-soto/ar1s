import {type Aris} from '../index.js';
import {Context} from './_context.js';
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

export class Message extends Context {
	readonly id: number & {__type: 'message.id'};
	flag: number;
	content: string;
	readonly createdAt: Date;
	updatedAt: Date;

	private readonly _platform: Platform['id'];
	private readonly _conversation: Conversation['id'];
	private readonly _author: ConversationMember['id'];

	constructor(
		readonly _context: Aris,
		params: MessageReflection,
	) {
		super(_context, params.id);

		this.id = params.id;
		this.flag = params.flag;
		this.content = params.content;
		this.createdAt = new Date(params.createdAt);
		this.updatedAt = new Date(params.updatedAt);

		this._platform = params.platform;
		this._conversation = params.conversation;
		this._author = params.author;
	}

	get conversation(): Conversation | Message['_conversation'] {
		return this._context.conversations.get(this._conversation) ?? this._conversation;
	}

	get platform(): Platform | Message['_platform'] {
		return this._context.platforms.get(this._platform) ?? this._platform;
	}

	get author(): ConversationMember | Message['_author'] {
		return this._context.conversationMembers.get(this._author) ?? this._author;
	}
}
