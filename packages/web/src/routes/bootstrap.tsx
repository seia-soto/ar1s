import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {useLocation} from 'wouter';
import {aris} from '../modules/aris';

type FieldValues = {
	platform: Parameters<typeof aris['bootstrap']>[0];
	user: Parameters<typeof aris['bootstrap']>[1];
};

function Bootstrap() {
	const {handleSubmit, register} = useForm<FieldValues>();
	const [, setLocation] = useLocation();

	const [isBootstrapping, setBootstrapping] = useState(false);

	const onSubmit = handleSubmit(async fields => {
		if (isBootstrapping) {
			return;
		}

		setBootstrapping(true);

		await aris.bootstrap(fields.platform, fields.user)
			.catch(error => {
				console.error(error);

				setBootstrapping(false);
			});

		setLocation('/a/authenticate');
	});

	return (
		<div>
			<h1>The current instance requires bootstrapping!</h1>

			<form onSubmit={onSubmit}>
				<label>
					Platform invite identifier: <input type='text' {...register('platform.inviteIdentifier')} />
				</label>
				<br />

				<label>
					Platform display name: <input type='text' {...register('platform.displayName')} />
				</label>
				<br />

				<label>
					Platform token: <input type='password' {...register('platform.token')} />
				</label>
				<br />

				<label>
					Username: <input type='text' {...register('user.username')} />
				</label>
				<br />

				<label>
					Password: <input type='password' {...register('user.password')} />
				</label>
				<br />

				<input type='submit' value='Bootstrap!' />
			</form>
		</div>
	);
}

export default Bootstrap;
