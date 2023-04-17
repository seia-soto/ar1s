import {PlatformFlags} from '@ar1s/spec/out/platform.js';
import {compileBit, hasFlag} from '@ar1s/spec/out/utils/bitwise.js';
import type ky from 'ky';
import {Collection} from './specs/_context.js';
import {Platform} from './specs/platform.js';
import {User} from './specs/user.js';

export type Options = {
	fetcher: typeof ky;
};

export class Aris {
	platforms = new Collection<Platform>();
	users = new Collection<User>();

	user?: User;

	constructor(
		readonly fetcher: typeof ky,
	) {}

	async signIn(platformInviteIdentifier: Platform['inviteIdentifier'], username: User['username'], password: string, isTrustedEnvironment: boolean) {
		const platform = await Platform.from(this, platformInviteIdentifier);

		this.platforms.add(platform);

		// Promise will be thrown if sign in failed with non 2xx status code
		await this.fetcher('session', {
			method: 'post',
			json: {
				username,
				password,
				isTrustedEnvironment,
			},
		});

		const user = await User.self(this);

		this.user = user;

		platform.users.add(user);
		this.users.add(user);

		return this;
	}

	async signUp(platformInviteIdentifier: Platform['inviteIdentifier'], username: User['username'], password: string) {
		const platform = await Platform.from(this, platformInviteIdentifier);

		this.platforms.add(platform);

		if (hasFlag(platform.flag, compileBit(PlatformFlags.IsSignUpDisabled))) {
			throw new Error('Unauthorized: This platform is not open for sign up!');
		}

		await platform.signUp(username, password);

		return this;
	}
}
