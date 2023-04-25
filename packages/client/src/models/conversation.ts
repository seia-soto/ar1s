import {ConversationMemberFlags} from '@ar1s/spec/out/conversationMember.js';
import {compileBit, hasFlag} from '@ar1s/spec/out/utils/bitwise.js';
import {deleteConversation, getConversation} from '../apis/conversation.js';
import {addConversationMember, getConversationMembers} from '../apis/conversationMember.js';
import {createMessage, getMessages} from '../apis/message.js';
import {NoEntityErrorCodes, PermissionErrorCodes, useNoEntityError, usePermissionError} from '../error.js';
import {type User, type Aris, type Platform} from '../index.js';
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
			throw useNoEntityError(NoEntityErrorCodes.ConversationMembers);
		}

		return this.members;
	}

	get profileRequired() {
		if (!this.profile) {
			throw useNoEntityError(NoEntityErrorCodes.ConversationProfile);
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
			const member = this.members.get(memberRef.id);

			if (typeof member === 'undefined') {
				const newMember = new ConversationMember(this.context, this, memberRef);

				if (newMember.isThisMemberCurrentUser) {
					profile = newMember;
				}

				this.members.set(newMember);
			} else {
				member.update(memberRef);
			}
		}

		if (!profile) {
			throw useNoEntityError(NoEntityErrorCodes.ConversationProfile);
		}

		this.profile = profile;
	}

	/**
	 * Sync messages of current conversation
	 */
	async syncMessages() {
		const messageRefs = await getMessages(this.context.fetcher, this.id);

		this.messages ??= new Series<Message>();

		for (const messageRef of messageRefs) {
			const message = this.messages.get(messageRef.id);

			if (typeof message === 'undefined') {
				this.messages.add(new Message(this.context, this, this.profileRequired, messageRef));
			} else {
				message.update(messageRef);
			}
		}
	}

	/**
	 * Delete current conversation
	 */
	async delete() {
		if (!this.isOwnedByCurrentUser) {
			throw usePermissionError(PermissionErrorCodes.ConversationOwner);
		}

		await deleteConversation(this.context.fetcher, this.id);

		this.context.userRequired.conversationsRequired.delete(this.id);
	}

	/**
	 * Add user to current conversation
	 * @param userId The user identifier in same platform
	 */
	async addMember(userId: User['id']) {
		if (!this.isOwnedByCurrentUser) {
			throw usePermissionError(PermissionErrorCodes.ConversationOwner);
		}

		const memberRef = await addConversationMember(this.context.fetcher, this.id, userId);
		const member = new ConversationMember(this.context, this, memberRef);

		this.members ??= new Collection();

		this.members.set(member);

		return member;
	}

	/**
	 * Remove user from current conversation
	 * @param memberId The conversation member identifier in current conversation
	 */
	async removeMember(memberId: ConversationMember['id']) {
		const member = this.membersRequired.get(memberId);

		if (!member) {
			throw useNoEntityError(NoEntityErrorCodes.ConversationMember);
		}

		await member.delete();
	}

	/**
	 * Create message on current conversation
	 * @param content The message content
	 */
	async createMessage(content: Message['content']) {
		await createMessage(this.context.fetcher, this.id, content);
	}
}
