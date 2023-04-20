import Conversations from '../components/conversations';
import {aris} from '../modules/aris';

function App() {
	const user = aris.user!;
	const platform = aris.platform!;

	const handleSignOut = async () => {
		await platform.signOut();

		window.location.reload();
	};

	return (
		<>
			<h1>Welcome back!</h1>
			<button onClick={handleSignOut}>Sign out!</button>

			<ul>
				<li>Account: {user.username}</li>
				<li>Username: {user.displayName}</li>
				<li>Joined at: {user.createdAt.toLocaleDateString()}</li>
			</ul>

			<Conversations />
		</>
	);
}

export default App;
