let result: typeof WebSocket;

if (process.env.FORCE_WS) {
    result = require("ws");
} else if (typeof WebSocket !== 'undefined') {
    result = WebSocket;
} else {
    result = require("ws");
}

export default result;
