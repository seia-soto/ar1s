import {Platform} from '@ar1s/client';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {useLocation} from 'wouter';
import {aris} from '../modules/aris';

type FieldValues = {
	username: string;
	password: string;
	isTrustedEnvironment: boolean;
};

function Session() {
	const {handleSubmit, register} = useForm<FieldValues>();
	const [, setLocation] = useLocation();

	const [isSigningIn, setSigningIn] = useState(false);

	const onSubmit = handleSubmit(async fields => {
		if (isSigningIn) {
			return;
		}

		setSigningIn(true);

		const platform = await Platform.from(aris);
		const isSucceed = await platform.signIn(fields.username, fields.password, fields.isTrustedEnvironment)
			.catch(error => {
				console.error(error);

				return false as const;
			});

		if (isSucceed) {
			setLocation('/app');
		}

		setSigningIn(false);
	});

	return (
		<div>
			<h1>Sign in to the platform!</h1>

			<form onSubmit={onSubmit}>
				<label>
          Username: <input type='text' {...register('username')} />
				</label>
				<br />

				<label>
          Password: <input type='password' {...register('password')} />
				</label>
				<br />

				<label>
          Check if you want to sign in longer: <input type='checkbox' {...register('isTrustedEnvironment')} />
				</label>
				<br />

				<input type='submit' value='Sign in!' />
			</form>
		</div>
	);
}

export default Session;
