import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { KoshareServer } from "@yume-chan/koshare-router";

import { randomPort } from "./__helpers__/util.js";

import { KoshareReconnectClient } from "./reconnect-client.js";
import { delay } from "./util.js";

describe("reconnect client", () => {
    let server!: KoshareServer;
    let client!: KoshareReconnectClient;
    let echo!: KoshareReconnectClient;

    const port = randomPort();

    beforeEach(async () => {
        server = await KoshareServer.listen({ port });
        client = await KoshareReconnectClient.connect(`ws://localhost:${port}`);
        echo = await KoshareReconnectClient.connect(`ws://localhost:${port}`);
    });

    afterEach(() => {
        if (typeof echo !== "undefined") {
            echo.close();
        }

        if (typeof client !== "undefined") {
            client.close();
        }

        if (typeof server !== "undefined") {
            server.close();
        }
    });

    test("reconnect", async () => {
        await client.subscribe("test", () => { });

        server.close();

        await delay(100);

        server = await KoshareServer.listen({ port });

        const handlePacket = jest.fn();
        server.on("packet", handlePacket);

        await client.broadcast("test");

        expect(client).toHaveProperty("disconnected", false);
        expect(handlePacket).toBeCalledTimes(1);
    }, 10000);
});
