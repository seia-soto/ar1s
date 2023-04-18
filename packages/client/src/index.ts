import ky from 'ky';
import {Collection, Series} from './specs/_context.js';
import {Conversation, type ConversationReflection} from './specs/conversation.js';
import {ConversationMember, type ConversationMemberReflection} from './specs/conversationMember.js';
import {Message, type MessageReflection} from './specs/message.js';
import {Platform, type PlatformReflection} from './specs/platform.js';
import {User, type UserReflection} from './specs/user.js';

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

	users = new Collection<User>();
	conversations = new Collection<Conversation>();
	conversationMembers = new Collection<ConversationMember>();

	platform?: Platform;
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

		this.platform = new Platform(this, data);

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
	type ConversationReflection,
	ConversationMember,
	type ConversationMemberReflection,
	Platform,
	type PlatformReflection,
	User,
	type UserReflection,
	Message,
	type MessageReflection,
	Collection,
	Series,
};
