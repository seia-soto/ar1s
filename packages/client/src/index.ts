import type ky from 'ky';
import {getDefaultPlatform, getPlatformByInvite, signUpOnPlatform} from './specs/platform';

export type Options = {
	fetcher: typeof ky;
};

export const ar1s = async (opts: Options) => ({
	getDefaultPlatform: getDefaultPlatform.bind(null, opts),
	getPlatformByInvite: getPlatformByInvite.bind(null, opts),
	signUpOnPlatform: signUpOnPlatform.bind(null, opts),
});
