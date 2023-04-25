import {useEffect, useState, type PropsWithChildren} from 'react';
import {aris} from '../modules/aris';
import {Redirect} from 'wouter';
import useLocation from 'wouter/use-location';

function Loading() {
	return (
		<>
			<p>Loading app...</p>
		</>
	);
}

export function Arisstrap(props: PropsWithChildren) {
	const [isInitiated, setInitiated] = useState(false);

	useEffect(() => {
		const effect = async () => {
			await (async () => {
				await aris.sync();
				await aris.userRequired.sync();
			})()
				.catch(_error => false as const);

			setInitiated(true);
		};

		void effect();
	}, []);

	if (!isInitiated) {
		return <Loading />;
	}

	return (
		<>
			{props.children}
		</>
	);
}

type GatekeeperProps = PropsWithChildren<{
	route: string;
	fallback: string;
}>;

export function RequireAuthenticated(props: GatekeeperProps) {
	const [location] = useLocation();

	if (!location.startsWith(props.route)) {
		return null;
	}

	if (typeof aris.user === 'undefined') {
		return <Redirect to={props.fallback} />;
	}

	return (
		<>
			{props.children}
		</>
	);
}

export function RequireNotAuthenticated(props: GatekeeperProps) {
	const [location] = useLocation();

	if (!location.startsWith(props.route)) {
		return null;
	}

	if (typeof aris.user !== 'undefined') {
		return <Redirect to={props.fallback} />;
	}

	return (
		<>
			{props.children}
		</>
	);
}

export function RequireNotBootstrapped(props: GatekeeperProps) {
	const [location] = useLocation();
	const [isBootstrapped, setBootstrapped] = useState<boolean | undefined>();

	useEffect(() => {
		if (!location.startsWith(props.route)) {
			return;
		}

		void (async () => {
			setBootstrapped(!await aris.isBootstrapRequired());
		})();
	}, [location]);

	if (!location.startsWith(props.route)) {
		return null;
	}

	if (typeof setBootstrapped === 'undefined') {
		return <Loading />;
	}

	if (isBootstrapped) {
		return <Redirect to={props.fallback} />;
	}

	return (
		<>
			{props.children}
		</>
	);
}
