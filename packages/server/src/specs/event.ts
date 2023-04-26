import {customAlphabet} from 'nanoid';
import {shouldEnvBeTypeOrFallback} from '../modules/env.js';
import {keydb} from '../modules/keydb.js';
import {TypeSystem} from '@sinclair/typebox/system';

export enum EventFormats {
	Pin = 'ar1s.event.pin',
}

export const formatPin = (value: string) => {
	if (value.length < 13 + 16 - 1) {
		return false;
	}

	const ts = value.slice(0, 13);

	if (ts.includes('.') || isNaN(parseInt(ts, 10))) {
		return false;
	}

	return true;
};

// eslint-disable-next-line new-cap
TypeSystem.Format(EventFormats.Pin, formatPin);

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

	await keydb.release(c);

	if (!v) {
		return false;
	}

	const [ts, platformId, userId] = v.split(':');
	const tsN = parseInt(ts, 10);
	const platformIdN = parseInt(platformId, 10);
	const userIdN = parseInt(userId, 10);

	if (
		isNaN(tsN) || isNaN(platformIdN) || isNaN(userIdN)
		|| Date.now() > tsN + expiration
	) {
		await c.hDel(eventNamespace, pin);

		return false;
	}

	return {
		platformId: platformIdN,
		userId: userIdN,
	};
};
