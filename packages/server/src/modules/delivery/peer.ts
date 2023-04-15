import {keydb} from '../keydb.js';
import {type WebSocketWithConnection} from '../ws.js';

type Peer = {
	connection: WebSocketWithConnection;
	platform: number;
	user: number;
	data: {
		focusedOnConversation: number;
	};
};

export const pool: Record<string, Peer> = {};

export const statusNamespace = 'ar1s.delivery.status';

// Generation of the key with platform id reduces futher computational resource uses
export const generateKey = (platform: number, user: number) => `${platform}:${user}`;

export const getLocalPeer = (platform: number, user: number) => pool[generateKey(platform, user)];

export const getPeer = async (platform: number, user: number) => {
	const key = generateKey(platform, user);

	const c = await keydb.acquire();
	const v = await c.hGet(statusNamespace, key);

	return {
		local: pool[key],
		remote: v,
	};
};

export const setPeer = async (platform: number, user: number, connection: WebSocketWithConnection) => {
	const key = generateKey(platform, user);

	pool[key] = {
		connection,
		platform,
		user,
		data: {
			focusedOnConversation: 0,
		},
	};

	const c = await keydb.acquire();
	const connectionSizeString = await c.hGet(statusNamespace, key);

	if (!connectionSizeString) {
		await c.hSet(statusNamespace, key, 1);

		return;
	}

	await c.hIncrBy(statusNamespace, key, 1);
};

export const delPeer = async (platform: number, user: number) => {
	const key = generateKey(platform, user);

	// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
	delete pool[key];

	const c = await keydb.acquire();

	if (await c.hGet(statusNamespace, key) === '1') {
		await c.hDel(statusNamespace, key);

		return;
	}

	await c.hIncrBy(statusNamespace, key, -1);
};

export const isPeerFocusingOnConversation = async (platform: number, user: number, conversation: number) => {
	const peer = await getPeer(platform, user);

	if (typeof peer.local !== 'undefined' && peer.local.data.focusedOnConversation !== conversation) {
		return false;
	}

	// If peer is remotely connected, we cannot determine the focusing state
	// It's undeterminable as peer can use multiple devices at the time
	// Just publish!
	if (typeof peer.remote !== 'undefined') {
		return true;
	}

	return false;
};
