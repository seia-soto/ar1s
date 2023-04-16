# @ar1s/server

The server part of `@ar1s`.

----

# Design and Environment

**Preface**

The development of ar1s project based on several **unix commands and docker** for testing to deploying.
We only support the development on **latest version of macOS and Linux**.

## Getting started

To get started, you'll need to install Node.JS and several dependencies for the data source.
However, we don't have any seriously strict condition to the dependencies.

You'll just need to prepare the latest Node.JS LTS or higher version and `docker` command ready.

Some details are the following:
- Node.JS v18 (LTS) or higher
  - Pnpm (install via `npm i -g pnpm`)
- Docker

> See the following environment specific instructions before continuing.

After setting up the environment, you can use following commands to prepare the environment:

```sh
# export the data source path
export DATABASE_URL='postgres://test-user@localhost:5432/test-db'

# start the docker stack
pnpm stack:up

# migrate the database schema to the data source
pnpm db:push

########################################

# shutdown the stack
pnpm stack:down
```

All resources provided by `pnpm stack:up` is temporal.
You'll lost all data when the containers are down.

### Instructions for non-dockerized environment

Running the server without Docker and UNIX environment is still possible.
You'll need to prepare the **local copy of postgres and keydb (or redis) server**.

After doing so, export `DATABASE_URL` environment variable in your current shell.

Also read:
- We don't define any connection url to the keydb instance.
- We require the server to be fresh installed in every test run.

### Instructions for macOS (especially on M1)

> You can just install Docker CE for Linux environment that support the Docker out of box.

**Using colima**

On M1 macs, using [colima](https://github.com/abiosoft/colima) instead of Docker Desktop is highly recommended.
It's minimal drop-in replacement for Docker Desktop, and just works well with less resources.

## Ecosystem structures

The ecosystem can be separated into three parts: **application code**, **repositories**, and **modules**.

The **repository** is a set of actions related to the reflection of specific object from database.
For example, we defined all functions related to the user action in `./src/specs`.

The **module** is a set of functions under specific subject.
Just like the **repositories**, **modules** can depend or relate on the reflection of the objects, but the core diff is that **modules** are not the reflection of object from database.
For example, we never place the `token` module that generates and validates the token to the `./src/specs` directory.

We'll see how each parts are used in detail one by one if required.

### Application code

**Entrypoint**

To be scalable and highly extensible, we defined `createServer` function in `./src/server/index.ts` taking `FastifyServerOptions` as optional first argument.
You'll need to import the function from that file to initialize and create Fastify instance.

```typescript
import {createServer} from '<source>';

export const server = await createServer(...);
```

You can define your own configuration to the Fastify on demand.

The example use of this is located in `./test/server.ts`.
We define our testing purpose logger on demand without any additional changes or reflection on the `createServer`.

### Modules

**ws**

`ws` module is a Fastify plug-in to implement the WebSocket support using `ws` library.
It's originated from `@fastify/websocket` but adds some core functionality to optimize the performance on huge environments.

All of additional functionalities are to support the easy authentication of WebSocket before connection is made.

> Ability to determine if we should connect before upgrading the request

This is huge jump from the original library.
We can establish the WebSocket connection by using `resolveWebSocket` when we want.

```ts
interface FastifyRequest {
  resolveWebSocket?: () => Promise<WebSocketWithConnection>;
}
```

By determining if we need to accept the WebSocket connection before upgrading the request is to optimize the general resource use and enable the proper authentication flow without ping-ponging in WebSocket.
