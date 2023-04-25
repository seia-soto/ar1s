import {TypeSystem} from '@sinclair/typebox/system';

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
	!/[^a-zA-Z0-9]/.test(value)
  && value.length >= 1
  && value.length <= 16
);

// eslint-disable-next-line new-cap
TypeSystem.Format(UserFormats.Username, formatUsername);

export const formatPassword = (value: string) => (
	value.length > 12
  && value.length < 512
);

// eslint-disable-next-line new-cap
TypeSystem.Format(UserFormats.Password, formatPassword);
