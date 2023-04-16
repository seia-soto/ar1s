import {nanoid} from 'nanoid';
import {keydb} from '../keydb.js';
import {type WebSocketWithConnection} from '../ws.js';

type Peer = {
	id: string;
	user: number;
	connection: WebSocketWithConnection;
	data: {
		focusedOnConversation: number;
	};
};

export const pool = new Map<string, Peer>();
export const poolMappedByUser: Record<number, Peer[]> = {};

export const statusNamespace = 'ar1s.delivery.peer';

export const getPeerConnectionCountInCluster = async (c: Awaited<ReturnType<typeof keydb['acquire']>>, userIdStr: string) => {
	const v = await c.hGet(statusNamespace, userIdStr);

	if (!v) {
		return 0;
	}

	return parseInt(v, 10);
};

export const peerIdLocks: Record<string, false> = {};

const createPeerId = () => {
	let id: string;

	do {
		id = nanoid(16);
	} while (!pool.has(id) && typeof peerIdLocks[id] === 'undefined');

	peerIdLocks[id] = false;

	const unlock = () => {
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete peerIdLocks[id];
	};

	return {
		id,
		unlock,
	};
};

export const registerPeer = async (user: number, connection: WebSocketWithConnection) => {
	const {id, unlock} = createPeerId();
	const peer = {
		id,
		user,
		connection,
		data: {
			focusedOnConversation: 0,
		},
	};

	pool.set(id, peer);

	unlock();

	poolMappedByUser[user] ||= [];
	poolMappedByUser[user].push(peer);

	const c = await keydb.acquire();

	await c.hIncrBy(statusNamespace, user.toString(), 1);

	return id;
};

export const unregisterPeer = async (id: string) => {
	const peer = pool.get(id);

	if (!peer) {
		return;
	}

	const u = peer.user.toString();
	const c = await keydb.acquire();
	const v = await getPeerConnectionCountInCluster(c, u);

	if (v === 1) {
		await c.hDel(statusNamespace, u);
	} else {
		await c.hIncrBy(statusNamespace, u, -1);
	}

	// Release but there's no need wait
	void keydb.release(c);

	// Filter by comparing the Object reference
	poolMappedByUser[peer.user] = poolMappedByUser[peer.user].filter(mapped => mapped !== peer);

	// Delete
	pool.delete(id);
};

export const getPeersByUser = (user: number) => poolMappedByUser[user] || [];

export const getPeerById = (id: string) => pool.get(id);

export const isAllUserPeersOnlyConnectedInLocal = async (user: number) => {
	const c = await keydb.acquire();

	return getPeersByUser(user).length === await getPeerConnectionCountInCluster(c, user.toString());
};

export const isPeerFocusingOnConversation = (id: string, conversation: number) => {
	const peer = getPeerById(id);

	if (!peer) {
		return false;
	}

	return peer.data.focusedOnConversation === conversation;
};
