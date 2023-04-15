import {ParcelTypes, type notifyMessageCreateOnConversationParcelType, type parcelTypes} from '@ar1s/spec/out/parcel.js';
import {type Static} from '@sinclair/typebox';
import {createClient} from 'redis';
import {keydb} from '../keydb.js';
import {getConversationIdFromMessageParcel, isMessageParcel, validateServerParcelType} from './parcel.js';
import {getLocalPeer, getPeer, isPeerFocusingOnConversation} from './peer.js';

const pubsubNamespace = 'ar1s.delivery.pubsub';

const pack = (platform: number, user: number, message: string) => JSON.stringify({platform, user, message});

const unpack = (intertransactional: string) => JSON.parse(intertransactional) as {platform: number; user: number; message: string};

export const publish = async (platform: number, user: number, message: Static<typeof parcelTypes>) => {
	const peer = await getPeer(platform, user);
	const payload = JSON.stringify(message);

	const toLocal = async () => {
		peer.local.connection.socket.send(payload);
	};

	// We DO CHECK the focusing state on subscription section in REMOTE
	const toRemote = async () => {
		const c = await keydb.acquire();

		await c.publish(pubsubNamespace, pack(platform, user, payload));
		await keydb.release(c);
	};

	// The peer is connected on local
	if (typeof peer.local !== 'undefined') {
		await toLocal();

		// The peer is connected on local and remote indicates there are more connections
		if (typeof peer.remote === 'string' && peer.remote !== '1') {
			await toRemote();
		}

		return;
	}

	// The peer is connected on remote
	if (typeof peer.remote === 'string') {
		await toRemote();
	}
};

export const subscribe = async () => {
	const client = createClient();

	await client.connect();
	await client.subscribe(pubsubNamespace, async (message: string, _channel: string) => {
		const transaction = unpack(message);
		const peer = getLocalPeer(transaction.platform, transaction.user);

		const parcel = JSON.parse(transaction.message) as unknown;

		// Ignore invalid message
		if (!validateServerParcelType(parcel)) {
			return;
		}

		if (isMessageParcel(parcel)) {
			const conversationId = getConversationIdFromMessageParcel(parcel);

			if (!await isPeerFocusingOnConversation(transaction.platform, transaction.user, conversationId)) {
				const notificationPayload: Static<typeof notifyMessageCreateOnConversationParcelType> = {
					type: ParcelTypes.NotifyMessageCreateOnConversation,
					payload: conversationId,
				};

				peer.connection.socket.send(JSON.stringify(notificationPayload));
			}
		}

		if (peer) {
			peer.connection.socket.send(transaction.message);
		}
	});
};
