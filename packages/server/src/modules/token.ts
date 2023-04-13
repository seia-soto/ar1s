/**
 * Token modules for generating and validating the account scoped authentication sessions.
 * We can use cookies but for better scalability, it's better to mix token blacklist and paseto.
 */
import {V4 as paseto} from 'paseto';
import {compileBit, hasFlag} from './bitwise.js';
import {shouldEnvBeString} from './env.js';

export enum TokenFlags {
	IsTemporaryToken = 0,
}

export type TokenPayload = {
	platform: number;
	user: number;
	flag: number;
};

shouldEnvBeString('TOKEN_GENERATOR_PUBLIC');
shouldEnvBeString('TOKEN_GENERATOR_SECRET');

const loginExpiration = process.env.TOKEN_EXPIRATION ?? '3d';
const temporaryLoginExpiration = process.env.TOKEN_TEMPORARY_EXPIRATION ?? '3h';
const loginRenewalPeriod = parseInt(process.env.TOKEN_RENEWAL_PERIOD, 10) || 1000 * 60 * 60 * 30;

export const encodeToken = async (payload: TokenPayload) => paseto.sign(payload, process.env.TOKEN_GENERATOR_SECRET, {expiresIn: hasFlag(payload.flag, compileBit(TokenFlags.IsTemporaryToken)) ? temporaryLoginExpiration : loginExpiration});

export const decodeToken = async (token: string) => paseto.verify(token, process.env.TOKEN_GENERATOR_PUBLIC) as Promise<
TokenPayload &
{
	iat: string;
	exp: string;
}
>;

export const isTokenRequiresRenewal = (iat: string, exp: string) => {
	const iatTime = new Date(iat).getTime();
	const expTime = new Date(exp).getTime();

	return iatTime + loginRenewalPeriod > expTime;
};
