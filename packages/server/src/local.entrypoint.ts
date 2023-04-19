import useCors from '@fastify/cors';
import {createServer} from './server/index.js';

void (async () => {
	const server = await createServer({
		logger: {
			transport: {
				target: 'pino-pretty',
				options: {
					translateTime: 'HH:MM:ss Z',
					ignore: 'pid,hostname',
				},
			},
		},
	});

	await server.register(useCors);

	const address = await server.listen({
		host: '127.0.0.1',
		port: 8080,
	});

	console.log('@ar1s/server is listening on', address);
})();
