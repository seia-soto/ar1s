import {type Aris} from '../index.js';

export class Context {
	constructor(
		readonly _context: Aris,
		readonly _copyCreatedAt = new Date(),
		_copyUpdatedAt = new Date(),
	) {}
}
