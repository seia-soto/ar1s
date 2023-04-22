import {type MessageReflection} from '../models/message.js';
import {type Fetcher} from './aatypes.js';

export const getMessages = async (fetcher: Fetcher, conversationId: number) => {
	const response = await fetcher('private/conversation/' + conversationId.toString() + '/messages', {method: 'get'});
	const messageRefs: MessageReflection[] = await response.json();

	return messageRefs;
};
