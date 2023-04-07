import anyTest, {type TestFn} from 'ava';
import {type FastifyInstance, type InjectOptions} from 'fastify';
import {Cookie, CookieJar} from 'tough-cookie';
import {createServer} from '../src/server/index.js';

const useInjectWithSession = (namespace = 'ar1s.test.__nullable__.seia.io') => {
	const domain = 'https://' + namespace;

	const cookieJar = new CookieJar();

	const useInject = (fastify: FastifyInstance) => async (opts: InjectOptions) => {
		let path = '';

		if (typeof opts.url === 'undefined') {
			throw new Error('The `url` property in InjectOptions from fastify is expected!');
		} else if (typeof opts.url === 'string') {
			path = opts.url;
		} else {
			path = opts.url.pathname;
		}

		if (!path.startsWith('/')) {
			throw new Error('The path should starts with slash for proper cookie handling!');
		}

		const url = domain + path;
		const cookieHeader = await cookieJar.getCookieString(url, {
			http: true,
		});

		if (!opts.headers) {
			opts.headers = {};
		}

		opts.headers.cookie = cookieHeader;

		const response = await fastify.inject(opts);

		if (typeof response.headers['set-cookie'] === 'string') {
			const cookie = Cookie.parse(response.headers['set-cookie']);

			if (!cookie) {
				throw new Error('Failed to parse cookie header from the server!');
			}

			await cookieJar.setCookie(cookie, url, {http: true});
		} else if (Array.isArray(response.headers['set-cookie'])) {
			const cookieSetters = response.headers['set-cookie'].map(async cookieHeader => {
				const cookie = Cookie.parse(cookieHeader);

				if (!cookie) {
					throw new Error('Failed to parse cookie header from the server!');
				}

				return cookieJar.setCookie(cookie, url, {http: true});
			});

			await Promise.all(cookieSetters);
		}

		return response;
	};

	return useInject;
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
	});

	t.is(response.statusCode, 404);
});
