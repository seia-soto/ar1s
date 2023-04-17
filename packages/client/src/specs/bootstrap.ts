import {type Options} from '../index.js';
import {type Platform} from './platform.js';
import {type User} from './user';

export const bootstrap = async (opts: Options, params: {
	platform: {
		invite: Platform['inviteIdentifier'];
		displayName: Platform['displayName'];
		token: string;
	};
	user: {
		username: User['username'];
		password: string;
	};
}) => {
	await opts.fetcher('bootstrap', {
		method: 'post',
		json: params,
	});
};
