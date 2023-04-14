import {customAlphabet} from 'nanoid';
import {shouldEnvBeTypeOrFallback} from '../modules/env.js';
import {keydb} from '../modules/keydb.js';

shouldEnvBeTypeOrFallback('EVENT_TICKET_EXPIRATION', 1000 * 60 * 1);

const expiration = parseInt(process.env.EVENT_TICKET_EXPIRATION, 10) || 1000 * 60 * 1;

const createHash = customAlphabet('1234567890abcdef', 16);

export const eventNamespace = 'ar1s.event.tickets';

export const issueTicket = async (platformId: number, userId: number) => {
	const c = await keydb.acquire();

	const now = Date.now();
	const pin = `${now}${createHash()}`;

	await c.hSet(eventNamespace, pin, `${Date.now()}:${platformId}:${userId}`);
	await keydb.release(c);

	return pin;
};

export const retrieveTicket = async (pin: string) => {
	const c = await keydb.acquire();
	const v = await c.hGet(eventNamespace, pin);

	if (!v) {
		return false;
	}

	const [ts, platformId, userId] = pin.split(':');
	const tsN = parseInt(ts, 10);
	const platformIdN = parseInt(platformId, 10);
	const userIdN = parseInt(userId, 10);

	if (Date.now() > tsN + expiration) {
		await c.hDel(eventNamespace, pin);

		return false;
	}

	return {
		platformId: platformIdN,
		userId: userIdN,
	};
};
