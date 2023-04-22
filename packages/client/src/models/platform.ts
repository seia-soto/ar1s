import {PlatformFormats} from '@ar1s/spec/out/platform.js';
import {Type} from '@sinclair/typebox';
import {useFormatError} from '../error.js';
import {type Aris} from '../index.js';
import {createCompiledType} from '../utils.js';
import {Context} from './aacontext.js';
import {getCurrentPlatform} from '../apis/platform.js';

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

	/**
	 * Sync the current platform
	 */
	async sync() {
		const platformRef = await getCurrentPlatform(this.context.fetcher);

		this.update(platformRef);
	}
}
