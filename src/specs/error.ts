class ValidationError extends Error {
	name = 'VALIDATION_ERROR';
}

export const useValidationError = (message: string) => new ValidationError(message);

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
