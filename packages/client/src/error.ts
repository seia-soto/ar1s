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
	// Entities
	User = '`user` is not available; The user is not found!',
	Platform = '`platform` is not available; The platform is not found!',
	Conversation = '`conversation` is not available; The conversation is not found!',
	ConversationMember = '`conversationMember` is not available! The conversation member is not found!',
	Message = '`message` is not available! The message is not found!',

	// Properties
	ArisUser = '`aris.user` is not available; The client is not signed in!',
	UserConversations = '`user.conversations` is not available; The conversations of current user are not synced!',
	ConversationMembers = '`conversation.members` is not available; The members of current conversation are not synced!',
	ConversationProfile = '`conversation.profile` is not available; The current user is not joined in the conversation!',
	ConversationMessages = '`conversation.messages` is not available; The messages of current conversation are not synced!',
}

export const useNoEntityError = (message: NoEntityErrorCodes) => new NoEntityError(message);

export const isNoEntityError = (error: unknown) => error instanceof NoEntityError;

class PermissionError extends Error {
	name = 'ENOPERM';
}

export const enum PermissionErrorCodes {
	ConversationOwner = '`conversation` is not controllable; The conversation is not owned by current user!',
}

export const usePermissionError = (message: PermissionErrorCodes) => new PermissionError(message);

export const isPermissionError = (error: unknown) => error instanceof PermissionError;
