import {UserFlags, UserFormats} from '@ar1s/spec/out/user.js';
import {compileBit, hasFlag} from '@ar1s/spec/out/utils/bitwise.js';
import {Type} from '@sinclair/typebox';
import {useFormatError} from '../error.js';
import {type Aris} from '../index.js';
import {createCompiledType} from '../utils.js';
import {Collection, Context} from './_context.js';
import {Conversation, type ConversationReflection} from './conversation.js';
import {type Platform} from './platform.js';

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

export class User extends Context {
	public static async self(context: Aris) {
		const response = await context.fetcher('private/user', {method: 'get'});
		const json: UserReflection & {
			createdAt: string;
			updatedAt: string;
		} = await response.json();

		return new User(context, json);
	}

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

	conversations = new Collection<Conversation>();

	private readonly _platform: number;

	constructor(
		context: Aris,
		params: UserReflection,
	) {
		super(context, params.id);

		User.validate(params);

		this._platform = params.platform;

		this.id = params.id;
		this.flag = params.flag;
		this.username = params.username;
		this.displayName = params.displayName;
		this.displayAvatarUrl = params.displayAvatarUrl;
		this.displayBio = params.displayBio;
		this.createdAt = new Date(params.createdAt);
		this.updatedAt = new Date(params.updatedAt);
	}

	update(params: UserReflection) {
		User.validate(params);

		this.flag = params.flag;
		this.displayName = params.displayName;
		this.displayAvatarUrl = params.displayAvatarUrl;
		this.displayBio = params.displayBio;
		this.updatedAt = new Date(params.updatedAt);

		this._copyUpdatedAt = new Date();

		return this;
	}

	get platform(): Platform | number {
		return this._context.platforms.get(this._platform) ?? this._platform;
	}

	async pullConversations() {
		this.requestElevationToSelfProfile();

		const response = await this._context.fetcher('private/conversation', {
			method: 'get',
		});
		const json: ConversationReflection[] = await response.json();

		for (const data of json) {
			const entity = new Conversation(this._context, data);

			this.conversations.add(entity);
			this._context.conversations.add(entity);
		}

		return this;
	}

	async pushDisplayParams(params: {displayName?: User['displayName']; displayBio?: User['displayBio']; displayAvatarUrl?: User['displayAvatarUrl']}) {
		this.requestElevationToSelfProfile();

		await this._context.fetcher('private/user', {
			method: 'patch',
			json: params,
		});

		this.displayName = params.displayName ?? this.displayName;
		this.displayBio = params.displayBio ?? this.displayBio;
		this.displayAvatarUrl = params.displayAvatarUrl ?? this.displayAvatarUrl;

		return this;
	}

	async pushPassword(currentPassword: string, newPassword: string) {
		this.requestElevationToSelfProfile();

		if (!checkPassword.check(currentPassword)) {
			throw useFormatError(checkPassword.errors(currentPassword));
		}

		if (!checkPassword.check(newPassword)) {
			throw useFormatError(checkPassword.errors(newPassword));
		}

		await this._context.fetcher('private/user/password', {
			method: 'patch',
			json: {
				currentPassword,
				newPassword,
			},
		});

		return this;
	}

	async resign() {
		this.requestElevationToSelfProfile();

		await this._context.fetcher('private/user', {method: 'delete'});

		if (hasFlag(this.flag, compileBit(UserFlags.PlatformManager))) {
			if (typeof this.platform !== 'number') {
				this._context.platforms.del(this.platform._enumerable);
			}
		}
	}

	isSelfProfile() {
		return this._context.user === this;
	}

	requestElevationToSelfProfile() {
		if (!this.isSelfProfile()) {
			throw new Error('Unauthorized: Current user is not them!');
		}
	}
}
