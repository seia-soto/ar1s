import {type Transaction} from '@databases/pg';
import {Type, type Static} from '@sinclair/typebox';
import {TypeSystem} from '@sinclair/typebox/system';
import {addFlag, removeFlag} from '../modules/bitwise.js';
import {models} from '../modules/database/index.js';
import {type User, type User_InsertParameters} from '../modules/database/schema/index.js';
import {createHash, validateHash} from '../modules/hash.js';
import {ValidationErrorCodes, useValidationError} from './error.js';

export enum UserFlags {
	Bootstrap = 0,
	PlatformManager,
	System,
	Assistant,
	IsUserDeactivated,
}

export enum UserFormats {
	Username = 'ar1s.user.username',
	Password = 'ar1s.user.password',
}

export const formatUsername = (value: string) => (
	!/[^a-z\d]/.test(value)
	&& value.length < 1
	&& value.length > 16
);

// eslint-disable-next-line new-cap
TypeSystem.Format(UserFormats.Username, formatUsername);

export const formatPassword = (value: string) => (
	value.length > 16
	&& value.length < 512
);

// eslint-disable-next-line new-cap
TypeSystem.Format(UserFormats.Password, formatPassword);

export const exportableUserType = Type.Object({
	username: Type.String({
		format: UserFormats.Username,
	}),
	displayName: Type.String(),
	displayAvatarUrl: Type.String(),
	displayBio: Type.String(),
	usedTokens: Type.Number(),
	usedMessages: Type.Number(),
	createdAt: Type.Number(),
	updatedAt: Type.Number(),
});

export const useExportableUser = (user: User): Static<typeof exportableUserType> => ({
	username: user.username,
	displayName: user.displayName,
	displayAvatarUrl: user.displayAvatarUrl,
	displayBio: user.displayBio,
	usedTokens: user.usedTokens,
	usedMessages: user.usedMessages,
	createdAt: user.createdAt.getTime(),
	updatedAt: user.updatedAt.getTime(),
});

export type UserInsertParams = Omit<User_InsertParameters, 'usedTokens' | 'usedMessages' | 'createdAt' | 'updatedAt'>;

export const createUser = async (t: Transaction, params: UserInsertParams) => {
	const now = new Date();

	params.password = await createHash(params.password);

	const [user] = await models.user(t).insert({
		...params,
		usedTokens: 0,
		usedMessages: 0,
		createdAt: now,
		updatedAt: now,
	});

	return user;
};

export const updateUserPassword = async (t: Transaction, userId: User['id'], currentPassword: string, newPassword: string) => {
	const user = await models.user(t).find({id: userId}).select('password').oneRequired();

	if (!await validateHash(user.password, currentPassword)) {
		throw useValidationError(ValidationErrorCodes.INVALID_CREDENTIALS);
	}

	const now = new Date();
	const hash = await createHash(newPassword);

	await models.user(t).update({id: userId}, {
		password: hash,
		updatedAt: now,
	});
};

export const updateUserDisplayParams = async (t: Transaction, userId: User['id'], params: Pick<User, 'displayName' | 'displayBio' | 'displayAvatarUrl'>) => {
	const now = new Date();

	await models.user(t).update({id: userId}, {
		...params,
		updatedAt: now,
	});
};

export const updateUserUsage = async (t: Transaction, userId: User['id'], usedTokens: number, usedMessages: number) => {
	const now = new Date();

	await models.user(t).update({id: userId}, {
		usedTokens,
		usedMessages,
		updatedAt: now,
	});
};

export const deactivateUser = async (t: Transaction, userId: User['id']) => {
	const now = new Date();
	const user = await models.user(t).find({id: userId}).select('flag').oneRequired();

	await models.user(t).update({id: userId}, {
		flag: addFlag(user.flag, UserFlags.IsUserDeactivated),
		updatedAt: now,
	});
};

export const activateUser = async (t: Transaction, userId: User['id']) => {
	const now = new Date();
	const user = await models.user(t).find({id: userId}).select('flag').oneRequired();

	await models.user(t).update({id: userId}, {
		flag: removeFlag(user.flag, UserFlags.IsUserDeactivated),
		updatedAt: now,
	});
};

export const deleteUser = async (t: Transaction, userId: User['id'], password: string) => {
	const user = await models.user(t).find({id: userId}).select('password').oneRequired();

	if (!await validateHash(user.password, password)) {
		throw useValidationError(ValidationErrorCodes.INVALID_CREDENTIALS);
	}

	await models.user(t).delete({id: userId});
};
