import useFastify, {type FastifyServerOptions} from 'fastify';
import {isInexistingResourceError, isPermissionError, isValidationError} from '../specs/error.js';

export const createServer = async (opts?: FastifyServerOptions) => {
	const fastify = useFastify(opts);

	fastify.setErrorHandler(async (error, request, reply) => {
		request.log.error(error);

		if (isValidationError(error)) {
			await reply
				.status(400)
				.send({
					code: error.name,
					message: error.message,
					statusCode: 400,
				});

			return reply;
		}

		if (isPermissionError(error)) {
			await reply
				.status(403)
				.send({
					code: error.name,
					message: error.message,
					statusCode: 403,
				});

			return reply;
		}

		if (isInexistingResourceError(error)) {
			await reply
				.status(404)
				.send({
					code: error.name,
					message: error.message,
					statusCode: 404,
				});

			return reply;
		}

		await reply
			.status(500)
			.send({
				code: 'Internal Server Error',
				message: 'Your request has been canceled in the snapshot for security reason. All changes will be reverted automatically.',
				statusCode: 500,
			});

		return reply;
	});

	return fastify;
};
