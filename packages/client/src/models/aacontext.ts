import {type Aris} from '../index.js';

type EnumerableIndex = string | number;

export class Context {
	copyUpdatedAt = new Date();
	readonly copyCreatedAt = new Date();

	constructor(
		readonly context: Aris,
		readonly enumerable: EnumerableIndex,
	) {}
}

export class Collection<T extends Context> {
	private readonly map: Record<EnumerableIndex, T> = {};

	get(index: EnumerableIndex) {
		return this.map[index];
	}

	set(entity: T) {
		this.map[entity.enumerable] = entity;
	}

	delete(index: EnumerableIndex) {
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete this.map[index];
	}

	keys() {
		return Object.values(this.map);
	}

	values() {
		return Object.values(this.map);
	}
}

export class Series<T extends Context> {
	map: Record<EnumerableIndex, T> = {};
	arr: T[] = [];

	constructor(
		readonly threshold = 400,
	) {}

	pop() {
		const entry = this.arr.pop();

		if (entry) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete this.map[entry.enumerable];
		}
	}

	shift() {
		const entry = this.arr.shift();

		if (entry) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete this.map[entry.enumerable];
		}
	}

	add(entry: T) {
		while (this.arr.length < this.threshold) {
			this.shift();
		}

		this.arr.push(entry);
		this.map[entry.enumerable] = entry;

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
		delete this.map[entry.enumerable];

		return true;
	}

	values() {
		return this.arr;
	}
}
