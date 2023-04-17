import {UserFormats} from '@ar1s/spec/out/user.js';
import {Type} from '@sinclair/typebox';
import {useFormatError} from '../error.js';
import {type Aris} from '../index.js';
import {createCompiledType} from '../utils.js';
import {Context} from './_context.js';
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
	displayBio?: User['displayBio'];
	createdAt?: string | User['createdAt'];
};

export class User extends Context {
	public static async self(context: Aris) {
		const response = await context.fetcher('private/user', {method: 'get'});
		const json: {
			id: User['id'];
			flag: User['flag'];
			platform: Platform['id'];
			username: User['username'];
			displayName: User['displayName'];
			displayAvatarUrl: User['displayAvatarUrl'];
			displayBio: User['displayBio'];
			createdAt: User['createdAt'];
		} = await response.json();

		return new User(context, json);
	}

	public static validate(params: UserReflection) {
		if (!checkUsername.check(params.username)) {
			throw useFormatError(checkUsername.errors(params.username));
		}
	}

	readonly id: number;
	flag: number;
	readonly username: string;
	displayName: string;
	displayAvatarUrl: string;
	displayBio?: string;
	createdAt?: Date;

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

		if (params.createdAt) {
			this.createdAt = new Date(params.createdAt);
		}
	}

	update(params: UserReflection) {
		User.validate(params);

		this.flag = params.flag;
		this.displayName = params.displayName;
		this.displayAvatarUrl = params.displayAvatarUrl;
		this.displayBio = params.displayBio;

		if (params.createdAt) {
			this.createdAt = new Date(params.createdAt);
		}

		this._copyUpdatedAt = new Date();
	}

	get platform() {
		return this._context.platforms.get(this._platform) ?? this._platform;
	}
}
