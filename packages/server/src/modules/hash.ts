import * as argon from 'argon2';

const options: argon.Options & {raw?: false} = {
	memoryCost: 2 ** 16,
	hashLength: 48,
	raw: false,
};

export const validateHash = async (hash: string, password: string) => argon.verify(hash, password, options)
	.catch(_error => false as const);

export const createHash = async (password: string) => argon.hash(password, options);
