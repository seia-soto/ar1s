import type ky from 'ky';
import {Collection} from './specs/_context.js';
import {type Conversation} from './specs/conversation.js';
import {type ConversationMember} from './specs/conversationMember.js';
import {type Platform} from './specs/platform.js';
import {type User} from './specs/user.js';

export type Options = {
	fetcher: typeof ky;
};

export class Aris {
	platforms = new Collection<Platform>();
	users = new Collection<User>();
	conversations = new Collection<Conversation>();
	conversationMembers = new Collection<ConversationMember>();

	user?: User;

	constructor(
		readonly fetcher: typeof ky,
	) {}
}
