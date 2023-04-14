/**
 * Parcel is not the data type for core models.
 * It's used to receive data updates via WebSocket and live transactions.
 */
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
	Subscribe = 'ar1s._client.subscribe',
	Acknowledge = 'ar1s._generic.ack',
}

export type PlatformUpdateParcel = {
	type: ParcelTypes.PlatformUpdate;
	payload: {
		displayName: string;
		displayImageUrl: string;
	};
};

export type StreamableConversation = {
	id: number;
	flag: number;
	displayName: string;
	displayImageUrl: string;
	updatedAt: string;
};

export type ConversationCreateParcel = {
	type: ParcelTypes.ConversationCreate;
	payload: StreamableConversation;
};

export type ConversationUpdateParcel = {
	type: ParcelTypes.ConversationUpdate;
	payload: StreamableConversation;
};

export type ConversationDeleteParcel = {
	type: ParcelTypes.ConversationDelete;
	payload: {
		id: number;
	};
};

export type StreamableConversationMember = {
	id: number;
	flag: number;
	createdAt: number;
	displayName: string;
	displayAvatarUrl: string;
	displayBio: string;
};

export type ConversationMemberCreateParcel = {
	type: ParcelTypes.ConversationMemberCreate;
	payload: StreamableConversationMember;
};

export type ConversationMemberUpdateParcel = {
	type: ParcelTypes.ConversationMemberUpdate;
	payload: StreamableConversationMember;
};

export type ConversationMemberDeleteParcel = {
	type: ParcelTypes.ConversationMemberDelete;
	payload: {
		id: number;
	};
};

export type StreamableMessage = {
	id: number;
	flag: number;
	platform: number;
	author: number;
	conversation: number;
	content: string;
	createdAt: string;
	updatedAt: string;
};

export type MessageCreateParcel = {
	type: ParcelTypes.MessageCreate;
	payload: StreamableMessage;
};

export type MessageUpdateParcel = {
	type: ParcelTypes.MessageUpdate;
	payload: StreamableMessage;
};

export type MessageDeleteParcel = {
	type: ParcelTypes.MessageDelete;
	payload: StreamableMessage;
};

export type NotifyMessageCreateOnConversationParcel = {
	type: ParcelTypes.NotifyMessageCreateOnConversation;
	payload: {
		conversationId: number;
	};
};

export type SubscribeParcel = {
	type: ParcelTypes.Subscribe;
	payload: {
		conversationId: number;
	};
};

export type AcknowledgeParcel = {
	type: ParcelTypes.Acknowledge;
};

export type Parcel = PlatformUpdateParcel
| ConversationCreateParcel
| ConversationUpdateParcel
| ConversationDeleteParcel
| ConversationMemberCreateParcel
| ConversationMemberUpdateParcel
| ConversationMemberDeleteParcel
| MessageCreateParcel
| MessageUpdateParcel
| MessageDeleteParcel
| NotifyMessageCreateOnConversationParcel
| SubscribeParcel
| AcknowledgeParcel;
