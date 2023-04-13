import {TypeSystem} from '@sinclair/typebox/system';

export enum ConversationFormats {
	Model = 'ar1s.conversation.model',
	SystemMessage = 'ar1s.conversation.systemMessage',
	DisplayName = 'ar1s.conversation.displayName',
}

export const formatModel = (value: string) => (
	!/[^a-z\d.-]/.test(value)
  && value.length >= 'gpt-n'.length
  && value.length < 32
);

// eslint-disable-next-line new-cap
TypeSystem.Format(ConversationFormats.Model, formatModel);

export const formatSystemMessage = (value: string) => (
	value.length < 1024
);

// eslint-disable-next-line new-cap
TypeSystem.Format(ConversationFormats.SystemMessage, formatSystemMessage);

export const formatDisplayName = (value: string) => (
	value.length >= 1
  && value.length < 32
);

// eslint-disable-next-line new-cap
TypeSystem.Format(ConversationFormats.DisplayName, formatDisplayName);
