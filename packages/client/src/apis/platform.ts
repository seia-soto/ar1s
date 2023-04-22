import {type PlatformReflection} from '../models/platform.js';
import {type Fetcher} from './aatypes.js';

export const getCurrentPlatform = async (fetcher: Fetcher) => {
	const response = await fetcher('private/platform', {method: 'get'});
	const reflection: PlatformReflection = await response.json();

	return reflection;
};

export const getDefaultPlatform = async (fetcher: Fetcher) => {
	const response = await fetcher('platform', {method: 'get'});
	const reflection: PlatformReflection = await response.json();

	return reflection;
};

export const getInvitedPlatform = async (fetcher: Fetcher, invite: string) => {
	const response = await fetcher('platform/invite/' + invite, {method: 'get'});
	const reflection: PlatformReflection = await response.json();

	return reflection;
};

export const signUpOnPlatform = async (fetcher: Fetcher, invite: string, user: {username: string; password: string}) => {
	const response = await fetcher('platform/invite/' + invite, {
		method: 'post',
		json: user,
		throwHttpErrors: false,
	});

	return response.status === 200;
};

export const deletePlatform = async (fetcher: Fetcher) => {
	const response = await fetcher('platform', {method: 'delete', throwHttpErrors: false});

	return response.status === 200;
};
