import {type Transaction} from '@databases/pg';
import {TypeSystem} from '@sinclair/typebox/system';
import {addFlag, removeFlag} from '../modules/bitwise.js';
import {db, models, useNumericTimestamp} from '../modules/database/index.js';
import {type User, type User_InsertParameters} from '../modules/database/schema/index.js';
import {createHash, validateHash} from '../modules/hash.js';
import {ValidationErrorCodes, useValidationError} from './error.js';
import {ConversationMemberFlags} from './conversationMember.js';
import {deleteConversation, getOwnedConversation} from './conversation.js';

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

export type UserInsertParams = Omit<User_InsertParameters, 'createdAt' | 'updatedAt'>;

export const createUser = async (t: Transaction, params: UserInsertParams) => {
	const now = new Date();

	params.password = await createHash(params.password);

	const [user] = await models.user(t).insert({
		...params,
		createdAt: now,
		updatedAt: now,
	});

	return useNumericTimestamp(user);
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

	await Promise.all((await getOwnedConversation(t, userId)).map(async conversation => deleteConversation(t, conversation.conversation)));

	await models.user(t).delete({id: userId});
};
