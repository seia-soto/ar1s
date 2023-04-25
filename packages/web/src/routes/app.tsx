import Conversations from '../components/conversations';
import {aris} from '../modules/aris';

function App() {
	const handleSignOut = async () => {
		await aris.signOut();

		window.location.reload();
	};

	return (
		<>
			<h1>Welcome back!</h1>
			<button onClick={handleSignOut}>Sign out!</button>

			<ul>
				<li>Account: {aris.userRequired.username}</li>
				<li>Username: {aris.userRequired.displayName}</li>
				<li>Joined at: {aris.userRequired.createdAt.toLocaleDateString()}</li>
			</ul>

			<Conversations />
		</>
	);
}

export default App;
