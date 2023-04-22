import {type ConversationMemberReflection} from '../models/conversationMember.js';
import {type Fetcher} from './aatypes.js';

export const getConversationMembers = async (fetcher: Fetcher, conversationId: number) => {
	const response = await fetcher('private/conversation/' + conversationId.toString() + '/member', {method: 'get'});
	const reflections: ConversationMemberReflection[] = await response.json();

	return reflections;
};
