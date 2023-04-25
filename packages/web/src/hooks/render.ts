import {useState} from 'react';

export function useRender() {
	const [, setValue] = useState({});

	const render = () => {
		setValue({});
	};

	return render;
}
