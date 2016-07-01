var publicDir = process.argv[2];
var databaseDir = process.argv[3];
var env = "test"; // for now

const config = require('./config')[env];

const path = require('path');




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
app.listen(3000, function() { console.log('listening'); });

app.get('/messages', (req, res) => {
    var date = new Date(req.query.since);
    var offset = parseInt(req.query.offset);
    var count = parseInt(req.query.count);

    datastore.find({received: { $gt: date }}).sort({received: 1}).skip(offset).limit(count).exec((err, docs) => {
        res.json(docs);
    });
});

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
    console.log(`Server error:\n${err.stack}`);
    server.close();
});









const pack = require('bufferpack');


var Transport = {
    WiFi: 'WiFi',
    GPRS: 'GPRS',
    Satellite: 'Satellite',
    Radio: 'Radio'
}

var TransportMap = [
    Transport.WiFi,       /* 0x00 */
    Transport.GPRS,       /* 0x01 */
    Transport.Satellite,  /* 0x02 */
    Transport.Radio       /* 0x03 */
]

function parseIP(ipInteger) {
    var a = (ipInteger >>  0) & 0xFF;
    var b = (ipInteger >>  8) & 0xFF;
    var c = (ipInteger >> 16) & 0xFF;
    var d = (ipInteger >> 24) & 0xFF;

    return `${a}.${b}.${c}.${d}`;
}


/* TODO: implement these somehow */

function lookupError(id) {
    return "Something went wrong!";
}

function lookupFile(id) {
    return "main.nim";
}



var MessageType = {
    TestMessage: {
        name: 'TestMessage',
        format: [
            'L(ip)',
            'H(y)',
            'f(num)',
            'd(num2)',
            'L(z)',
            'h(sz)',
        ].join(), decode: (data) => {
            return {
                ip: parseIP(data.ip),
                y: data.y,
                num: data.num,
                num2: data.num2,
                nested: {
                    z: data.z,
                    sz: data.sz
                }
            };
        }, encode: (message) => {
            // TODO: implement
            return undefined;
        }
    },
    FaultMessage: {
        name: "FaultMessage",
        format: 'HHHHHHHHHHHHHHHHHHB',
        decode: (data) => {
            var num = data[18];
            var overflow = num > 6;

            var msg = {
                stackTrace: [],
                omittedFrames: overflow == 1,
            };

            /* stack trace is in reverse order */

            for (var i = num - 1; i >= 0; --i) {
                msg.stackTrace.push({
                    'error': lookupError(data[12 + i]),
                    'line': data[6 + i],
                    'file': lookupFile(data[0 + i]),
                })
            }

            return msg;
        }, encode: (message) => {
            // TODO: implement
            return undefined;
        }
    }
}

var MessageTypeMap = {
    0x02: MessageType.TestMessage,
    0x04: MessageType.FaultMessage,
}



function decodeData(buffer, format, endian) {
    if (buffer.length === pack.calcLength(endian + format)) {
        return pack.unpack(endian + format, buffer);
    } else {
        return undefined;
    }
}


const VERSION = 0x1;


function parseMessage(buffer) {
    if (buffer.length < 4) {
        throw new Error("Invalid buffer size.");
    }

    var LE = (buffer[0] == 0x00) ? '<' : '>';

    var protocolVersion = buffer[1] & 0x3;

    if (protocolVersion != VERSION) {
        throw new Error("Invalid protocol version.");
    }

    if (MessageTypeMap[buffer[2]] === undefined) {
        throw new Error("Unknown message type.");
    }

    var messageOrig = TransportMap[(buffer[1] >> 2) & 0x3];
    var messageType = MessageTypeMap[buffer[2]];
    var messageChan = buffer[3];

    var data = decodeData(buffer.slice(4), messageType.format, LE);

    if (data === undefined) {
        throw new Error("Failed to parse message.");
    }

    var message = messageType.decode(data);

    return {
        received: new Date(),
        type:     messageType.name,
        channel:  messageChan,
        origin:   messageOrig,
        message:  message
    }
}

server.on('message', (packet, rinfo) => {
    var message = parseMessage(packet);

    datastore.insert(message);

    connections.forEach(function(_, conn) {
        conn.sendUTF(JSON.stringify(message));
    });
});

server.bind(2000)











var SerialPort = require('serialport');

var initializeSerial;

initializeSerial = () => {
    var port = new SerialPort.SerialPort('/dev/ttyUSB0', {
        parser: SerialPort.parsers.readline('\n')
    }, false);

    port.open();

    port.on('open', () => {
        console.log("Serial port open!")
    });

    port.on('data', (str) => {
        console.log("[SERIAL READ] " + str);
    });

    port.on('close', () => {
        console.log("Serial port closed");
        setTimeout(initializeSerial, 1000);
    });

    port.on('error', () => {
        console.log("Error serial!");
        setTimeout(initializeSerial, 1000);
    });
};

initializeSerial();