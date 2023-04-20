import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {useSyncedCollection} from '../hooks/collection';
import {aris} from '../modules/aris';

type FieldValues = {
	model: string;
	displayName: string;
	systemMessage: string;
};

function Conversations() {
	const user = aris.user!;
	const conversations = useSyncedCollection(user.conversations);

	const {handleSubmit, register} = useForm<FieldValues>();

	useEffect(() => {
		(async () => {
			if (!user.conversations.values().length) {
				await user.pull();
			}
		})();
	}, [user.conversations.map]);

	const handleCreateConversation = handleSubmit(async values => {
		await user.createConversation(values);
	});

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
					conversations.values().map(conversation => (
						<li key={conversation.id}>{conversation.displayName}</li>
					))
				}
			</ol>
		</>
	);
}

export default Conversations;
