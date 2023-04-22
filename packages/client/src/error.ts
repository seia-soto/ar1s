import {type ValueErrorIterator} from '@sinclair/typebox/errors';

class FormatError extends Error {
	name = 'FORMAT_ERROR';
}

export const useFormatError = (iterator: ValueErrorIterator) => {
	const errors = [...iterator];
	const message = errors.map(validation => `${validation.message ?? 'Unexpected type'} for ${validation.path}`).join('; ');

	return new FormatError(message);
};

export const isFormatError = (error: unknown) => error instanceof FormatError;

export type ServerError = {
	code: string;
	message: string;
	statusCode: number;
};

class NoEntityError extends Error {
	name = 'ENOENT';
}

export const enum NoEntityErrorCodes {
	User = '`aris.user` is not available; The client is not signed in!',
	Conversation = '`user.conversations` is not available; The conversations of current user are not synced!',
	ConversationMember = '`conversation.members` is not available; The members of current conversation are not synced!',
	ConversationMemberProfile = '`conversation.profile` is not available; The current user is not joined in the conversation!',
	Message = '`conversation.messages` is not available; The messages of current conversation are not synced!',
}

export const useNoEntityError = (message: NoEntityErrorCodes) => new NoEntityError(message);

export const isNoEntityError = (error: unknown) => error instanceof NoEntityError;
