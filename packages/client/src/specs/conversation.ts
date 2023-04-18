import {ConversationMemberFlags} from '@ar1s/spec/out/conversationMember.js';
import {compileBit, hasFlag} from '@ar1s/spec/out/utils/bitwise.js';
import {stringify} from 'qs';
import {type Aris, type Platform, type User} from '../index.js';
import {Collection, Context, Series} from './_context.js';
import {ConversationMember, type ConversationMemberReflection} from './conversationMember.js';
import {Message, type MessageReflection} from './message.js';

export type ConversationReflection = {
	id: Conversation['id'];
	flag: Conversation['flag'];
	platform: Platform['id'];
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
	readonly model: string;
	readonly systemMessage: string;
	readonly createdAt: Date;
	updatedAt: Date;

	members = new Collection<ConversationMember>();
	messages = new Series<Message>();

	/**
	 * The reference to self profile in `conversation.members` to reduce computation resource use
	 */
	private readonly _self?: ConversationMember;

	constructor(
		readonly _context: Aris,
		params: ConversationReflection,
	) {
		super(_context, params.id);

		this.id = params.id;
		this.flag = params.flag;
		this.model = params.model;
		this.systemMessage = params.systemMessage;
		this.createdAt = new Date(params.createdAt);
		this.updatedAt = new Date(params.updatedAt);
	}

	/**
	 * Update data depends on reflection object
	 * @param params Conversation reflection object
	 * @returns this
	 */
	update(params: ConversationReflection) {
		this.flag = params.flag;
		this.updatedAt = new Date(params.updatedAt);

		return this;
	}

	/**
	 * Pull everything under this data type object
	 * @returns this
	 */
	async pull() {
		await this.pullMembers();
		await this.pullMessages();

		return this;
	}

	/**
	 * Pull available conversation members of conversation from the server
	 * @returns this
	 */
	async pullMembers() {
		const response = await this._context.fetcher('private/conversation/' + this.id.toString() + '/members', {method: 'get'});
		const data: ConversationMemberReflection[] = await response.json();

		for (const json of data) {
			const member = new ConversationMember(this._context, json);

			this.members.add(member);
			this._context.conversationMembers.add(member);
		}

		return this;
	}

	/**
	 * Pull available messages of conversation from the server
	 * @param size The amount of messages to fetch
	 * @param before The message id to fetch past messages than the message
	 * @returns this
	 */
	async pullMessages(size = 100, before?: Message['id']) {
		const response = await this._context.fetcher('private/conversation/' + this.id.toString() + '/messages' + stringify({from: before ?? 1, size}), {method: 'get'});
		const data: MessageReflection[] = await response.json();

		for (const json of data) {
			const message = new Message(this._context, json);

			this.messages.add(message);
		}

		return this;
	}

	/**
	 * Add a user to this conversation (requires `ConversationMemberFlags.IsOwner`)
	 * @param userId The user identifier
	 * @returns The conversation member
	 */
	async createMember(userId: User['id']) {
		this.requestElevationToConversationOwner();

		const response = await this._context.fetcher('private/conversation/' + this.id.toString() + '/member/' + userId.toString());
		const data: ConversationMemberReflection = await response.json();

		const member = new ConversationMember(this._context, data);

		this.members.add(member);

		return member;
	}

	/**
	 * Delete the member from this conversation (requires `ConversationMemberFlags.IsOwner`)
	 * @param memberId The conversation member identifier
	 */
	async deleteMember(memberId: ConversationMember['id']) {
		this.requestElevationToConversationOwner();

		await this._context.fetcher('private/conversation/' + this.id.toString() + '/member/' + memberId.toString(), {method: 'delete'});

		for (const message of this.messages.values()) {
			if (message.author === memberId) {
				this.messages.del(message.id);
			}
		}

		this.members.del(memberId);
	}

	/**
	 * Send a message to the conversation
	 * @param content The content
	 */
	async createMessage(content: string) {
		await this._context.fetcher('private/conversation/' + this.id.toString() + '/message', {
			method: 'post',
			json: {
				content,
			},
		});
	}

	/**
	 * Delete the message
	 * @param messageId The message identifier
	 */
	async deleteMessage(messageId: Message['id']) {
		const message = this.messages.get(messageId);

		if (!message) {
			throw new Error('NotFound: The message is not exists!');
		}

		message.requestElevationToAuthor(false);

		await this._context.fetcher('private/conversation/' + this.id.toString() + '/message/' + message.id.toString(), {method: 'delete'});

		this.messages.del(messageId);
	}

	/**
	 * Get self profile from the conversation members
	 */
	get self() {
		if (this._self) {
			return this._self;
		}

		return this.members.values().find(member => member.user === this._context.user);
	}

	/**
	 * Check if the user is the owner of this conversation
	 * @returns True if the user is the owner of this conversation
	 */
	isSelfConversationOwner() {
		const me = this.self;

		if (!me) {
			return false;
		}

		return hasFlag(me.flag, compileBit(ConversationMemberFlags.IsOwner));
	}

	/**
	 * Throw an error if current user is not the owner of this conversation
	 */
	requestElevationToConversationOwner() {
		if (!this.isSelfConversationOwner()) {
			throw new Error('Unauthorized: Current user is not the conversation owner!');
		}
	}
}
