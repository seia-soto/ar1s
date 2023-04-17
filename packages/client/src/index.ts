import type ky from 'ky';
import {bootstrap} from './specs/bootstrap.js';
import {getDefaultPlatform, getPlatformByInvite, signUpOnPlatform} from './specs/platform.js';

export type Options = {
	fetcher: typeof ky;
};

export const ar1s = async (opts: Options) => {
	opts.fetcher = opts.fetcher.extend({
		throwHttpErrors: true, // Do not allow non-2xx codes
	});

	return {
		public: {
			getDefaultPlatform: getDefaultPlatform.bind(null, opts),
			getPlatformByInvite: getPlatformByInvite.bind(null, opts),
			signUpOnPlatform: signUpOnPlatform.bind(null, opts),
			bootstrap: bootstrap.bind(null, opts),
		},
	};
};
