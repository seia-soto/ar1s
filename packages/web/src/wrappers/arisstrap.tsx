import {type PropsWithChildren, useEffect, useState} from 'react';
import {Redirect} from 'wouter';
import {aris} from '../modules/aris';

function ArisStrap(props: PropsWithChildren) {
	const [isBootstrapRequired, setBootstrapRequired] = useState<boolean | undefined>();

	useEffect(() => {
		const effect = async () => {
			if (await aris.pull()) {
				setBootstrapRequired(false);

				return;
			}

			setBootstrapRequired(await aris.isBootstrapRequired());
		};

		void effect();
	}, []);

	if (typeof isBootstrapRequired === 'undefined') {
		return (
			<div>
        Loading app
			</div>
		);
	}

	if (isBootstrapRequired) {
		return (
			<Redirect to='/bootstrap' />
		);
	}

	if (!aris.user) {
		return (
			<Redirect to='/session' />
		);
	}

	return (
		<div>
			{props.children}
		</div>
	);
}

export default ArisStrap;
