# Koshare Router Client

[![travis-ci](https://travis-ci.org/yume-chan/koshare-router-client-js.svg?branch=master)](https://travis-ci.org/yume-chan/koshare-router-client-js)
[![Greenkeeper badge](https://badges.greenkeeper.io/yume-chan/koshare-router-client-js.svg)](https://greenkeeper.io/)

A Koshare Router client implementation for both browsers and Node.js

- [Koshare Router Client](#Koshare-Router-Client)
  - [What's Koshare Router](#Whats-Koshare-Router)
  - [Protocol Specification](#Protocol-Specification)
  - [Install](#Install)
  - [API Docs](#API-Docs)
    - [prefix](#prefix)
    - [Example](#Example)
    - [Reconnect Client](#Reconnect-Client)
  - [Development](#Development)
    - [Install dependencies:](#Install-dependencies)
    - [Testing](#Testing)
    - [Coverage](#Coverage)
  - [License](#License)

## What's Koshare Router

Koshare Router is a simple publish/subscribe protocol based on WebSocket designed by [@gladkikhartem](https://github.com/gladkikhartem).

## Protocol Specification

Read [here](https://github.com/yume-chan/koshare-router-nodejs/blob/master/docs/protocol-specification.md).

## Install

``` shell
npm i @yume-chan/koshare-router-client
```

For Node.js usage, add [ws](https://github.com/websockets/ws):

``` shell
npm i ws
```

## API Docs

``` ts
type ForwardPacketHandler<T> = (packet: ForwardPacket<T>) => void;

export default class KoshareClient {
    static connect(endpoint: string, prefix?: string): Promise<KoshareClient>;

    subscribe<T extends object>(topic: string, handler: ForwardPacketHandler<T>): Promise<void>;

    unsubscribe(topic: string): Promise<void>;
    unsubscribe<T extends object>(topic: string, handler: ForwardPacketHandler<T>): Promise<void>;

    broadcast<T extends object>(topic: string, body?: T): Promise<void>;
    message<T extends object>(topic: string, destination: number, body?: T): Promise<void>;

    close(): void;
}
```

### prefix

Call `connect()` with `prefix` will append prefix to all topics automatically, helping avoid collsions with other users.

### Example

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

### Reconnect Client

The `KoshareReconnectClient`, extends `KoshareClient`, will automatically reconnect if it got disconnected.

The usage is same as `KoshareClient`.

``` ts
import { KoshareReconnectClient } from '@yume-chan/koshare-router-client';
```

## Development

This project uses [pnpm](https://pnpm.js.org/) ([GitHub](https://github.com/pnpm/pnpm)) to manage dependency packages.

### Install dependencies:

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
