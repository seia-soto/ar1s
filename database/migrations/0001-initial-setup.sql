create table "platform" (
  id serial primary key not null,
  flag int not null,
  "name" text not null,
  token text not null,
  "usedTokens" int not null,
  "usedMessages" int not null,
  "createdAt" timestamp not null,
  "updatedAt" timestamp not null
);

create table "user" (
  id serial primary key not null,
  flag int not null,
  platform serial references "platform"(id) not null,
  username text not null,
  "password" text not null,
  "displayName" text not null,
  "displayAvatarUrl" text not null,
  "displayBio" text not null,
  "usedTokens" int not null,
  "usedMessages" int not null,
  "createdAt" timestamp not null,
  "updatedAt" timestamp not null,
  unique(username)
);

create table "conversation" (
  id serial primary key not null,
  flag int not null,
  model text not null,
  "systemMessage" text not null,
  "createdAt" text not null,
  "updatedAt" text not null
);

create table "conversationMember" (
  id serial primary key not null,
  flag int not null,
  "displayName" text not null,
  "displayAvatarUrl" text not null,
  "displayBio" text not null,
  "usedTokens" int not null,
  "usedMessages" int not null,
  "createdAt" timestamp not null,
  "updatedAt" timestamp not null
);

create table "message" (
  id serial primary key not null,
  flag int not null,
  author serial references "conversationMember"(id) not null,
  "conversation" serial references "conversation"(id) not null,
  content text not null,
  "createdAt" timestamp not null,
  "updatedAt" timestamp not null
);
