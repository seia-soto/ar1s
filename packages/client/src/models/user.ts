import {UserFormats} from '@ar1s/spec/out/user.js';
import {Type} from '@sinclair/typebox';
import {createConversation, deleteConversation, getConversations} from '../apis/conversation.js';
import {NoEntityErrorCodes, useFormatError, useNoEntityError} from '../error.js';
import {type Aris} from '../index.js';
import {createCompiledType} from '../utils.js';
import {Collection, Context} from './aacontext.js';
import {Conversation} from './conversation.js';
import {type Platform, type PlatformReflection} from './platform.js';
import {deleteUser, getCurrentUser} from '../apis/user.js';

export const checkUsername = createCompiledType(Type.String({
	format: UserFormats.Username,
}));

export const checkPassword = createCompiledType(Type.String({
	format: UserFormats.Password,
}));

export type UserReflection = {
	id: User['id'];
	flag: User['flag'];
	platform: Platform['id'];
	username: User['username'];
	displayName: User['displayName'];
	displayAvatarUrl: User['displayAvatarUrl'];
	displayBio: User['displayBio'];
	createdAt: string | User['createdAt'];
	updatedAt: string | User['updatedAt'];
};

/**
 * The user instance
 */
export class User extends Context {
	/**
	 * Validate the parameters in User reflection object
	 * @param params User reflection object.
	 */
	public static validate(params: UserReflection) {
		if (!checkUsername.check(params.username)) {
			throw useFormatError(checkUsername.errors(params.username));
		}
	}

	readonly id: number & {__type: 'user.id'};
	flag: number;
	readonly username: string;
	displayName: string;
	displayAvatarUrl: string;
	displayBio: string;
	readonly createdAt: Date;
	updatedAt: Date;

	conversations?: Collection<Conversation>;

	constructor(
		context: Aris,
		userRef: UserReflection,
		readonly platform: Platform,
	) {
		super(context, userRef.id);

		User.validate(userRef);

		this.id = userRef.id;
		this.flag = userRef.flag;
		this.username = userRef.username;
		this.displayName = userRef.displayName;
		this.displayAvatarUrl = userRef.displayAvatarUrl;
		this.displayBio = userRef.displayBio;
		this.createdAt = new Date(userRef.createdAt);
		this.updatedAt = new Date(userRef.updatedAt);
	}

	/**
	 * Update data depends on reflection object
	 * @param params User reflection object
	 */
	update(params: UserReflection) {
		User.validate(params);

		this.flag = params.flag;
		this.displayName = params.displayName;
		this.displayAvatarUrl = params.displayAvatarUrl;
		this.displayBio = params.displayBio;
		this.updatedAt = new Date(params.updatedAt);

		this.copyUpdatedAt = new Date();
	}

	get conversationsRequired() {
		if (!this.conversations) {
			throw useNoEntityError(NoEntityErrorCodes.UserConversations);
		}

		return this.conversations;
	}

	async sync() {
		const userRef = await getCurrentUser(this.context.fetcher);

		this.update(userRef);
	}

	async syncConversations() {
		const conversationRefs = await getConversations(this.context.fetcher);

		this.conversations ??= new Collection();

		for (const conversationRef of conversationRefs) {
			const conversation = this.conversations.get(conversationRef.id);

			if (typeof conversation === 'undefined') {
				this.conversations.set(new Conversation(this.context, conversationRef));
			} else {
				conversation.update(conversationRef);
			}
		}
	}

	/**
	 * Create a conversation
	 * @param model The model to use
	 * @param systemMessage The system message to be emitted before conversation starts
	 * @param displayName The display name of the conversation
	 * @returns Conversation instance
	 */
	async createConversation(model: string, systemMessage: string, displayName: string) {
		const conversationRef = await createConversation(this.context.fetcher, model, systemMessage, displayName);
		const conversation = new Conversation(this.context, conversationRef);

		this.conversations ??= new Collection();

		this.conversations.set(conversation);

		return conversation;
	}

	/**
	 * Delete the conversation
	 * @param conversationId The conversation id to delete
	 */
	async deleteConversation(conversationId: Conversation['id']) {
		const conversation = this.conversationsRequired.get(conversationId);

		if (!conversation) {
			throw useNoEntityError(NoEntityErrorCodes.Conversation);
		}

		await conversation.delete();
	}

	/**
	 * Delete current user
	 */
	async delete() {
		await deleteUser(this.context.fetcher);

		delete this.context.user;
	}
}
