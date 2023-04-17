import {PlatformFormats} from '@ar1s/spec/out/platform.js';
import {Type} from '@sinclair/typebox';
import {useFormatError} from '../error.js';
import {type Aris} from '../index.js';
import {createCompiledType} from '../utils.js';
import {Collection, Context} from './_context.js';
import {type User, checkPassword, checkUsername} from './user.js';

export const checkInvite = createCompiledType(Type.String({
	format: PlatformFormats.InviteIdentifier,
}));

type PlatformReflection = {
	id: Platform['id'];
	flag: Platform['flag'];
	inviteIdentifier: Platform['inviteIdentifier'];
	displayName: Platform['displayName'];
	displayImageUrl: Platform['displayImageUrl'];
	createdAt?: string | Platform['createdAt'];
	updatedAt?: string | Platform['updatedAt'];
};

export class Platform extends Context {
	public static async from(context: Aris, inviteIdentifier?: Platform['inviteIdentifier']) {
		const platformResponse = inviteIdentifier
			? await context.fetcher('platform/invite/' + inviteIdentifier, {method: 'get'})
			: await context.fetcher('platform', {method: 'get'});
		const platformData: {
			id: Platform['id'];
			flag: Platform['flag'];
			inviteIdentifier: Platform['inviteIdentifier'];
			displayName: Platform['displayName'];
			displayImageUrl: Platform['displayImageUrl'];
		} = await platformResponse.json();

		const platform = new Platform(context, platformData);

		return platform;
	}

	public static validate(params: PlatformReflection) {
		if (!checkInvite.check(params.inviteIdentifier)) {
			throw useFormatError(checkInvite.errors(params.inviteIdentifier));
		}
	}

	readonly id: number;
	flag: number;
	readonly inviteIdentifier: string;
	displayName: string;
	displayImageUrl: string;
	createdAt?: Date;
	updatedAt?: Date;

	users = new Collection<User>();

	constructor(
		context: Aris,
		params: PlatformReflection,
	) {
		super(context, params.id);

		Platform.validate(params);

		this.id = params.id;
		this.flag = params.flag;
		this.inviteIdentifier = params.inviteIdentifier;
		this.displayName = params.displayName;
		this.displayImageUrl = params.displayImageUrl;

		if (params.createdAt) {
			this.createdAt = new Date(params.createdAt);
		}

		if (params.updatedAt) {
			this.updatedAt = new Date(params.updatedAt);
		}
	}

	update(params: PlatformReflection) {
		Platform.validate(params);

		this.flag = params.flag;
		this.displayName = params.displayName;
		this.displayImageUrl = params.displayImageUrl;

		if (params.createdAt) {
			this.createdAt = new Date(params.createdAt);
		}

		if (params.updatedAt) {
			this.updatedAt = new Date(params.updatedAt);
		}

		this._copyUpdatedAt = new Date();

		return this;
	}

	async signUp(username: string, password: string) {
		if (!checkUsername.check(username)) {
			throw useFormatError(checkUsername.errors(username));
		}

		if (!checkPassword.check(password)) {
			throw useFormatError(checkPassword.errors(password));
		}

		await this._context.fetcher('platform/invite/' + this.inviteIdentifier, {
			method: 'post',
			json: {
				username,
				password,
			},
		});

		return this;
	}
}
