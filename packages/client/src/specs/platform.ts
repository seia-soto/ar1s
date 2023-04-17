import {PlatformFormats} from '@ar1s/spec/out/platform.js';
import {Type} from '@sinclair/typebox';
import {useFormatError, type ServerError} from '../error.js';
import {type Options} from '../index.js';
import {createCompiledType} from '../utils.js';
import {type User} from './user.js';

export type Platform = {
	id: number;
	flag: number;
	inviteIdentifier: string;
	displayName: string;
	displayImageUrl: string;
	createdAt: string;
	updatedAt: string;
};

export const inviteType = createCompiledType(Type.String({
	format: PlatformFormats.InviteIdentifier,
}));

export const getDefaultPlatform = async (opts: Options) => {
	const response = await opts.fetcher('platform');
	const json = await response.json<Pick<Platform, 'id' | 'flag' | 'displayName' | 'displayImageUrl'>>();

	return json;
};

export const getPlatformByInvite = async (opts: Options, invite: Platform['inviteIdentifier']) => {
	if (!inviteType.check(invite)) {
		throw useFormatError(inviteType.errors(invite));
	}

	const response = await opts.fetcher('platform/invite/' + invite);
	const json = await response.json <Pick<Platform, 'id' | 'flag' | 'displayName' | 'displayImageUrl'>>();

	return json;
};

export const signUpOnPlatform = async (opts: Options, invite: Platform['inviteIdentifier'], user: {username: User['username']; password: string}) => {
	if (!inviteType.check(invite)) {
		throw useFormatError(inviteType.errors(invite));
	}

	const response = await opts.fetcher('platform/invite/' + invite, {
		method: 'post',
		json: {
			username: user.username,
			password: user.password,
		},
	});

	if (response.status !== 200) {
		const json = await response.json<ServerError>();

		throw new Error(json.message);
	}

	return true;
};
