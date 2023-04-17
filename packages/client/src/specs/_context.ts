import {type Aris} from '../index.js';

type EnumerableIndex = string | number;

export class Context {
	_copyUpdatedAt = new Date();
	readonly _copyCreatedAt = new Date();

	constructor(
		readonly _context: Aris,
		readonly _enumerable: EnumerableIndex,
	) {}
}

export class Collection<T extends Context> {
	map: Record<EnumerableIndex, T> = {};

	get(index: EnumerableIndex) {
		return this.map[index];
	}

	add(entry: T) {
		this.map[entry._enumerable] = entry;

		return true;
	}

	del(index: EnumerableIndex) {
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete this.map[index];

		return true;
	}

	values() {
		return Object.values(this.map);
	}
}
