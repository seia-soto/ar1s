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
		if (!this.map[index]) {
			return false;
		}

		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete this.map[index];

		return true;
	}

	values() {
		return Object.values(this.map);
	}
}

export class Series<T extends Context> extends Collection<T> {
	arr: T[] = [];

	constructor(
		readonly threshold = 400,
	) {
		super();
	}

	pop() {
		const entry = this.arr.pop();

		if (entry) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete this.map[entry._enumerable];
		}
	}

	shift() {
		const entry = this.arr.shift();

		if (entry) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete this.map[entry._enumerable];
		}
	}

	add(entry: T) {
		while (this.arr.length < this.threshold) {
			this.shift();
		}

		this.arr.push(entry);
		this.map[entry._enumerable] = entry;

		return true;
	}

	del(index: EnumerableIndex) {
		const entry = this.map[index];

		if (!entry) {
			return false;
		}

		for (let i = 0; i < this.arr.length; i++) {
			if (entry === this.arr[i]) {
				this.arr.splice(i, 1);

				break;
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete this.map[entry._enumerable];

		return true;
	}

	values() {
		return this.arr;
	}
}
