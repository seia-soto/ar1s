import anyTest, {type TestFn} from 'ava';
import {useInjectWithSession} from 'fastify-inject-with-session';
import {createServer} from '../src/server/index.js';

const test = anyTest as TestFn<{
	server: Awaited<ReturnType<typeof createServer>>;
	inject: ReturnType<Awaited<ReturnType<typeof useInjectWithSession>>>;
}>;

test.serial.before(async t => {
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
	const useInject = useInjectWithSession();

	t.context.server = server;
	t.context.inject = useInject(server);
});

test.serial('the working proof of the test code', async t => {
	const response = await t.context.inject({
		url: '/',
	});

	t.is(response.statusCode, 404);
});
