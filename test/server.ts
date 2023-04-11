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
	const useInject = useInjectWithSession('ar1s.seia.io');

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

test.serial('the default platfrom should be empty if the instance is not bootstrapped', async t => {
	const response = await t.context.inject({
		url: '/platform',
		method: 'GET',
	});

	t.is(response.statusCode, 404);
});

test.serial('bootstrap the instance', async t => {
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

test.serial('the default platform should be available after bootstrap', async t => {
	const response = await t.context.inject({
		url: '/platform',
		method: 'GET',
	});

	t.is(response.statusCode, 200);
	t.true(response.payload.includes(testParams.platformDisplayName));
});

test.serial('the bootstrapped user can sign in to the instance', async t => {
	const response = await t.context.inject({
		url: '/session',
		method: 'POST',
		payload: {
			username: testParams.adminUsername,
			password: testParams.adminPassword,
			isTrustedEnvironment: true,
		},
	});

	t.is(response.statusCode, 200);
	t.is(response.payload, '');
	t.truthy(response.headers['set-cookie']);
});

test.serial('the user can load conversations but empty', async t => {
	const response = await t.context.inject({
		url: '/private/conversation',
		method: 'GET',
		query: {
			size: '1',
			from: '1',
		},
	});

	t.is(response.statusCode, 200);
	t.is(response.payload, '[]');
});
