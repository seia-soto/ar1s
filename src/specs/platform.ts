import {type Transaction} from '@databases/pg';
import {addFlag} from '../modules/bitwise.js';
import {db, isExist, models, useNumericTimestamp} from '../modules/database/index.js';
import {ValidationErrorCodes, useValidationError} from './error.js';
import {UserFlags, createUser, type UserInsertParams} from './user.js';

export enum PlatformFlags {
	Default = 0,
	IsDeactivated,
	IsSignUpDisabled,
}

export const getPublicPlatforms = async (t: Transaction) => {
	const flag = addFlag(0, PlatformFlags.IsDeactivated);

	return models
		.platform(t)
		.find(db.sql`flag & ${flag} = ${flag}`)
		.select('id', 'displayName', 'displayImageUrl')
		.orderByAsc('id')
		.limit(3);
};

export const createPlatform = async (t: Transaction, platformName: string, managerUserParams: Omit<UserInsertParams, 'platform'>, makePlatformDefault: boolean) => {
	const defaultFlag = addFlag(0, PlatformFlags.Default);

	if (makePlatformDefault && await isExist(t, 'platform', 'flag', defaultFlag)) {
		throw useValidationError(ValidationErrorCodes.PLATFORM_DEFAULT_SHOULD_BE_UNIQUE);
	}

	const now = new Date();

	const [platform] = await models.platform(t).insert({
		flag: defaultFlag,
		displayName: platformName,
		displayImageUrl: '',
		token: '',
		usedTokens: 0,
		usedMessages: 0,
		createdAt: now,
		updatedAt: now,
	});

	managerUserParams.flag = addFlag(managerUserParams.flag, UserFlags.PlatformManager);

	await createUser(t, managerUserParams);

	return useNumericTimestamp(platform);
};
