import {ConversationMemberFlags} from '@ar1s/spec/out/conversationMember.js';
import {compileBit, hasFlag} from '@ar1s/spec/out/utils/bitwise.js';
import {getConversation} from '../apis/conversation.js';
import {getConversationMembers} from '../apis/conversationMember.js';
import {getMessages} from '../apis/message.js';
import {NoEntityErrorCodes, useNoEntityError} from '../error.js';
import {type Aris, type Platform} from '../index.js';
import {Collection, Context, Series} from './aacontext.js';
import {ConversationMember} from './conversationMember.js';
import {Message} from './message.js';

export type ConversationReflection = {
	id: Conversation['id'];
	flag: Conversation['flag'];
	platform: Platform['id'];
	displayName: Conversation['displayName'];
	displayImageUrl: Conversation['displayImageUrl'];
	model: Conversation['model'];
	systemMessage: Conversation['systemMessage'];
	createdAt: string | Conversation['createdAt'];
	updatedAt: string | Conversation['updatedAt'];
};

/**
 * Conversation instance
 */
export class Conversation extends Context {
	readonly id: number & {__type: 'conversation.id'};
	flag: number;
	displayName: string;
	displayImageUrl: string;
	readonly model: string;
	readonly systemMessage: string;
	readonly createdAt: Date;
	updatedAt: Date;

	members?: Collection<ConversationMember>;
	profile?: ConversationMember;
	messages?: Series<Message>;

	constructor(
		readonly context: Aris,
		conversationRef: ConversationReflection,
	) {
		super(context, conversationRef.id);

		this.id = conversationRef.id;
		this.flag = conversationRef.flag;
		this.displayName = conversationRef.displayName;
		this.displayImageUrl = conversationRef.displayImageUrl;
		this.model = conversationRef.model;
		this.systemMessage = conversationRef.systemMessage;
		this.createdAt = new Date(conversationRef.createdAt);
		this.updatedAt = new Date(conversationRef.updatedAt);
	}

	/**
	 * Update data depends on reflection object
	 * @param params Conversation reflection object
	 */
	update(params: ConversationReflection) {
		this.flag = params.flag;
		this.displayName = params.displayName;
		this.displayImageUrl = params.displayImageUrl;
		this.updatedAt = new Date(params.updatedAt);
	}

	get membersRequired() {
		if (!this.members) {
			throw useNoEntityError(NoEntityErrorCodes.ConversationMember);
		}

		return this.members;
	}

	get profileRequired() {
		if (!this.profile) {
			throw useNoEntityError(NoEntityErrorCodes.ConversationMemberProfile);
		}

		return this.profile;
	}

	get messagesRequired() {
		if (!this.messages) {
			throw useNoEntityError(NoEntityErrorCodes.Message);
		}

		return this.messages;
	}

	get isOwnedByCurrentUser() {
		return hasFlag(this.profileRequired.flag, compileBit(ConversationMemberFlags.IsOwner));
	}

	/**
	 * Sync current conversation
	 */
	async sync() {
		const conversationRef = await getConversation(this.context.fetcher, this.id);

		this.update(conversationRef);
	}

	/**
	 * Sync members of current conversation
	 */
	async syncMembers() {
		const memberRefs = await getConversationMembers(this.context.fetcher, this.id);

		let profile: ConversationMember | undefined;

		this.members ??= new Collection();

		for (const memberRef of memberRefs) {
			const member = new ConversationMember(this.context, this, memberRef);

			if (member.isThisMemberCurrentUser) {
				profile = member;
			}

			this.members.set(member);
		}

		if (!profile) {
			throw useNoEntityError(NoEntityErrorCodes.ConversationMemberProfile);
		}

		this.profile = profile;
	}

	/**
	 * Sync messages of current conversation
	 */
	async syncMessages() {
		const messageRefs = await getMessages(this.context.fetcher, this.id);

		this.messages = new Series<Message>();

		for (const messageRef of messageRefs) {
			const message = new Message(this.context, this, this.profileRequired, messageRef);

			this.messages.add(message);
		}
	}
}
