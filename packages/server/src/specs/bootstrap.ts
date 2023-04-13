import {PlatformFlags} from '@ar1s/spec/out/platform.js';
import {addFlag} from '@ar1s/spec/out/utils/bitwise.js';
import {type Transaction} from '@databases/pg';
import {models} from '../modules/database/index.js';

let __isBootstrapRequired: boolean | undefined;

export const isBootstrapRequired = async (t: Transaction) => {
	if (typeof __isBootstrapRequired !== 'undefined') {
		return __isBootstrapRequired;
	}

	const flag = addFlag(0, PlatformFlags.Default);

	__isBootstrapRequired = !(await t.query(t.sql`select exists (select 1 from ${t.sql.ident(models.platform(t).tableName)} where flag & ${flag} = ${flag})`))[0].exists;

	return __isBootstrapRequired;
};

// Clearing the bootstrap user should result in cleaning up the whole platform
export const clear = async (t: Transaction) => {
	await models.message(t).delete({});
	await models.conversationMember(t).delete({});
	await models.conversation(t).delete({});
	await models.user(t).delete({});
	await models.platform(t).delete({});
};
