declare namespace NodeJS {
	export type ProcessEnv = {
		DATABASE_URL: string;
		TOKEN_GENERATOR_SECRET: string;
		TOKEN_GENERATOR_PUBLIC: string;
		TOKEN_EXPIRATION: string;
		TOKEN_TEMPORARY_EXPIRATION: string;
		TOKEN_RENEWAL_PERIOD: string;
		INIT_PLATFORM_NAME: string;
		INIT_USER_USERNAME: string;
		INIT_USER_PASSWORD: string;
	};
}
