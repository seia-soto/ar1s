import type ky from 'ky';
import {Collection, Series} from './specs/_context.js';
import {Conversation} from './specs/conversation.js';
import {ConversationMember} from './specs/conversationMember.js';
import {Message} from './specs/message.js';
import {Platform} from './specs/platform.js';
import {User} from './specs/user.js';

type Options = {
	fetcher: typeof ky;
};

/**
 * The Ar1s client
 */
class Aris {
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
