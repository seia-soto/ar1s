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

export class User extends Context {
	readonly platform: Platform;

	id: number;
	flag: number;
	username: string;
	displayName: string;
	displayAvatarUrl: string;
	displayBio?: string;

	constructor(
		context: Aris,
		platform: Platform,
		params: {
			id: User['id'];
			flag: User['flag'];
			username: User['username'];
			displayName: User['displayName'];
			displayAvatarUrl: User['displayAvatarUrl'];
			displayBio?: User['displayBio'];
		},
	) {
		super(context);

		this.platform = platform;

		this.id = params.id;
		this.flag = params.flag;

		if (checkUsername.check(params.username)) {
			throw useFormatError(checkUsername.errors(params.username));
		} else {
			this.username = params.username;
		}

		this.displayName = params.displayName;
		this.displayAvatarUrl = params.displayAvatarUrl;
		this.displayBio = params.displayBio;
	}
}
