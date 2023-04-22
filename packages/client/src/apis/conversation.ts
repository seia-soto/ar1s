import {type ConversationReflection} from '../models/conversation.js';
import {type Fetcher} from './aatypes.js';

export const getConversations = async (fetcher: Fetcher) => {
	const response = await fetcher('private/conversation', {method: 'get'});
	const conversationRefs: ConversationReflection[] = await response.json();

	return conversationRefs;
};

export const getConversation = async (fetcher: Fetcher, conversationId: number) => {
	const response = await fetcher('private/conversation/' + conversationId.toString(), {method: 'get'});
	const conversationRef: ConversationReflection = await response.json();

	return conversationRef;
};
