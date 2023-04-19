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

export type PlatformReflection = {
	id: Platform['id'];
	flag: Platform['flag'];
	inviteIdentifier: Platform['inviteIdentifier'];
	displayName: Platform['displayName'];
	displayImageUrl: Platform['displayImageUrl'];
	createdAt: string | Platform['createdAt'];
	updatedAt: string | Platform['updatedAt'];
};

/**
 * Platform instance
 */
export class Platform extends Context {
	/**
	 * Create self-reflected `Platform` instance
	 * @param context The Aris context
	 * @returns Platform reflecting self
	 */
	public static async self(context: Aris) {
		const response = await context.fetcher('private/platform', {method: 'get'});
		const data: PlatformReflection = await response.json();

		const platform = new Platform(context, data);

		return platform;
	}

	/**
	 * Initialize Platform object via `inviteIdentifier`
	 * @param context The Aris context
	 * @param inviteIdentifier The invite identifier of the platform
	 * @returns Platform
	 */
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

	/**
	 * Validate the reflection object
	 * @param params Platform reflection object
	 */
	public static validate(params: PlatformReflection) {
		if (!checkInvite.check(params.inviteIdentifier)) {
			throw useFormatError(checkInvite.errors(params.inviteIdentifier));
		}
	}

	readonly id: number & {__type: 'platform.id'};
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

	/**
	 * Update data depends on reflection object
	 * @param params The Platform reflection object
	 * @returns this
	 */
	update(params: PlatformReflection) {
		Platform.validate(params);

		this.flag = params.flag;
		this.displayName = params.displayName;
		this.displayImageUrl = params.displayImageUrl;
		this.updatedAt = new Date(params.updatedAt);

		this._copyUpdatedAt = new Date();

		return this;
	}

	/**
	 * Pull everything under this data type object
	 * @returns this
	 */
	async pull() {
		await this.pullUsers();

		return this;
	}

	/**
	 * Pull available users of platform from the server
	 * @returns this
	 */
	async pullUsers() {
		this.requestElevationToPlatformMember();

		const response = await this._context.fetcher('private/platform/users', {method: 'get'});
		const data: UserReflection[] = await response.json();

		for (const json of data) {
			const user = new User(this._context, json);

			this.users.add(user);
			this._context.users.add(user);
		}

		this.users.add(this._context.user!); // The existence of user is checked on `requestElevationToPlatformMember`

		return this;
	}

	/**
	 * Sign in to the platform
	 * @param username Username
	 * @param password Password
	 * @param isTrustedEnvironment True if the server should trust the browser and set longer cookie
	 * @returns this
	 */
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

	/**
	 * Sign up to the platform
	 * @param username Username
	 * @param password Password
	 * @returns this
	 */
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

	/**
	 * Update display related parameters of the Platform (requires `UserFlags.PlatformManager`)
	 * @param params Display related parameters in Platform reflection object
	 * @returns this
	 */
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

	/**
	 * Update opt-in features of the Platform (requires `UserFlags.PlatformManager`)
	 * @param params Opt-in features of the platform
	 * @returns this
	 */
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

	/**
	 * Delete the platform (requires `UserFlags.PlatformManager`)
	 */
	async delete() {
		this.requestElevationToPlatformManager();

		await this._context.fetcher('private/manager/platform', {method: 'delete'});

		delete this._context.platform;
		delete this._context.user;
	}

	/**
	 * Create an user belongs to the platform (requires `UserFlags.PlatformManager`)
	 * @param username Username
	 * @param password Password
	 * @returns User instance
	 */
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

	/**
	 * Delete the user via username (requires `UserFlags.PlatformManager`)
	 * @param username Username
	 */
	async deleteUser(username: User['username']) {
		await this._context.fetcher('private/manager/user/' + username, {method: 'delete'});
	}

	/**
	 * Check if current user is the member of the platform
	 * @returns True if current user is the member of the platform
	 */
	isSelfMemberOfPlatform() {
		return typeof this._context.user !== 'undefined' && this._context.platform === this;
	}

	/**
	 * Check if current user is the manager of the platform
	 * @returns True if current user is the manager of the platform
	 */
	isSelfPlatformManager() {
		return typeof this._context.user !== 'undefined' && hasFlag(this._context.user.flag, compileBit(UserFlags.PlatformManager));
	}

	/**
	 * Throw error if current user is not the platform member
	 */
	requestElevationToPlatformMember() {
		if (!this.isSelfMemberOfPlatform()) {
			throw new Error('Unauthorized: Current user is not a member of the platform!');
		}
	}

	/**
	 * Throw error if current user is not platform manager
	 */
	requestElevationToPlatformManager() {
		if (!this.isSelfPlatformManager()) {
			throw new Error('Unauthorized: Current user is not the platform manager!');
		}
	}
}
