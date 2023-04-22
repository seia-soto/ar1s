import {PlatformFormats} from '@ar1s/spec/out/platform.js';
import {UserFlags} from '@ar1s/spec/out/user.js';
import {compileBit, hasFlag} from '@ar1s/spec/out/utils/bitwise.js';
import {Type} from '@sinclair/typebox';
import {deletePlatform, getCurrentPlatform, getUsers} from '../apis/platform.js';
import {NoEntityErrorCodes, PermissionErrorCodes, useFormatError, useNoEntityError, usePermissionError} from '../error.js';
import {User, type Aris} from '../index.js';
import {createCompiledType} from '../utils.js';
import {Collection, Context} from './aacontext.js';

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

	users?: Collection<User>;

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
	 */
	update(params: PlatformReflection) {
		Platform.validate(params);

		this.flag = params.flag;
		this.displayName = params.displayName;
		this.displayImageUrl = params.displayImageUrl;
		this.updatedAt = new Date(params.updatedAt);

		this.copyUpdatedAt = new Date();
	}

	get usersRequired() {
		if (!this.users) {
			throw useNoEntityError(NoEntityErrorCodes.PlatformUsers);
		}

		return this.users;
	}

	get isManagedByCurrentUser() {
		return hasFlag(this.context.userRequired.flag, compileBit(UserFlags.PlatformManager));
	}

	/**
	 * Sync current platform
	 */
	async sync() {
		const platformRef = await getCurrentPlatform(this.context.fetcher);

		this.update(platformRef);
	}

	/**
	 * Sync users of current platform
	 */
	async syncUsers() {
		const userRefs = await getUsers(this.context.fetcher);

		this.users ??= new Collection();

		for (const userRef of userRefs) {
			this.users.set(new User(this.context, userRef, this));
		}
	}

	/**
	 * Delete current platform
	 */
	async delete() {
		if (!this.isManagedByCurrentUser) {
			throw usePermissionError(PermissionErrorCodes.PlatformManager);
		}

		await deletePlatform(this.context.fetcher);
	}
}
