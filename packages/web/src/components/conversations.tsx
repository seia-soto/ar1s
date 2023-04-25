import {type Conversation} from '@ar1s/client';
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {useRender} from '../hooks/render';
import {aris} from '../modules/aris';

type FieldValues = {
	model: string;
	displayName: string;
	systemMessage: string;
};

function Conversations() {
	const render = useRender();
	const {handleSubmit, register} = useForm<FieldValues>();

	useEffect(() => {
		(async () => {
			if (!aris.userRequired.conversations) {
				await aris.userRequired.syncConversations();
			}

			render();
		})();
	}, []);

	const handleCreateConversation = handleSubmit(async values => {
		await aris.userRequired.createConversation(values.model, values.systemMessage, values.displayName);

		render();
	});

	const handleDeleteConversation = (conversation: Conversation) => async () => {
		if (typeof conversation.profile === 'undefined') {
			await conversation.syncMembers();
		}

		await conversation.delete();

		render();
	};

	if (typeof aris.userRequired.conversations === 'undefined') {
		return (
			<>
				<h2>Conversations</h2>
				<p>Loading...</p>
			</>
		);
	}

	return (
		<>
			<h2>Conversations</h2>
			<form onSubmit={handleCreateConversation}>
				<h3>Create new conversation</h3>

				<label>
          Name: <input type='text' {...register('displayName')} />
				</label>
				<br />

				<label>
          Model: <input type='text' {...register('model')} />
				</label>
				<br />

				<label>
          System message: <input type='text' {...register('systemMessage')} />
				</label>
				<br />

				<input type='submit' value='Create new!' />
			</form>

			<h3>Listings</h3>
			<ol>
				{
					aris.userRequired.conversationsRequired.values().map(conversation => (
						<li key={conversation.id}>
							<p>{conversation.displayName}</p>
							<button onClick={handleDeleteConversation(conversation)}>Delete this</button>
						</li>
					))
				}
			</ol>
		</>
	);
}

export default Conversations;
