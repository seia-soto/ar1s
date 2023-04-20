import {type Collection} from '@ar1s/client';
import {type Context} from '@ar1s/client/out/specs/_context';
import {useEffect, useState} from 'react';

export function useSyncedCollection<T extends Collection<Context>>(collection: T) {
	const [, setValue] = useState({});
	const {add, del} = collection;

	const sync = () => {
		setValue({});
	};

	useEffect(() => {
		sync();

		return () => {
			collection.add = add;
			collection.del = del;
		};
	}, []);

	collection.add = new Proxy(add, {
		apply(target, thisArg, argArray) {
			Reflect.apply(target, thisArg, argArray);

			sync();
		},
	});

	collection.del = new Proxy(del, {
		apply(target, thisArg, argArray) {
			Reflect.apply(target, thisArg, argArray);

			sync();
		},
	});

	return collection;
}
