import {type Aris} from '../index.js';
import {Context} from './aacontext.js';
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

	private readonly userId: User['id'];
	private readonly conversationId: Conversation['id'];

	constructor(
		readonly context: Aris,
		readonly conversation: Conversation,
		params: ConversationMemberReflection,
	) {
		super(context, params.id);

		this.id = params.id;
		this.flag = params.flag;
		this.displayName = params.displayName;
		this.displayAvatarUrl = params.displayAvatarUrl;
		this.displayBio = params.displayBio;
		this.createdAt = new Date(params.createdAt);
		this.updatedAt = new Date(params.updatedAt);

		this.userId = params.user;
		this.conversationId = params.conversation;
	}

	update(params: ConversationMemberReflection) {
		this.flag = params.flag;
		this.displayName = params.displayName;
		this.displayAvatarUrl = params.displayAvatarUrl;
		this.displayBio = params.displayBio;
		this.updatedAt = new Date(params.updatedAt);

		this.copyUpdatedAt = new Date();
	}

	get isThisMemberCurrentUser() {
		return this.context.userRequired.id === this.userId;
	}
}
