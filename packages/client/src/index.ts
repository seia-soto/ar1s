import type ky from 'ky';
import {Collection} from './specs/_context.js';
import {Conversation} from './specs/conversation.js';
import {ConversationMember} from './specs/conversationMember.js';
import {Platform} from './specs/platform.js';
import {User} from './specs/user.js';
import {Message} from './specs/message.js';

type Options = {
	fetcher: typeof ky;
};

class Aris {
	platforms = new Collection<Platform>();
	users = new Collection<User>();
	conversations = new Collection<Conversation>();
	conversationMembers = new Collection<ConversationMember>();

	user?: User;

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
};
