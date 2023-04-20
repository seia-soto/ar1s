import {Route} from 'wouter';
import App from './routes/app';
import Bootstrap from './routes/bootstrap';
import Session from './routes/session';
import {Arisstrap, RequireAuthenticated, RequireNotAuthenticated, RequireNotBootstrapped} from './wrappers/arisstrap';

function Entrypoint() {
	return (
		<Arisstrap>
			<RequireAuthenticated route='/app' fallback='/a/authenticate'>
				<Route path='/app' component={App} />
			</RequireAuthenticated>

			<RequireNotAuthenticated route='/a/' fallback='/app'>
				<Route path='/a/authenticate' component={Session} />
			</RequireNotAuthenticated>

			<RequireNotBootstrapped route='/b/' fallback='/a/authenticated'>
				<Route path='/b/bootstrap' component={Bootstrap} />
			</RequireNotBootstrapped>
		</Arisstrap>
	);
}

export default Entrypoint;
