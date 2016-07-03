const express = require('express');
const Promise = require('bluebird');
const websocket = require("websocket");
const http = require('http');
const https = require('https');
const HashMap = require('hashmap');
const fs = require('fs');

/* ======================================================================== */
/* ==== Main function that sets up front-end web endpoints.            ==== */
/* ======================================================================== */

const setup = (options) => {
    return new Promise((fulfill, reject) => {
        const app = express();

        const frontend = {
            app: app
        };

        if (options.ssl !== undefined) {
            frontend.server = https.createServer({
                key: fs.readFileSync(options.ssl.key),
                cert: fs.readFileSync(options.ssl.cert),
            }, app);
        } else {
            frontend.server = http.createServer(app);
        }

        /* TODO: move this to individual endpoints */
        /* and also report failure somehow? */

        require('express-ws')(app, frontend.server);

        app.use('/', express.static(options.rootDir));

        app.ws('/messages/realtime', (ws, req) => {
            frontend.ws = ws;

            ws.on('message', (msg) => {
                console.log("Message!");
                ws.send("this is server");
            });
        });

        frontend.server.on('error', (err) => {
            // TODO: replace error callback here?
            reject(err);
        });

        frontend.server.listen(options.port, options.address, () => {
            fulfill(frontend);
        });
    });
};

/* ======================================================================== */

module.exports.setup = setup;
module.exports.Endpoints = {
    // TODO
};