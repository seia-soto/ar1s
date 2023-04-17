import type ky from 'ky';
import {Collection} from './specs/_context.js';
import {type Platform} from './specs/platform.js';
import {type User} from './specs/user.js';

export type Options = {
	fetcher: typeof ky;
};

export class Aris {
	platforms = new Collection<Platform>();
	users = new Collection<User>();

	user?: User;

	constructor(
		readonly fetcher: typeof ky,
	) {}
}
