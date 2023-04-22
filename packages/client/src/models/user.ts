import {UserFormats} from '@ar1s/spec/out/user.js';
import {Type} from '@sinclair/typebox';
import {createConversation, getConversations} from '../apis/conversation.js';
import {NoEntityErrorCodes, useFormatError, useNoEntityError} from '../error.js';
import {type Aris} from '../index.js';
import {createCompiledType} from '../utils.js';
import {Context} from './aacontext.js';
import {Conversation} from './conversation.js';
import {type Platform, type PlatformReflection} from './platform.js';

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

	conversations?: Conversation[];

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
			throw useNoEntityError(NoEntityErrorCodes.Conversation);
		}

		return this.conversations;
	}

	async syncConversations() {
		const conversationRefs = await getConversations(this.context.fetcher);

		this.conversations = conversationRefs.map(conversationRef => new Conversation(this.context, conversationRef));
	}

	async createConversation(model: string, systemMessage: string, displayName: string) {
		const conversationRef = await createConversation(this.context.fetcher, model, systemMessage, displayName);
		const conversation = new Conversation(this.context, conversationRef);

		this.conversations ??= [conversation];

		return conversation;
	}
}
