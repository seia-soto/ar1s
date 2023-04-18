import ky from 'ky';
import {Collection, Series} from './specs/_context.js';
import {Conversation} from './specs/conversation.js';
import {ConversationMember} from './specs/conversationMember.js';
import {Message} from './specs/message.js';
import {Platform, type PlatformReflection} from './specs/platform.js';
import {User} from './specs/user.js';

type Options = {
	fetcher: typeof ky;
};

/**
 * The Ar1s client
 */
class Aris {
	public static createFetcher(baseUrl: string) {
		return ky.extend({
			prefixUrl: baseUrl,
		});
	}

	platforms = new Collection<Platform>();
	users = new Collection<User>();
	conversations = new Collection<Conversation>();
	conversationMembers = new Collection<ConversationMember>();

	user?: User;

	/**
	 * @param fetcher The `ky` instance. You should create an extended fetcher that matches backend url
	 */
	constructor(
		readonly fetcher: typeof ky,
	) {}

	/**
	 * Check if an instance requires bootstrap
	 * @returns True if an instance has not been bootstrapped
	 */
	async isBootstrapRequired() {
		const response = await this.fetcher('platform', {method: 'get'})
			.catch(_error => false as const);

		if (!response) {
			return true;
		}

		const data: PlatformReflection = await response.json();

		this.platforms.add(new Platform(this, data));

		return false;
	}

	/**
	 * Bootstrap the instance
	 * @param params Bootstrap params
	 * @returns this
	 */
	async bootstrap(params: {
		platformInviteIdentifier: Platform['inviteIdentifier'];
		platformDisplayName: Platform['displayName'];
		platformToken: string;
		userUsername: User['username'];
		userPassword: string;
	}) {
		await this.fetcher('bootstrap', {
			method: 'post',
			json: {
				platform: {
					inviteIdentifier: params.platformInviteIdentifier,
					displayName: params.platformDisplayName,
					token: params.platformToken,
				},
				user: {
					username: params.userUsername,
					password: params.userPassword,
				},
			},
		});

		return this;
	}
}

/**
 * @public
 */
export {
	type Options,
	Aris,
	Conversation,
	ConversationMember,
	Platform,
	User,
	Message,
	Collection,
	Series,
};
