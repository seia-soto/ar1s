import ky from 'ky';
import {bootstrap, isBootstrapRequired} from './apis/bootstrap.js';
import {getCurrentPlatform, getDefaultPlatform, getInvitedPlatform} from './apis/platform.js';
import {getCurrentUser, signIn, signOut} from './apis/user.js';
import {NoEntityErrorCodes, useNoEntityError} from './error.js';
import {Collection, Series} from './models/aacontext.js';
import {Conversation, type ConversationReflection} from './models/conversation.js';
import {ConversationMember, type ConversationMemberReflection} from './models/conversationMember.js';
import {Message, type MessageReflection} from './models/message.js';
import {Platform, type PlatformReflection} from './models/platform.js';
import {User, type UserReflection} from './models/user.js';
import {createConnectionToken} from './apis/event.js';

type Options = {
	fetcher: typeof ky;
};

/**
 * The Ar1s client
 */
class Aris {
	readonly fetcher: typeof ky;
	user?: User;
	ws?: WebSocket;

	constructor(
		readonly prefixUrl: string,
	) {
		this.fetcher = ky.extend({prefixUrl});
	}

	get userRequired() {
		if (!this.user) {
			throw useNoEntityError(NoEntityErrorCodes.User);
		}

		return this.user;
	}

	get wsRequired() {
		if (!this.ws) {
			throw useNoEntityError(NoEntityErrorCodes.WebSocket);
		}

		return this.ws;
	}

	/**
	 * Sync current session
	 */
	async sync() {
		const user = await getCurrentUser(this.fetcher);
		const platform = new Platform(this, await getCurrentPlatform(this.fetcher));

		this.user = new User(this, user, platform);
	}

	/**
	 * Sign in
	 * @param username The username
	 * @param password The password
	 * @param isTrustedEnvironment True if you want to be signed in longer
	 * @returns True if signed in
	 */
	async signIn(username: User['username'], password: string, isTrustedEnvironment: boolean) {
		return signIn(this.fetcher, username, password, isTrustedEnvironment);
	}

	/**
	 * Sign out
	 */
	async signOut() {
		await signOut(this.fetcher);

		delete this.user;
	}

	/**
	 * Check if an instance requires bootstrap
	 * @returns True if an instance has not been bootstrapped
	 */
	async isBootstrapRequired() {
		return isBootstrapRequired(this.fetcher);
	}

	/**
	 * Bootstrap the instance
	 * @param params Bootstrap params
	 * @returns this
	 */
	async bootstrap(
		platform: {
			inviteIdentifier: Platform['inviteIdentifier'];
			displayName: Platform['displayName'];
			token: string;
		},
		user: {
			username: User['username'];
			password: string;
		},
	) {
		await bootstrap(this.fetcher, platform, user);
	}

	/**
	 * Get platform
	 * @param invite The platform invite identifier
	 * @returns Platform object
	 */
	async getPlatform(invite?: Platform['inviteIdentifier']) {
		const platformRef = invite ? getInvitedPlatform(this.fetcher, invite) : getDefaultPlatform(this.fetcher);

		const platform = new Platform(this, await platformRef);

		return platform;
	}

	/**
	 * Connect to subscribe live events from the server
	 */
	async connect() {
		const token = await createConnectionToken(this.fetcher);

		const url = 'wss://' + window.location.host + this.prefixUrl + '/event/' + token;
		const ws = new WebSocket(url);

		ws.addEventListener('error', () => {
			delete this.ws;
		});
		ws.addEventListener('close', () => {
			delete this.ws;
		});
	}
}

/**
 * @public
 */
export {
	type Options,
	Aris,
	Conversation,
	type ConversationReflection,
	ConversationMember,
	type ConversationMemberReflection,
	Platform,
	type PlatformReflection,
	User,
	type UserReflection,
	Message,
	type MessageReflection,
	Series,
	Collection,
};
