import {type Transaction} from '@databases/pg';
import {TypeSystem} from '@sinclair/typebox/system';
import {addFlag, removeFlag} from '../modules/bitwise.js';
import {models} from '../modules/database/index.js';
import {type User, type User_InsertParameters} from '../modules/database/schema/index.js';
import {ValidationErrorCodes, useValidationError} from '../modules/error.js';
import {createHash, validateHash} from '../modules/hash.js';
import {deleteConversation, getOwnedConversations} from './conversation.js';

export enum UserFlags {
	Bootstrap = 0,
	PlatformManager,
	System,
	Assistant,
}

export enum UserFormats {
	Username = 'ar1s.user.username',
	Password = 'ar1s.user.password',
}

export const formatUsername = (value: string) => (
	!/[^a-z\d]/.test(value)
	&& value.length >= 1
	&& value.length <= 16
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

	return user;
};

export const updateUserPassword = async (t: Transaction, userId: User['id'], currentPassword: string, newPassword: string) => {
	const user = await models.user(t).find({id: userId}).select('password').oneRequired();

	if (!await validateHash(user.password, currentPassword)) {
		throw useValidationError(ValidationErrorCodes.InvalidCredentials);
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

export const deleteUser = async (t: Transaction, userId: User['id']) => {
	// Delete all data by userId
	await Promise.all((await getOwnedConversations(t, userId)).map(async conversation => deleteConversation(t, conversation.conversation)));

	// Delete all messages by userId
	await t.query(t.sql`delete from ${models.message(t).tableName}
where author in (
select id from ${models.conversationMember(t).tableName}
where ${models.user(t).tableName} = ${userId}
)`);

	// Delete all conversationMember by userId
	await models.conversationMember(t).delete({user: userId});

	await models.user(t).delete({id: userId});
};
