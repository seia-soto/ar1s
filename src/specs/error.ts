class ValidationError extends Error {
	name = 'VALIDATION_ERROR';
}

export enum ValidationErrorCodes {
	// Generic
	INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

	// Spec.platform
	PLATFORM_DEFAULT_SHOULD_BE_UNIQUE = 'PLATFORM_DEFAULT_SHOULD_BE_UNIQUE',
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
