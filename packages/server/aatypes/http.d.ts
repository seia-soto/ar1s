/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type * as http from 'http';
import type internal from 'stream';
import {type kWsPin} from '../src/modules/ws.js';

declare module 'http' {
	export interface IncomingMessage extends IncomingMessage {
		[kWsPin]?: {
			isResolved?: true;
			socket: internal.Duplex;
			head: Buffer;
		};
	}
}
