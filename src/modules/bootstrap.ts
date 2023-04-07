import {createPlatform} from '../specs/platform.js';
import {UserFlags} from '../specs/user.js';
import {addFlag} from './bitwise.js';
import {db, isExist} from './database/index.js';
import {shouldEnvBeString} from './env.js';

export const bootstrapIfRequired = async () => db.tx(async t => {
	console.log('Bootstrapping the Ar1s platform...');

	if (!await isExist(t, 'platform', 'id', 1)) {
		console.log('- The platform is already bootstrapped!');

		return;
	}

	shouldEnvBeString('INIT_PLATFORM_NAME');
	shouldEnvBeString('INIT_USER_USERNAME');
	shouldEnvBeString('INIT_USER_PASSWORD');

	console.log('Building the Ar1s platform...');

	await createPlatform(t, process.env.INIT_PLATFORM_NAME, {
		flag: addFlag(0, UserFlags.Bootstrap),
		username: process.env.INIT_USER_USERNAME,
		password: process.env.INIT_USER_PASSWORD,
		displayName: '',
		displayAvatarUrl: '',
		displayBio: '',
	}, true);

	console.log('+ Bootstrapped the Ar1s platform!');
});
