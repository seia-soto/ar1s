import {type ValueErrorIterator} from '@sinclair/typebox/errors';

class FormatError extends Error {
	name = 'FORMAT_ERROR';
}

export const useFormatError = (iterator: ValueErrorIterator) => {
	const errors = [...iterator];
	const message = errors.map(validation => `${validation.message ?? 'Unexpected type'} for ${validation.path}`).join('; ');

	return new FormatError(message);
};

export const isFormatError = (error: unknown) => error instanceof FormatError;

export type ServerError = {
	code: string;
	message: string;
	statusCode: number;
};
