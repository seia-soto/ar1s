import {createClient} from 'redis';
import {keydb} from '../keydb.js';
import {getLocalPeer, getPeer} from './peer.js';

const pubsubNamespace = 'ar1s.delivery.pubsub';

export const pack = (platform: number, user: number, message: string) => JSON.stringify({platform, user, message});

export const unpack = (intertransactional: string) => JSON.parse(intertransactional) as {platform: number; user: number; message: string};

export const publish = async (platform: number, user: number, message: string) => {
	const peer = await getPeer(platform, user);

	// The peer is connected on remote
	if (typeof peer.local !== 'undefined') {
		peer.local.connection.socket.send(message);
	}

	if (typeof peer.remote === 'string' && peer.remote !== '1') {
		const c = await keydb.acquire();

		await c.publish(pubsubNamespace, pack(platform, user, message));
		await keydb.release(c);
	}
};

export const subscribe = async () => {
	const client = createClient();

	await client.connect();
	await client.subscribe(pubsubNamespace, (message: string, _channel: string) => {
		const transaction = unpack(message);
		const peer = getLocalPeer(transaction.platform, transaction.user);

		if (peer) {
			peer.connection.socket.send(transaction.message);
		}
	});
};
