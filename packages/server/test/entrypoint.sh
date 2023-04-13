#!/bin/zsh
set -e

export TOKEN_GENERATOR_SECRET='k4.secret.5yP8kDBeEFOP7aK-ozrUfbA3PrJkEcJn0Txdb3Xv9yX4hAHbu6SvCfQNqDQ-O-6ms2NjfrnkKjoB9MlbTKrH7A';
export TOKEN_GENERATOR_PUBLIC='k4.public.-IQB27ukrwn0Dag0PjvuprNjY3655Co6AfTJW0yqx-w';

pnpm build:test;
pnpm ava --verbose ./out.test/test/server.js;
