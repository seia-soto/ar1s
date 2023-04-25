import {type ConversationMemberReflection} from '../models/conversationMember.js';
import {type Fetcher} from './aatypes.js';

export const getConversationMembers = async (fetcher: Fetcher, conversationId: number) => {
	const response = await fetcher('private/conversation/' + conversationId.toString() + '/member', {method: 'get'});
	const reflections: ConversationMemberReflection[] = await response.json();

	return reflections;
};

export const addConversationMember = async (fetcher: Fetcher, conversationId: number, userId: number) => {
	const response = await fetcher('private/conversation/' + conversationId.toString() + '/member/' + userId.toString(), {method: 'post'});
	const reflection: ConversationMemberReflection = await response.json();

	return reflection;
};

export const removeConversationMember = async (fetcher: Fetcher, conversationId: number, memberId: number) => {
	const response = await fetcher('private/conversation/' + conversationId.toString() + '/member/' + memberId.toString(), {method: 'post'});

	return response.status === 200;
};
