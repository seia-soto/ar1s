/* eslint-disable new-cap */
import {Type} from '@sinclair/typebox';
import {TypeSystem} from '@sinclair/typebox/system';
import {ValidationErrorCodes, useValidationError} from './error.js';

export enum Formats {
	NumericInt = 'ar1s._.numericInt',
	NumericFloat = 'ar1s._.numbericFloat',
}

export const formatNumericInt = (value: string) => (
	!value.includes('.')
  && !isNaN(parseInt(value, 10))
);

TypeSystem.Format(Formats.NumericInt, formatNumericInt);

export const formatNumericFloat = (value: string) => !isNaN(parseFloat(value));

TypeSystem.Format(Formats.NumericFloat, formatNumericFloat);

export const rangedQueryType = Type.Object({
	size: Type.String({
		format: Formats.NumericInt,
	}),
	from: Type.String({
		format: Formats.NumericInt,
	}),
});

export const useRangedQueryParams = (query: {from: string; size: string}, max: number) => {
	const fromN = parseInt(query.from, 10);
	const sizeN = parseInt(query.size, 10);

	if (fromN < 1) {
		throw useValidationError(ValidationErrorCodes.InvalidRangeOfFromId);
	}

	if (sizeN < 1 || sizeN > max) {
		throw useValidationError(ValidationErrorCodes.InvalidRangeOfSizeId);
	}

	return {
		from: fromN,
		size: sizeN,
	};
};

export const useReverseRangedQueryParams = (query: {from: string; size: string}, max: number) => {
	const fromN = parseInt(query.from, 10);
	const sizeN = parseInt(query.size, 10);

	if (fromN < 0 || fromN > max) {
		throw useValidationError(ValidationErrorCodes.InvalidRangeOfFromId);
	}

	if (sizeN < 1 || sizeN > max) {
		throw useValidationError(ValidationErrorCodes.InvalidRangeOfSizeId);
	}

	return {
		from: fromN,
		size: sizeN,
	};
};

// For simple single query
export const singleRangedQueryType = Type.Object({
	id: Type.String({
		format: Formats.NumericInt,
	}),
});

export const useSingleRangedQueryParam = (id: string) => {
	const idN = parseInt(id, 10);

	if (idN < 1) {
		throw useValidationError(ValidationErrorCodes.InvalidRangeOfId);
	}

	return idN;
};
