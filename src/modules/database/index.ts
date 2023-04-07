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

// Generic optimized queries
export const isExist = async <
	Table extends keyof DatabaseSchema,
	Col extends keyof DatabaseSchema[Table]['record'] & string,
	Value extends DatabaseSchema[Table]['record'][Col],
>(t: Transaction, table: Table, col: Col, value: Value) => t.query(t.sql`SELECT EXISTS (SELECT 1 FROM ${t.sql.ident(table)} WHERE ${col}=${value})`) as Promise<[boolean]>;

export const useSingleRangedQuery = async <
	Table extends keyof DatabaseSchema,
	RetType extends DatabaseSchema[Table]['record'],
// @ts-expect-error `{id}` is responsible for valid where condition.
>(t: Transaction, table: Table, id: number): Promise<RetType> => models[table](t).findOneRequired({id});

export const useRangedQuery = async <
	Table extends keyof DatabaseSchema,
	RetType extends DatabaseSchema[Table]['record'],
>(t: Transaction, table: Table, from: number, until: number) => t.query(t.sql`SELECT * FROM ${t.sql.ident(table)} WHERE id BETWEEN ${from} AND ${until}`) as Promise<RetType[]>;
