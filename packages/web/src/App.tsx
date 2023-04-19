import {Route, Switch} from 'wouter';
import Bootstrap from './routes/bootstrap';
import Session from './routes/session';
import ArisStrap from './wrappers/arisstrap';

function App() {
	return (
		<>
			<Switch>
				<Route path='/'>
					<ArisStrap>
						<div>
							Bootstrap is not required
						</div>
					</ArisStrap>
				</Route>
				<Route path='/bootstrap' component={Bootstrap} />
				<Route path='/session' component={Session} />
			</Switch>
		</>
	);
}

export default App;
