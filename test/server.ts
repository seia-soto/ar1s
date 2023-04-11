import anyTest, {type TestFn} from 'ava';
import {useInjectWithSession} from 'fastify-inject-with-session';
import {createServer} from '../src/server/index.js';

const testParams = {
	platformInviteIndentifier: 'hifumi',
	platformDisplayName: 'Hifumi Space',
	platformToken: '',
	adminUsername: 'hifumi',
	adminPassword: 'aa_hifumi_password00',
};

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
		method: 'GET',
	});

	t.is(response.statusCode, 404);
});

test.serial('the default platfrom should be empty if not bootstrap', async t => {
	const response = await t.context.inject({
		url: '/platform',
		method: 'GET',
	});

	t.is(response.statusCode, 404);
});

test.serial('bootstrap', async t => {
	const response = await t.context.inject({
		url: '/bootstrap',
		method: 'POST',
		payload: {
			platform: {
				inviteIdentifier: testParams.platformInviteIndentifier,
				displayName: testParams.platformDisplayName,
				token: testParams.platformToken,
			},
			user: {
				username: testParams.adminUsername,
				password: testParams.adminPassword,
			},
		},
	});

	t.is(response.statusCode, 200);
	t.is(response.payload, '');
});
