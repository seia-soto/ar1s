import {ParcelTypes, type StaticParcelTypes, type notifyMessageCreateOnConversationParcelType} from '@ar1s/spec/out/parcel.js';
import {type Static} from '@sinclair/typebox';
import {keydb} from '../keydb.js';
import {getConversationIdFromMessageParcel, isMessageParcel, validateServerParcelType} from './parcel.js';
import {getPeersByUser, isAllUserPeersOnlyConnectedInLocal, isPeerFocusingOnConversation} from './peer.js';

const pubsubNamespace = 'ar1s.delivery.pubsub';

type Package = {
	users: number[];
	parcel: StaticParcelTypes;
};

const unpack = (intertransactional: string) => JSON.parse(intertransactional) as Package;

const useNotificationPayloadIfPeerIsOutfocusedOnConversation = (peerId: string, parcel: StaticParcelTypes) => {
	if (!isMessageParcel(parcel)) {
		return parcel;
	}

	const conversationId = getConversationIdFromMessageParcel(parcel);

	if (isPeerFocusingOnConversation(peerId, conversationId)) {
		return parcel;
	}

	const notificationPayload: Static<typeof notifyMessageCreateOnConversationParcelType> = {
		type: ParcelTypes.NotifyMessageCreateOnConversation,
		payload: conversationId,
	};

	return notificationPayload;
};

const publishToLocalPeers = (user: number, parcel: StaticParcelTypes) => {
	const peers = getPeersByUser(user);

	for (const peer of peers) {
		peer.connection.socket.send(JSON.stringify(useNotificationPayloadIfPeerIsOutfocusedOnConversation(peer.id, parcel)));
	}
};

const handleIncomingMessage = (pkg: Package) => {
	// Ignore invalid message
	if (!validateServerParcelType(pkg.parcel)) {
		return;
	}

	const {users, parcel} = pkg;

	for (const user of users) {
		publishToLocalPeers(user, parcel);
	}
};

export const publish = async (users: number[], parcel: StaticParcelTypes) => {
	const isUsersConnectedOnlyInLocal = await Promise.all(users.map(async user => isAllUserPeersOnlyConnectedInLocal(user)));
	const usersInRemoteConnections: number[] = [];

	for (let i = 0; i < users.length; i++) {
		const user = users[i];

		if (!isUsersConnectedOnlyInLocal[i]) {
			usersInRemoteConnections.push(user);

			continue;
		}

		publishToLocalPeers(user, parcel);
	}

	const c = await keydb.acquire();

	await c.publish(pubsubNamespace, JSON.stringify({users: usersInRemoteConnections, parcel}));
	await keydb.release(c);
};

export const subscribe = async () => {
	const client = await keydb.acquire();

	await client.subscribe(pubsubNamespace, (data: string) => {
		const pkg = unpack(data);

		handleIncomingMessage(pkg);
	});
};
