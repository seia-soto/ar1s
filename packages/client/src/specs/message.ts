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

/**
 * Message instance
 */
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

	/**
	 * Get platform DTO, platform identifier if not available
	 */
	get platform(): Platform | Message['_platform'] {
		return this._context.platforms.get(this._platform) ?? this._platform;
	}

	/**
	 * Get conversation DTO, conversation identifier if not available
	 */
	get conversation(): Conversation | Message['_conversation'] {
		return this._context.conversations.get(this._conversation) ?? this._conversation;
	}

	/**
	 * Get conversationMember DTO, conversationMember identifier if not available
	 */
	get author(): ConversationMember | Message['_author'] {
		return this._context.conversationMembers.get(this._author) ?? this._author;
	}

	/**
	 * Delete the message
	 */
	async delete() {
		this.requestElevationToAuthor(false);

		await this._context.fetcher('private/conversation/' + this._conversation.toString() + '/message/' + this.id.toString(), {method: 'delete'});

		if (typeof this.conversation !== 'number') {
			this.conversation.messages.del(this.id);
		}
	}

	/**
	 * Check if current user is the message author
	 * @param strict Allow returning true if required data is not pulled
	 * @returns True if current user is the message author
	 */
	isSelfMessageAuthor(strict = true) {
		if (typeof this.author === 'number') {
			return !strict;
		}

		if (typeof this.author.user === 'number') {
			return !strict;
		}

		return this.author.user === this._context.user;
	}

	/**
	 * Throw an error if current user is not the message author
	 * @param strict Allow bypassing the check if required data is not pulled
	 */
	requestElevationToAuthor(strict = true) {
		if (!this.isSelfMessageAuthor(strict)) {
			throw new Error('Unauthorized: Current user is not the message author!');
		}
	}
}
