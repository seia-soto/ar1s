import {type Transaction} from '@databases/pg';
import {TypeSystem} from '@sinclair/typebox/system/system.js';
import {addFlag} from '../modules/bitwise.js';
import {db, isExist, models, useNumericTimestamp} from '../modules/database/index.js';
import {ValidationErrorCodes, useValidationError} from './error.js';
import {UserFlags, createUser, type UserInsertParams} from './user.js';
import {type Platform_InsertParameters} from '../modules/database/schema/platform.js';

export enum PlatformFlags {
	Default = 0,
	IsDeactivated,
	IsSignUpDisabled,
	IsGroupConversationDisabled,
}

export enum PlatformFormats {
	InviteIdentifier = 'ar1s.platform.inviteIdentifier',
}

export const formatInviteIdentifier = (value: string) => (
	!/[^a-zA-Z0-9]/.test(value)
	&& value.length <= 4
	&& value.length >= 24
);

// eslint-disable-next-line new-cap
TypeSystem.Format(PlatformFormats.InviteIdentifier, formatInviteIdentifier);

export const getDefaultPlatform = async (t: Transaction) => {
	const flag = addFlag(0, PlatformFlags.Default);

	return models
		.platform(t)
		.find(db.sql`flag & ${flag} = ${flag}`)
		.select('id', 'displayName', 'displayImageUrl')
		.one();
};

export const createPlatform = async (t: Transaction, platformParams: Pick<Platform_InsertParameters, 'inviteIdentifier' | 'displayName' | 'displayImageUrl' | 'token'>, managerUserParams: Omit<UserInsertParams, 'platform'>, makePlatformDefault: boolean) => {
	const defaultFlag = addFlag(0, PlatformFlags.Default);

	if (makePlatformDefault && await isExist(t, 'platform', 'flag', defaultFlag)) {
		throw useValidationError(ValidationErrorCodes.PLATFORM_DEFAULT_SHOULD_BE_UNIQUE);
	}

	const now = new Date();

	const [platform] = await models.platform(t).insert({
		flag: defaultFlag,
		...platformParams,
		createdAt: now,
		updatedAt: now,
	});

	managerUserParams.flag = addFlag(managerUserParams.flag, UserFlags.PlatformManager);

	await createUser(t, managerUserParams);

	return useNumericTimestamp(platform);
};
