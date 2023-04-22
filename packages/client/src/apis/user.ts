import {type UserReflection} from '../models/user.js';
import {type Fetcher} from './aatypes.js';

export const getCurrentUser = async (fetcher: Fetcher) => {
	const response = await fetcher('private/user', {method: 'get'});
	const reflection: UserReflection = await response.json();

	return reflection;
};

export const signIn = async (fetcher: Fetcher, username: string, password: string, isTrustedEnvironment: boolean) => {
	const response = await fetcher('session', {
		method: 'post',
		json: {
			username,
			password,
			isTrustedEnvironment,
		},
		throwHttpErrors: false,
	});

	return response.status === 200;
};

export const signOut = async (fetcher: Fetcher) => {
	await fetcher('session', {method: 'delete'});
};
