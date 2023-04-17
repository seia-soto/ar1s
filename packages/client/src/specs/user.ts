import {Type} from '@sinclair/typebox';
import {createCompiledType} from '../utils.js';
import {UserFormats} from '@ar1s/spec/out/user.js';

export type User = {
	id: number;
	flag: number;
	platform: number;
	username: string;
	displayName: string;
	displayAvatarUrl: string;
	displayBio: string;
	createdAt: string;
	updatedAt: string;
};

export const checkUsername = createCompiledType(Type.String({
	format: UserFormats.Username,
}));

export const checkPassword = createCompiledType(Type.String({
	format: UserFormats.Password,
}));
