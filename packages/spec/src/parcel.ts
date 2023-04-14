/* eslint-disable new-cap */
/**
 * Parcel is not the data type for core models.
 * It's used to receive data updates via WebSocket and live transactions.
 */
import {Type} from '@sinclair/typebox';

export enum ParcelTypes {
	PlatformUpdate = 'ar1s.platform.update',
	ConversationCreate = 'ar1s.conversation.create',
	ConversationUpdate = 'ar1s.conversation.update',
	ConversationDelete = 'ar1s.converastion.delete',
	ConversationMemberCreate = 'ar1s.conversationMember.create',
	ConversationMemberUpdate = 'ar1s.conversationMember.update',
	ConversationMemberDelete = 'ar1s.conversationMember.delete',
	MessageCreate = 'ar1s.message.create',
	MessageUpdate = 'ar1s.message.update',
	MessageDelete = 'ar1s.message.delete',
	NotifyMessageCreateOnConversation = 'ar1s._notify.messageCreateOnConversation',
	Acknowledge = 'ar1s._server.ack',
	Ignore = 'ar1s._server.ig',
}

export const streamablePlatformType = Type.Object({
	displayName: Type.String(),
	displayImageUrl: Type.String(),
});

export const platformUpdateParcelType = Type.Object({
	type: Type.Literal(ParcelTypes.PlatformUpdate),
	payload: streamablePlatformType,
});

export const streamableConversationType = Type.Object({
	id: Type.Number(),
	flag: Type.Number(),
	displayName: Type.String(),
	displayImageUrl: Type.String(),
	updatedAt: Type.String(),
});

export const conversationCreateParcelType = Type.Object({
	type: Type.Literal(ParcelTypes.ConversationCreate),
	payload: streamableConversationType,
});

export const conversationUpdateParcelType = Type.Object({
	type: Type.Literal(ParcelTypes.ConversationUpdate),
	payload: streamableConversationType,
});

export const conversationDeleteParcelType = Type.Object({
	type: Type.Literal(ParcelTypes.ConversationDelete),
	payload: Type.Number(),
});

export const streamableConversationMemberType = Type.Object({
	id: Type.Number(),
	flag: Type.Number(),
	createdAt: Type.String(),
	displayName: Type.String(),
	displayAvatarUrl: Type.String(),
	displayBio: Type.String(),
});

export const conversationMemberCreateParcelType = Type.Object({
	type: Type.Literal(ParcelTypes.ConversationMemberCreate),
	payload: streamableConversationMemberType,
});

export const conversationMemberUpdateParcelType = Type.Object({
	type: Type.Literal(ParcelTypes.ConversationMemberUpdate),
	payload: streamableConversationMemberType,
});

export const conversationMemberDeleteParcelType = Type.Object({
	type: Type.Literal(ParcelTypes.ConversationMemberDelete),
	payload: Type.Number(),
});

export const streamableMessageType = Type.Object({
	id: Type.Number(),
	flag: Type.Number(),
	platform: Type.Number(),
	author: Type.Number(),
	conversation: Type.Number(),
	content: Type.String(),
	createdAt: Type.String(),
	updatedAt: Type.String(),
});

export const messageCreateParcelType = Type.Object({
	type: Type.Literal(ParcelTypes.MessageCreate),
	payload: streamableMessageType,
});

export const messageUpdateParcelType = Type.Object({
	type: Type.Literal(ParcelTypes.MessageUpdate),
	payload: streamableMessageType,
});

export const messageDeleteParcelType = Type.Object({
	type: Type.Literal(ParcelTypes.MessageDelete),
	payload: Type.Number(),
});

export const notifyMessageCreateOnConversationParcelType = Type.Object({
	type: Type.Literal(ParcelTypes.NotifyMessageCreateOnConversation),
	payload: Type.Number(),
});

export const acknowledgeParcelType = Type.Object({
	type: Type.Literal(ParcelTypes.Acknowledge),
});

export const ignoreParcelType = Type.Object({
	type: Type.Literal(ParcelTypes.Ignore),
});

export const parcelTypes = Type.Union([
	platformUpdateParcelType,
	conversationCreateParcelType,
	conversationUpdateParcelType,
	conversationDeleteParcelType,
	conversationMemberCreateParcelType,
	conversationMemberUpdateParcelType,
	conversationMemberDeleteParcelType,
	messageCreateParcelType,
	messageUpdateParcelType,
	messageDeleteParcelType,
	notifyMessageCreateOnConversationParcelType,
	acknowledgeParcelType,
	ignoreParcelType,
]);

export enum ClientParcelTypes {
	Subscribe = 'ar1s._client.subscribe',
}

export const clientSubscribeParcelType = Type.Object({
	type: Type.Literal(ClientParcelTypes.Subscribe),
	payload: Type.Number(),
});

export const clientParcelTypes = Type.Union([
	clientSubscribeParcelType,
]);
