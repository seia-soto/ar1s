import {type Aris} from '../index.js';
import {Context} from './_context.js';
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
	readonly id: number;
	flag: number;
	readonly model: string;
	readonly systemMessage: string;
	readonly createdAt: Date;
	updatedAt: Date;

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
}
