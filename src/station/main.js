var publicDir = process.argv[2];
var databaseDir = '/ssd/caret-database'; /* FOR NOW *///process.argv[3];
var env = "test"; // for now

const config = require('./config')[env];

const path = require('path');


const storage = require('./storage');



storage.openDatabase({
    filename: path.join(databaseDir, config.root, config.filename),
}, (err) => {

});


var nedb = require('nedb');
var datastore = new nedb({
    filename: path.join(databaseDir, config.root, config.filename)
});

datastore.loadDatabase();





var WebSocketServer = require("websocket").server;
var http = require('http');



var httpServer = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

httpServer.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: httpServer,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}


var HashMap = require('hashmap');

var connections = new HashMap();


wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connections.set(connection, true);
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        connections.remove(connection);
    });
});









var express = require('express');
var app = express();
app.use('/', express.static(publicDir)); // ← adjust
app.listen(3000, function() { console.log('web server listening'); });

app.get('/messages', (req, res) => {
    var date = new Date(req.query.since);
    var offset = parseInt(req.query.offset);
    var count = parseInt(req.query.count);

    datastore.find({received: { $gt: date }}).sort({received: 1}).skip(offset).limit(count).exec((err, docs) => {
        res.json(docs);
    });
});






const Promise = require('bluebird');

const protocol = require('./protocol');

const backend = require('./backend');

config.backend = {};

config.backend.endpoints = [
    {
        protocol: backend.Endpoint.UDP,
        options: {
            ipv6: false,
            recv: {
                port: 2000,
                address: '0.0.0.0'
            },
            send: {
                port: 2000,
                address: '192.168.100.125'
            },
            targets: [protocol.TransportLayer.WiFi],
            flags: protocol.Flags.None
        }
    }
];




backend.setup(config.backend.endpoints, {
    receive: (message) => {
        console.log(message);
    },
    problem: (problem) => {
        console.log(problem);
    }
}).then((backend) => {
    console.log("ready to send!");

    /*backend.send(null, null, protocol.TransportLayer.WiFi).catch((err) => {
        console.log("FAILED TO SEND!!!");
        console.log(err);
    }).done();*/

    //backend.close().done();


}).catch((err) => {
    console.log("FAIL!");
    console.log(err);
});





/* general flow:

1. load database
2. initialize front-end service, with no handlers
3. initialize back-end service, with no handlers
4. hook up front-end handlers to back-end and DB
5. hook up back-end handlers to front-end and DB
6. start both services

this requires slight refactoring of backend.js

*/
