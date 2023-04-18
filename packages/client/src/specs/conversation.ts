import {type Aris} from '../index.js';
import {Collection, Context, Series} from './_context.js';
import {ConversationMember, type ConversationMemberReflection} from './conversationMember.js';
import {type MessageReflection, Message} from './message.js';
import {type Platform} from './platform.js';

export type ConversationReflection = {
	id: Conversation['id'];
	flag: Conversation['flag'];
	platform: Conversation['_platform'];
	model: Conversation['model'];
	systemMessage: Conversation['systemMessage'];
	createdAt: string | Conversation['createdAt'];
	updatedAt: string | Conversation['updatedAt'];
};

export class Conversation extends Context {
	readonly id: number & {__type: 'conversation.id'};
	flag: number;
	readonly model: string;
	readonly systemMessage: string;
	readonly createdAt: Date;
	updatedAt: Date;

	members = new Collection<ConversationMember>();
	messages = new Series<Message>();

	private readonly _platform: Platform['id'];

	constructor(
		readonly _context: Aris,
		params: ConversationReflection,
	) {
		super(_context, params.id);

		this._platform = params.platform;

		this.id = params.id;
		this.flag = params.flag;
		this.model = params.model;
		this.systemMessage = params.systemMessage;
		this.createdAt = new Date(params.createdAt);
		this.updatedAt = new Date(params.updatedAt);
	}

	update(params: ConversationReflection) {
		this.flag = params.flag;
		this.updatedAt = new Date(params.updatedAt);

		return this;
	}

	get platform(): Platform | number {
		return this._context.platforms.get(this._platform) ?? this._platform;
	}

	async pullMembers() {
		const response = await this._context.fetcher('private/conversation/' + this.id.toString() + '/members', {method: 'get'});
		const data: ConversationMemberReflection[] = await response.json();

		for (const json of data) {
			const member = new ConversationMember(this._context, json);

			this.members.add(member);
			this._context.conversationMembers.add(member);
		}

		return this;
	}

	async pullMessages() {
		const response = await this._context.fetcher('private/conversation/' + this.id.toString() + '/messages?from=1&size=400', {method: 'get'});
		const data: MessageReflection[] = await response.json();

		for (const json of data) {
			const message = new Message(this._context, json);

			this.messages.add(message);
		}

		return this;
	}
}
