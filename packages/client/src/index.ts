import type ky from 'ky';
import {Platform} from './specs/platform.js';
import {type User} from './specs/user.js';

export type Options = {
	fetcher: typeof ky;
};

export class Aris {
	platform?: Platform;
	user?: User;

	constructor(
		readonly fetcher: typeof ky,
	) {}

	async signIn(platformInviteIdentifier: Platform['inviteIdentifier'], username: User['username'], password: string, isTrustedEnvironment: boolean) {
		this.platform = await Platform.from(this, platformInviteIdentifier);

		await this.fetcher('session', {
			method: 'post',
			json: {
				username,
				password,
				isTrustedEnvironment,
			},
		});
	}

	async signUp(platformInviteIdentifier: Platform['inviteIdentifier'], username: User['username'], password: string, signInImmediately: false | {isTrustedEnvironment: boolean} = false) {
		this.platform = await Platform.from(this, platformInviteIdentifier);

		await this.platform.signUp(username, password);

		if (signInImmediately) {
			await this.signIn(platformInviteIdentifier, username, password, signInImmediately.isTrustedEnvironment);
		}
	}
}
