import { randomBytes } from "crypto";
import { Server as WebSocketServer, ServerOptions as WebSocketServerOptions } from 'ws';

export function randomString(length: number = 20) {
    return randomBytes(length).toString('hex');
}

export function randomPort() {
    return 9000 + Math.floor(Math.random() * 1000);
}

export function createWebSocketServer(options: WebSocketServerOptions): Promise<WebSocketServer> {
    return new Promise((resolve, reject) => {
        function handleListening() {
            server.off('listening', handleListening);
            server.off('error', handleError);

            resolve(server);
        }

        function handleError(e: Error) {
            server.off('listening', handleListening);
            server.off('error', handleError);

            reject(e);
        }

        const server = new WebSocketServer(options);

        server.on("listening", handleListening);
        server.on("error", handleError);
    });
}

export function addPacketHandler(server: WebSocketServer): jest.Mock {
    const callback = jest.fn();
    server.on('message', (data) => {
        const packet = JSON.parse(data);
        callback(packet);
    });
    return callback;
}
