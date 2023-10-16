# Koshare Router Client

![Node.js CI](https://github.com/yume-chan/koshare-router-client-js/workflows/Node.js%20CI/badge.svg)
![license](https://img.shields.io/npm/l/@yume-chan/koshare-router-client)
![npm type definitions](https://img.shields.io/npm/types/@yume-chan/koshare-router-client)
[![npm version](https://img.shields.io/npm/v/@yume-chan/koshare-router-client)](https://www.npmjs.com/package/@yume-chan/koshare-router-client)
![npm bundle size](https://img.shields.io/bundlephobia/min/@yume-chan/koshare-router-client)

A Koshare Router client implementation for browsers and Node.js

- [What's Koshare Router](#whats-koshare-router)
- [Protocol Specification](#protocol-specification)
- [Install](#install)
  - [Node.js](#nodejs)
- [API](#api)
  - [prefix](#prefix)
- [Usage](#usage)
- [Development](#development)
  - [Install dependencies](#install-dependencies)
  - [Testing](#testing)
  - [Coverage](#coverage)
- [License](#license)

## What's Koshare Router

Koshare Router is a simple publish/subscribe protocol running on WebSocket, originally designed by [@gladkikhartem](https://github.com/gladkikhartem).

## Protocol Specification

Read [here](https://github.com/yume-chan/koshare-router-nodejs/blob/master/docs/protocol-specification.md).

## Install

``` shell
npm i @yume-chan/koshare-router-client
```

### Node.js

`ws` is a peer dependency, so you need to install it manually for Node.js.

``` shell
npm install ws
```

## API

``` ts
type ForwardPacketHandler<T> = (packet: ForwardPacket<T>) => void;

export class KoshareClient {
    static connect(endpoint: string, prefix?: string): Promise<KoshareClient>;

    subscribe<T extends object>(topic: string, handler: ForwardPacketHandler<T>): Promise<void>;

    unsubscribe(topic: string): Promise<void>;
    unsubscribe<T extends object>(topic: string, handler: ForwardPacketHandler<T>): Promise<void>;

    broadcast<T extends object>(topic: string, body?: T): Promise<void>;
    message<T extends object>(topic: string, destination: number, body?: T): Promise<void>;

    close(): void;
}

export class KoshareReconnectClient extends KoshareClient {
    static connect(endpoint: string, prefix?: string): Promise<KoshareReconnectClient>;
}
```

The `KoshareReconnectClient` will try to reconnect automatically when connection is lost.

### prefix

Call `connect()` with `prefix` will append prefix to all topics automatically, helping avoid collsions with other users.

## Usage

``` ts
import KoshareClient from '@yume-chan/koshare-router-client';

(async () => {
    const echo = await KoshareClient.connect('wss://chensi.moe/koshare');
    await echo.subscribe('echo', async (packet) => {
        await echo.message('echo', packet.src, { ...packet, type: undefined, topic: undefined, src: undefined, dst: undefined });
    });

    const client = await KoshareClient.connect('wss://chensi.moe/koshare');
    await client.subscribe('echo', (packet) => {
        console.log(packet);
    });
    await client.broadcast('echo', { content: 'test' });

    echo.close();
    client.close();
})();
```

## Development

This project uses [pnpm](https://pnpm.js.org/) ([GitHub](https://github.com/pnpm/pnpm)) to manage dependency packages.

### Install dependencies

``` shell
pnpm i
```

You may also use `npm`, but the lockfile may become out of sync.

### Testing

``` shell
npm test
```

### Coverage

``` shell
npm run coverage
```

## License

MIT
