declare namespace NodeJS {
	export type ProcessEnv = {
		DATABASE_URL: string;
		TOKEN_GENERATOR_SECRET: string;
		TOKEN_GENERATOR_PUBLIC: string;
		TOKEN_EXPIRATION: string;
		TOKEN_TEMPORARY_EXPIRATION: string;
		TOKEN_RENEWAL_PERIOD: string;
		KEYDB_POOL_MIN: string;
		KEYDB_POOL_MAX: string;
	};
}
