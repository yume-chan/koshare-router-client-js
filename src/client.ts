import AsyncOperationManager from '@yume-chan/async-operation-manager';
import { connect as connectWebSocket } from '@yume-chan/fallback-websocket';
import MultiMap, { ReadonlyMultiMap } from '@yume-chan/multi-map';

import { ServerPacket, PacketType, SubscribeSuccessResponsePacket, ForwardPacket } from './packet';

type ForwardPacketHandler<T> = (packet: ForwardPacket<T>) => void;

export interface AsyncOperationResponsePacket {
    id: number;
}

export default class KoshareClient {
    public static async connect(endpoint: string, prefix: string = ''): Promise<KoshareClient> {
        return new KoshareClient(prefix, await connectWebSocket(endpoint));
    }

    private _prefix: string;
    public get prefix(): string { return this._prefix; }

    protected _socket: WebSocket;
    public get socket(): WebSocket { return this._socket; }

    protected _disconnected: boolean;
    public get disconnected(): boolean { return this._disconnected; }

    private _operationManager: AsyncOperationManager = new AsyncOperationManager();

    protected _handlers: MultiMap<string, Function> = new MultiMap();
    public get handlers(): ReadonlyMultiMap<string, Function> { return this._handlers; }

    private _keepAliveInterval: number;

    private _keepAliveTimeoutId: NodeJS.Timeout | null = null;

    protected constructor(prefix: string, socket: WebSocket, keepAliveInterval = 60 * 1000) {
        this._prefix = prefix;

        this.prepareSocket(socket);
        this._socket = socket;
        this._disconnected = false;

        this._keepAliveInterval = keepAliveInterval;
        this.resetKeepAlive();
    }

    protected prepareSocket(socket: WebSocket) {
        socket.addEventListener('error', () => {
            // do nothing
        });

        socket.addEventListener('close', () => {
            this._disconnected = true;
        });

        socket.addEventListener('message', ({ data }) => {
            const packet = JSON.parse(data as string) as ServerPacket<AsyncOperationResponsePacket>;
            const topic = packet.topic.substring(this._prefix.length);

            switch (packet.type) {
                case PacketType.Message:
                case PacketType.Broadcast:
                    for (const handler of this._handlers.get(topic)) {
                        handler(packet);
                    }
                    break;
                case PacketType.Subscribe:
                    /* istanbul ignore if */
                    if ('error' in packet) {
                        this._operationManager.reject(packet.id, new Error(packet.error));
                    } else {
                        this._operationManager.resolve(packet.id, packet);
                    }
                    break;
            }
        });
    }

    private resetKeepAlive() {
        if (this._keepAliveTimeoutId !== null) {
            clearTimeout(this._keepAliveTimeoutId);
        }

        this._keepAliveTimeoutId = setTimeout(() => {
            this.send(PacketType.Error, 'keep-alive');
        }, this._keepAliveInterval);
    }

    protected checkMessageBody(forbiddenKeys: string[], body: object | undefined): void {
        if (typeof body !== 'object' || body === null) {
            return;
        }

        for (const key of forbiddenKeys) {
            if (key in body) {
                throw new TypeError(`key "${key}" is forbidden in message body`);
            }
        }
    }

    protected async send(type: PacketType, topic: string, body?: object): Promise<void> {
        if (this._disconnected) {
            throw new Error('the KoshareClient instance is disconnected');
        }

        topic = this._prefix + topic;

        const forbiddenKeys = ['type', 'topic'];
        this.checkMessageBody(forbiddenKeys, body);

        this._socket.send(JSON.stringify({ ...body, type, topic, }));
        this.resetKeepAlive();
    }

    protected async sendOperation<T>(type: PacketType, topic: string, body?: object): Promise<ServerPacket<T>> {
        const forbiddenKeys = ['id'];
        this.checkMessageBody(forbiddenKeys, body);

        const [id, promise] = this._operationManager.add<ServerPacket<T>>();
        await this.send(type, topic, { id, ...body });
        return await promise;
    }

    public async subscribe<T extends object>(topic: string, handler: ForwardPacketHandler<T>): Promise<void> {
        if (this._handlers.size(topic) === 0) {
            await this.sendOperation<SubscribeSuccessResponsePacket>(PacketType.Subscribe, topic);
        }

        this._handlers.add(topic, handler);
    }

    public unsubscribe(topic: string): Promise<void>;
    public unsubscribe<T extends object>(topic: string, handler: ForwardPacketHandler<T>): Promise<void>;
    public async unsubscribe<T extends object>(topic: string, handler?: ForwardPacketHandler<T>): Promise<void> {
        if (typeof handler === 'undefined') {
            this._handlers.delete(topic);
        } else {
            this._handlers.delete(topic, handler);
        }

        if (this._handlers.size(topic) === 0) {
            await this.send(PacketType.Unsubscribe, topic);
        }
    }

    public async broadcast<T extends object>(topic: string, body?: T): Promise<void> {
        await this.send(PacketType.Broadcast, topic, body);
    }

    public async message<T extends object>(topic: string, destination: number, body?: T): Promise<void> {
        await this.send(PacketType.Message, topic, { dst: destination, ...body });
    }

    public close() {
        this._disconnected = true;

        this._socket.close();
        clearTimeout(this._keepAliveTimeoutId!);
    }
}
