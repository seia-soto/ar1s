import {type Transaction} from '@databases/pg';
import {TypeSystem} from '@sinclair/typebox/system';
import {addFlag, compileBit} from '../modules/bitwise.js';
import {db, models} from '../modules/database/index.js';
import type Platform from '../modules/database/schema/platform.js';
import {type Platform_InsertParameters} from '../modules/database/schema/platform.js';
import {ValidationErrorCodes, useValidationError} from '../modules/error.js';
import {UserFlags, createUser, type UserInsertParams} from './user.js';

export enum PlatformFlags {
	Default = 0,
	IsSignUpDisabled,
}

export enum PlatformFormats {
	InviteIdentifier = 'ar1s.platform.inviteIdentifier',
	DisplayName = 'ar1s.platform.displayName',
}

export const formatInviteIdentifier = (value: string) => (
	!/[^a-zA-Z0-9]/.test(value)
	&& value.length >= 4
	&& value.length <= 24
);

// eslint-disable-next-line new-cap
TypeSystem.Format(PlatformFormats.InviteIdentifier, formatInviteIdentifier);

export const formatDisplayName = (value: string) => (
	value.length >= 4
	&& value.length <= 24
);

// eslint-disable-next-line new-cap
TypeSystem.Format(PlatformFormats.DisplayName, formatDisplayName);

export const isDefaultPlatformExists = async (t: Transaction) => {
	const flag = addFlag(0, PlatformFlags.Default);
	const exists = (await t.query(t.sql`select exists (
select 1 from ${t.sql.ident(models.platform(t).tableName)}
where flag & ${flag} = ${flag}
)`))[0].exists as boolean;

	return exists;
};

export const getDefaultPlatform = async (t: Transaction) => {
	const flag = addFlag(0, PlatformFlags.Default);

	return models.platform(t)
		.find(db.sql`flag & ${flag} = ${flag}`)
		.select('id', 'flag', 'displayName', 'displayImageUrl')
		.one();
};

export const getPlatformByInvite = async (t: Transaction, inviteIdentifier: string) => models.platform(t)
	.find({inviteIdentifier})
	.select('id', 'flag', 'displayName', 'displayImageUrl')
	.one();

export const createPlatform = async (t: Transaction, platformParams: Pick<Platform_InsertParameters, 'inviteIdentifier' | 'displayName' | 'displayImageUrl' | 'token'>, managerUserParams: Omit<UserInsertParams, 'platform'>, makePlatformDefault: boolean) => {
	// The platform will be created within sign up disabled state
	let flag = addFlag(0, compileBit(PlatformFlags.IsSignUpDisabled));

	if (makePlatformDefault) {
		if (await isDefaultPlatformExists(t)) {
			throw useValidationError(ValidationErrorCodes.PlatformDefaultShouldBeUnique);
		}

		flag = addFlag(flag, compileBit(PlatformFlags.Default));
	}

	const now = new Date();

	const [platform] = await models.platform(t).insert({
		flag,
		...platformParams,
		createdAt: now,
		updatedAt: now,
	});

	managerUserParams.flag = addFlag(managerUserParams.flag, UserFlags.PlatformManager);

	await createUser(t, {
		...managerUserParams,
		platform: platform.id,
	});

	// Create a system and an assistant user
	await createUser(t, {
		flag: addFlag(0, compileBit(UserFlags.System)),
		platform: platform.id,
		username: 'system:' + platform.id.toString(),
		displayName: 'System',
		displayBio: '',
		displayAvatarUrl: '',
		password: '',
	});
	await createUser(t, {
		flag: addFlag(0, compileBit(UserFlags.System)),
		platform: platform.id,
		username: 'assistant:' + platform.id.toString(),
		displayName: 'Assistant',
		displayBio: '',
		displayAvatarUrl: '',
		password: '',
	});

	return platform;
};

export const deletePlatform = async (t: Transaction, platformId: Platform['id']) => {
	await models.message(t).delete({platform: platformId});
	await models.conversationMember(t).delete({platform: platformId});
	await models.conversation(t).delete({platform: platformId});
	await models.user(t).delete({platform: platformId});
	await models.platform(t).delete({id: platformId});
};
