import createConnectionPool, {sql, type Transaction} from '@databases/pg';
import tables from '@databases/pg-typed';
import {shouldEnvBeString} from '../env.js';
import type DatabaseSchema from './schema/index.js';
import databaseSchema from './schema/schema.json' assert { type: 'json' };

shouldEnvBeString('DATABASE_URL');

export {sql};

export const db = createConnectionPool(process.env.DATABASE_URL);

export const models = tables<DatabaseSchema>({
	databaseSchema,
});

// Generic optimized queries and utils
export const isExist = async <
	Table extends keyof DatabaseSchema,
	Col extends keyof DatabaseSchema[Table]['record'] & string,
	Value extends DatabaseSchema[Table]['record'][Col],
>(t: Transaction, table: Table, col: Col, value: Value) => (await t.query(t.sql`select exists (select 1 from ${t.sql.ident(table)} where ${t.sql.ident(col)} = ${value})`))[0].exists as boolean;

export const isFlagExists = async <
	Table extends keyof DatabaseSchema,
	Col extends keyof DatabaseSchema[Table]['record'] & string,
	Value extends DatabaseSchema[Table]['record'][Col],
>(t: Transaction, table: Table, value: Value, flag: number) => (await t.query(t.sql`select exists (select 1 from ${t.sql.ident(table)} where id = ${value} and flag & ${flag} = ${flag})`))[0].exists as boolean;
