/*
 * Sample restify server that also accepts socket.io connections.
 *
 * This example shows how to:
 *
 * - serve some API via Restify
 * - serve static files via Restify
 * - receive socket.io connection requests and reply with asynchronous messages (unicast and broadcast)
 */

const
    fs = require("fs"),
    restify = require("restify"),
    socketio = require("socket.io");

const
    SERVER_PORT = 8000,
    PATH_TO_CLIENT_SIDE_SOCKET_IO_SCRIPT = __dirname + "/node_modules/socket.io-client/dist/socket.io.slim.js",
    server = restify.createServer(),
    io = socketio.listen(server.server);

const clientsOnline = new Set();

// sample api that generates random numbers
server.get("/random", (req, res) => res.send({ value: (Math.random() * 1000).toFixed(0)} ));

// serve client-side socket.io script
server.get("/socket.io.js", (req, res) => fs.createReadStream(PATH_TO_CLIENT_SIDE_SOCKET_IO_SCRIPT).pipe(res));

// serve static files under /public
server.get("/*", restify.plugins.serveStatic({
    directory: __dirname + "/public",
    default: "index.html",
}));

// handle socket.io clients connecting to us
io.sockets.on("connect", socket => {
    clientsOnline.add(socket);
    io.emit("clients-online", clientsOnline.size);

    // handle client disconnect
    socket.on("disconnect", () => {
        clientsOnline.delete(socket);
        io.emit("clients-online", clientsOnline.size);
    })
});

// send regular messages to all socket.io clients with the current server time
setInterval(() => clientsOnline.size > 0 && io.emit("server-time", (new Date()).toISOString()), 100);

server.listen(SERVER_PORT, "0.0.0.0", () => console.log(`Listening at ${server.url}`));
