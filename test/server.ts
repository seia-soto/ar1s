import anyTest, {type ExecutionContext, type TestFn} from 'ava';
import {useInjectWithSession} from 'fastify-inject-with-session';
import {createServer} from '../src/server/index.js';

const testParams = {
	platformInviteIndentifier: 'hifumi',
	platformDisplayName: 'Hifumi Space',
	platformToken: '',
	adminUsername: 'hifumi',
	adminPassword: 'aa_hifumi_password00',
};

type TestContext = {
	server: Awaited<ReturnType<typeof createServer>>;
	inject: ReturnType<Awaited<ReturnType<typeof useInjectWithSession>>>;
};

const test = anyTest as TestFn<TestContext>;

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

test.serial('the user can load the platform data', async t => {
	const response = await t.context.inject({
		url: '/private/platform',
		method: 'GET',
	});

	t.is(response.statusCode, 200);
	t.true(response.payload.includes(testParams.platformDisplayName));
});

test.serial('the user can load the user data', async t => {
	const response = await t.context.inject({
		url: '/private/user',
		method: 'GET',
	});

	t.is(response.statusCode, 200);
	t.true(response.payload.includes(testParams.adminUsername));
});

test.serial('the user can modify the user data', async t => {
	const response = await t.context.inject({
		url: '/private/user',
		method: 'PATCH',
		payload: {
			displayName: 'Faust',
			displayBio: 'Hifumi is not Faust.',
			displayAvatarUrl: '',
		},
	});

	t.is(response.statusCode, 200);

	await t.context.inject({
		url: '/private/user',
		method: 'PATCH',
		payload: {
			displayName: 'Hifumi',
			displayBio: 'Hifumi is not Faust.',
			displayAvatarUrl: '',
		},
	});
});

test.serial('the user can modify the user password', async t => {
	const newPassword = testParams.adminPassword + '!@';

	const response = await t.context.inject({
		url: '/private/user/password',
		method: 'PATCH',
		payload: {
			currentPassword: testParams.adminPassword,
			newPassword,
		},
	});

	t.is(response.statusCode, 200);

	await t.context.inject({
		url: '/private/user/password',
		method: 'PATCH',
		payload: {
			currentPassword: newPassword,
			newPassword: testParams.adminPassword,
		},
	});
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

test.serial('the user can create new conversation', async t => {
	const response = await t.context.inject({
		url: '/private/conversation',
		method: 'POST',
		payload: {
			model: 'gpt-3.5',
			systemMessage: '',
			displayName: 'Hello Hifumi',
		},
	});

	t.is(response.statusCode, 200);
});

type Conversation = {
	id: number;
	flag: number;
	platform: number;
	model: string;
	systemMessage: string;
	displayName: string;
	displayImageUrl: string;
	createdAt: string;
	updatedAt: string;
};

const getFirstConversation = async (t: ExecutionContext<TestContext>) => {
	const conversationListingResponse = await t.context.inject({
		url: '/private/conversation',
		method: 'GET',
		query: {
			size: '1',
			from: '1',
		},
	});
	const [conversationListing] = JSON.parse(conversationListingResponse.payload) as Conversation[];

	t.is(conversationListingResponse.statusCode, 200);

	return conversationListing;
};

test.serial('the user can load the conversation', async t => {
	const conversationListing = await getFirstConversation(t);

	t.is(conversationListing.displayName, 'Hello Hifumi');

	const conversationResponse = await t.context.inject({
		url: '/private/conversation/' + conversationListing.id.toString(),
		method: 'GET',
	});
	const conversation = JSON.parse(conversationResponse.payload) as Conversation;

	t.is(conversationResponse.statusCode, 200);
	t.is(conversation.displayName, 'Hello Hifumi');
});

test.serial('the user can modify the conversation', async t => {
	const conversationListing = await getFirstConversation(t);

	t.is(conversationListing.displayName, 'Hello Hifumi');

	const conversationModifyResponse = await t.context.inject({
		url: '/private/conversation/' + conversationListing.id.toString(),
		method: 'PATCH',
		payload: {
			displayName: 'Hi Hifumi',
			displayImageUrl: '',
		},
	});

	t.is(conversationModifyResponse.statusCode, 200);

	const aConversationListing = await getFirstConversation(t);

	t.is(aConversationListing.displayName, 'Hi Hifumi');

	await t.context.inject({
		url: '/private/conversation/' + aConversationListing.id.toString(),
		method: 'PATCH',
		payload: {
			displayName: 'Hello Hifumi',
			displayImageUrl: '',
		},
	});
});

type ConversationMember = {
	id: number;
	flag: number;
	displayName: string;
	displayAvatarUrl: string;
	displayBio: string;
	createdAt: string;
};

const getConversationMembers = async (t: ExecutionContext<TestContext>, conversationId: number) => {
	const response = await t.context.inject({
		url: '/private/conversation/' + conversationId.toString() + '/members',
		method: 'GET',
	});
	const members = JSON.parse(response.payload) as ConversationMember[];

	return members;
};

test.serial('the user can load the profile on the conversation', async t => {
	const conversationListing = await getFirstConversation(t);

	t.is(conversationListing.displayName, 'Hello Hifumi');

	const profileResponse = await t.context.inject({
		url: '/private/conversation/' + conversationListing.id.toString() + '/profile',
		method: 'GET',
	});
	const profile = JSON.parse(profileResponse.payload) as ConversationMember;

	t.is(profileResponse.statusCode, 200);
	t.is(profile.displayName, 'Hifumi');
});

test.serial('the user can list up conversation members', async t => {
	const conversationListing = await getFirstConversation(t);

	t.is(conversationListing.displayName, 'Hello Hifumi');

	const conversationMemberListing = await getConversationMembers(t, conversationListing.id);

	t.truthy(conversationMemberListing.find(member => member.displayName.includes('Hifumi')));
});

type Message = {
	id: number;
	flag: number;
	platform: number;
	conversation: number;
	author: number;
	content: string;
	createdAt: string;
	updatedAt: string;
};

const getFirstMessage = async (t: ExecutionContext<TestContext>, conversationId: number) => {
	const messagesResponse = await t.context.inject({
		url: '/private/conversation/' + conversationId.toString() + '/messages',
		method: 'GET',
		query: {
			size: '1',
			from: '1',
		},
	});
	const [message] = JSON.parse(messagesResponse.payload) as Message[];

	t.is(messagesResponse.statusCode, 200);

	return message;
};

test.serial('the user can create a message on the conversation', async t => {
	const conversationListing = await getFirstConversation(t);

	const messageResponse = await t.context.inject({
		url: '/private/conversation/' + conversationListing.id.toString() + '/message',
		method: 'POST',
		payload: {
			content: 'Hello',
		},
	});

	t.is(messageResponse.statusCode, 200);

	const message = await getFirstMessage(t, conversationListing.id);

	t.is(message.content, 'Hello');
});

test.serial('the user can delete the conversation', async t => {
	const conversationListing = await getFirstConversation(t);
	const deleteResponse = await t.context.inject({
		url: '/private/conversation/' + conversationListing.id.toString(),
		method: 'DELETE',
	});

	t.is(deleteResponse.statusCode, 200);
	t.falsy(await getFirstConversation(t));
});
