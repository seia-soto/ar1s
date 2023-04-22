import {type Fetcher} from './aatypes.js';

export const bootstrap = async (
	fetcher: Fetcher,
	platform: {inviteIdentifier: string; displayName: string; token: string},
	user: {username: string; password: string},
) => fetcher('bootstrap', {
	method: 'post',
	json: {
		platform,
		user,
	},
});

export const isBootstrapRequired = async (fetcher: Fetcher) => {
	const response = await fetcher.extend({throwHttpErrors: false})('platform', {method: 'get'});

	return response.status === 404;
};
