class ValidationError extends Error {
	name = 'VALIDATION_ERROR';
}

export enum ValidationErrorCodes {
	// Generic
	InvalidCredentials = 'INVALID_CREDENTIALS',

	// Generic Ranged Queries
	InvalidRangeOfFromId = 'INVALID_RANGE_OF_FROM_ID; Query `from` should be in valid range',
	InvalidRangeOfSizeId = 'INVALID_RANGE_OF_SIZE_ID; Query `size` should be in valid range',
	InvalidRangeOfId = 'INVALID_RANGE_OF_ID; `id` should be in valid range',

	// Spec.platform
	PlatformDefaultShouldBeUnique = 'PLATFORM_DEFAULT_SHOULD_BE_UNIQUE',
	PlatformNotOpenForSignUp = 'PLATFORM_NOT_OPEN_FOR_SIGNUP',
	PlatformDeactivated = 'PLATFORM_DEACTIVATED',

	// Spec.user
	UserIsPlatformManager = 'USER_IS_PLATFORM_MANAGER',
}

export const useValidationError = (message: ValidationErrorCodes) => new ValidationError(message);

export const isValidationError = (error: unknown) => error instanceof ValidationError;

class PermissionError extends Error {
	name = 'PERMISSION_ERROR';
}

export const usePermissionError = (message = 'Unauthorized') => new PermissionError(message);

export const isPermissionError = (error: unknown) => error instanceof PermissionError;

class InexistingResourceError extends Error {
	name = 'INEXISTING_RESOURCE_ERROR';
}

export const useInexistingResourceError = (message = 'Resource not found') => new InexistingResourceError(message);

export const isInexistingResourceError = (error: unknown) => error instanceof InexistingResourceError;
