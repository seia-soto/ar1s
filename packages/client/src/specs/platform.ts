import {PlatformFlags, PlatformFormats} from '@ar1s/spec/out/platform.js';
import {UserFlags} from '@ar1s/spec/out/user.js';
import {addFlag, compileBit, hasFlag} from '@ar1s/spec/out/utils/bitwise.js';
import {Type} from '@sinclair/typebox';
import {useFormatError} from '../error.js';
import {type Aris} from '../index.js';
import {createCompiledType} from '../utils.js';
import {Collection, Context} from './_context.js';
import {User, checkPassword, checkUsername, type UserReflection} from './user.js';

export const checkInvite = createCompiledType(Type.String({
	format: PlatformFormats.InviteIdentifier,
}));

type PlatformReflection = {
	id: Platform['id'];
	flag: Platform['flag'];
	inviteIdentifier: Platform['inviteIdentifier'];
	displayName: Platform['displayName'];
	displayImageUrl: Platform['displayImageUrl'];
	createdAt: string | Platform['createdAt'];
	updatedAt: string | Platform['updatedAt'];
};

export class Platform extends Context {
	public static async from(context: Aris, inviteIdentifier?: Platform['inviteIdentifier']) {
		const platformResponse = inviteIdentifier
			? await context.fetcher('platform/invite/' + inviteIdentifier, {method: 'get'})
			: await context.fetcher('platform', {method: 'get'});
		const platformData: PlatformReflection & {
			createdAt: string;
			updatedAt: string;
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
	readonly createdAt: Date;
	updatedAt: Date;

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
		this.createdAt = new Date(params.createdAt);
		this.updatedAt = new Date(params.updatedAt);
	}

	update(params: PlatformReflection) {
		Platform.validate(params);

		this.flag = params.flag;
		this.displayName = params.displayName;
		this.displayImageUrl = params.displayImageUrl;
		this.updatedAt = new Date(params.updatedAt);

		this._copyUpdatedAt = new Date();

		return this;
	}

	async pullUsers() {
		this.requestElevationToPlatformMember();

		const response = await this._context.fetcher('private/platform/users', {method: 'get'});
		const json: UserReflection[] = await response.json();

		json.map(data => this.users.add(new User(this._context, data)));

		this.users.add(this._context.user!); // The existence of user is checked on `requestElevationToPlatformMember`

		return this;
	}

	async signIn(username: string, password: string, isTrustedEnvironment: boolean) {
		if (!checkUsername.check(username)) {
			throw useFormatError(checkUsername.errors(username));
		}

		if (!checkPassword.check(password)) {
			throw useFormatError(checkPassword.errors(password));
		}

		// Promise will be thrown if sign in failed with non 2xx status code
		await this._context.fetcher('session', {
			method: 'post',
			json: {
				username,
				password,
				isTrustedEnvironment,
			},
		});

		const user = await User.self(this._context);

		this._context.user = user;
		this.users.add(user);

		return this;
	}

	async signUp(username: string, password: string) {
		if (!checkUsername.check(username)) {
			throw useFormatError(checkUsername.errors(username));
		}

		if (!checkPassword.check(password)) {
			throw useFormatError(checkPassword.errors(password));
		}

		if (hasFlag(this.flag, compileBit(PlatformFlags.IsSignUpDisabled))) {
			throw new Error('Unauthorized: This platform is not open for the sign up!');
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

	async pushDisplayParams(params: {displayName?: Platform['displayName']; displayImageUrl?: Platform['displayImageUrl']}) {
		this.requestElevationToPlatformManager();

		await this._context.fetcher('private/manager/platform', {
			method: 'patch',
			json: params,
		});

		this.displayName = params.displayName ?? this.displayName;
		this.displayImageUrl = params.displayImageUrl ?? this.displayImageUrl;

		return this;
	}

	async pushOpt(params: {isSignUpDisabled: boolean}) {
		this.requestElevationToPlatformManager();

		await this._context.fetcher('private/manager/platform/opt', {
			method: 'patch',
			json: params,
		});

		if (params.isSignUpDisabled) {
			this.flag = addFlag(this.flag, compileBit(PlatformFlags.IsSignUpDisabled));
		}

		return this;
	}

	async delete() {
		this.requestElevationToPlatformManager();

		await this._context.fetcher('private/manager/platform', {method: 'delete'});

		this._context.platforms.del(this._enumerable);
	}

	async createUser(username: User['username'], password: string) {
		this.requestElevationToPlatformManager();

		await this._context.fetcher('private/manager/user', {
			method: 'post',
			json: {
				username,
				password,
			},
		});

		const response = await this._context.fetcher('private/manager/user/' + username, {
			method: 'get',
		});
		const json: UserReflection = await response.json();

		const user = new User(this._context, json);

		this.users.add(user);

		return user;
	}

	isSelfMemberOfPlatform() {
		return typeof this._context.user !== 'undefined' && this._context.user.platform === this.id;
	}

	isSelfPlatformManager() {
		return typeof this._context.user !== 'undefined' && hasFlag(this._context.user.flag, compileBit(UserFlags.PlatformManager));
	}

	requestElevationToPlatformMember() {
		if (!this.isSelfMemberOfPlatform()) {
			throw new Error('Unauthorized: Current user is not a member of the platform!');
		}
	}

	requestElevationToPlatformManager() {
		if (!this.isSelfPlatformManager()) {
			throw new Error('Unauthorized: Current user is not the platform manager!');
		}
	}
}
