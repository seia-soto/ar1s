import {PlatformFormats} from '@ar1s/spec/out/platform.js';
import {Type} from '@sinclair/typebox';
import {useFormatError} from '../error.js';
import {type Aris} from '../index.js';
import {createCompiledType} from '../utils.js';
import {Context} from './_context.js';
import {checkPassword, checkUsername} from './user.js';

export const checkInvite = createCompiledType(Type.String({
	format: PlatformFormats.InviteIdentifier,
}));

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

	id: number;
	flag: number;
	inviteIdentifier: string;
	displayName: string;
	displayImageUrl: string;
	createdAt?: Date;
	updatedAt?: Date;

	constructor(
		context: Aris,
		params: {
			id: Platform['id'];
			flag: Platform['flag'];
			inviteIdentifier: Platform['inviteIdentifier'];
			displayName: Platform['displayName'];
			displayImageUrl: Platform['displayImageUrl'];
			createdAt?: string | Platform['createdAt'];
			updatedAt?: string | Platform['updatedAt'];
		},
	) {
		super(context);

		this.id = params.id;
		this.flag = params.flag;

		if (checkInvite.check(params.inviteIdentifier)) {
			this.inviteIdentifier = params.inviteIdentifier;
		} else {
			throw useFormatError(checkInvite.errors(params.inviteIdentifier));
		}

		this.displayName = params.displayName;
		this.displayImageUrl = params.displayImageUrl;

		if (params.createdAt) {
			this.createdAt = new Date(params.createdAt);
		}

		if (params.updatedAt) {
			this.updatedAt = new Date(params.updatedAt);
		}
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
