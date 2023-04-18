import {type Aris} from '../index.js';
import {Context} from './_context.js';
import {type Conversation} from './conversation.js';
import {type Platform} from './platform.js';
import {type User} from './user.js';

export type ConversationMemberReflection = {
	id: ConversationMember['id'];
	flag: ConversationMember['flag'];
	platform: Platform['id'];
	conversation: Conversation['id'];
	user: User['id'];
	displayName: ConversationMember['displayName'];
	displayAvatarUrl: ConversationMember['displayAvatarUrl'];
	displayBio: ConversationMember['displayBio'];
	createdAt: string | ConversationMember['createdAt'];
	updatedAt: string | ConversationMember['updatedAt'];
};

/**
 * Conversation member instance
 */
export class ConversationMember extends Context {
	readonly id: number & {__type: 'conversationMember.id'};
	flag: number;
	displayName: string;
	displayAvatarUrl: string;
	displayBio: string;
	readonly createdAt: Date;
	updatedAt: Date;

	private readonly _platform: Platform['id'];
	private readonly _conversation: Conversation['id'];
	private readonly _user: User['id'];

	constructor(
		readonly _context: Aris,
		params: ConversationMemberReflection,
	) {
		super(_context, params.id);

		this.id = params.id;
		this.flag = params.flag;
		this.displayName = params.displayName;
		this.displayAvatarUrl = params.displayAvatarUrl;
		this.displayBio = params.displayBio;
		this.createdAt = new Date(params.createdAt);
		this.updatedAt = new Date(params.updatedAt);

		this._platform = params.platform;
		this._conversation = params.conversation;
		this._user = params.user;
	}

	/**
	 * Get platform DTO, platform identifier if not available
	 */
	get platform(): Platform | ConversationMember['_platform'] {
		return this._context.platforms.get(this._platform) ?? this._platform;
	}

	/**
	 * Get conversation DTO, conversation identifier if not available
	 */
	get conversation(): Conversation | ConversationMember['_conversation'] {
		return this._context.conversations.get(this._conversation) ?? this._conversation;
	}

	/**
	 * Get user DTO, user identifier if not available
	 */
	get user(): User | ConversationMember['_user'] {
		return this._context.users.get(this._user) ?? this._user;
	}

	/**
	 * Delete the member
	 */
	async delete() {
		if (typeof this.conversation === 'number') {
			throw new Error('NotFound: The conversation data object is not pulled!');
		}

		await this.conversation.deleteMember(this.id);
	}
}
