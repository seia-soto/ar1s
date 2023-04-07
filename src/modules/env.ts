type EnvKey = keyof NodeJS.ProcessEnv;

export const isEnvString = (key: EnvKey) => typeof process.env[key] === 'string';

export const shouldEnvBeString = (key: EnvKey) => {
	if (!isEnvString(key)) {
		throw new Error(`${key} is not valid string!`);
	}
};

export const isEnvNumber = (key: EnvKey) => typeof process.env[key] === 'string' && !isNaN(parseInt(process.env[key], 10));

export const shouldEnvBeNumber = (key: EnvKey) => {
	if (!isEnvNumber(key)) {
		throw new Error(`${key} is not valid number!`);
	}
};

export const shouldEnvBeTypeOrFallback = <Fallback extends string | number>(key: EnvKey, fallback: Fallback) => {
	const expectedType = typeof fallback;

	if (
		(expectedType === 'number' && !isEnvNumber(key))
    || (expectedType === 'string' && !isEnvString(key))
	) {
		console.warn(`Expected ${expectedType} for ${key} but saw ${typeof process.env[key]}! Falling back to ${fallback}.`);

		process.env[key] = fallback.toString();
	}
};
