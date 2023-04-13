import {TypeSystem} from '@sinclair/typebox/system';

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
