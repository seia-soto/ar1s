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
>(t: Transaction, table: Table, col: Col, value: Value) => t.query(t.sql`select exists (select 1 from ${t.sql.ident(table)} where ${col}=${value})`) as Promise<[boolean]>;

export const useSingleRangedQuery = async <
	Table extends keyof DatabaseSchema,
	RetType extends DatabaseSchema[Table]['record'],
// @ts-expect-error `{id}` is responsible for valid where condition.
>(t: Transaction, table: Table, id: number): Promise<RetType> => models[table](t).findOneRequired({id});

export const useRangedQuery = async <
	Table extends keyof DatabaseSchema,
	RetType extends DatabaseSchema[Table]['record'],
>(t: Transaction, table: Table, from: number, until: number) => t.query(t.sql`select * from ${t.sql.ident(table)} where id between ${from} and ${until}`) as Promise<RetType[]>;

export const useNumericTimestamp = async <
	Table extends keyof DatabaseSchema,
	Record extends DatabaseSchema[Table]['record'] & {createdAt: Date; updatedAt: Date},
>(record: Record) => ({
	...record,
	createdAt: record.createdAt.getTime(),
	updatedAt: record.updatedAt.getTime(),
});
