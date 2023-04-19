import {useLocation} from 'wouter';
import {useForm} from 'react-hook-form';
import {aris} from '../modules/aris';
import {useState} from 'react';

type FieldValues = Parameters<typeof aris['bootstrap']>[0];

function Bootstrap() {
	const {handleSubmit, register} = useForm<FieldValues>();
	const [, setLocation] = useLocation();

	const [isBootstrapping, setBootstrapping] = useState(false);

	const onSubmit = handleSubmit(async fields => {
		if (isBootstrapping) {
			return;
		}

		setBootstrapping(true);

		await aris.bootstrap(fields)
			.catch(error => {
				console.error(error);

				setBootstrapping(false);
			});

		setLocation('/');
	});

	return (
		<div>
			<h1>The current instance requires bootstrapping!</h1>

			<form onSubmit={onSubmit}>
				<label>
					Platform invite identifier: <input type='text' {...register('platformInviteIdentifier')} />
				</label>
				<br />

				<label>
					Platform display name: <input type='text' {...register('platformDisplayName')} />
				</label>
				<br />

				<label>
					Platform token: <input type='password' {...register('platformToken')} />
				</label>
				<br />

				<label>
					Username: <input type='text' {...register('userUsername')} />
				</label>
				<br />

				<label>
					Password: <input type='password' {...register('userPassword')} />
				</label>
				<br />

				<input type='submit' value='Bootstrap!' />
			</form>
		</div>
	);
}

export default Bootstrap;
