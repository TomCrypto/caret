var publicDir = process.argv[2];
var databaseDir = process.argv[3];
var env = "test"; // for now

const config = require('./config')[env];

const path = require('path');

var express = require('express');
var app = express();
app.use('/', express.static(publicDir)); // ← adjust
app.listen(3000, function() { console.log('listening'); });

app.get('/test', function(req, res) {
    res.send("this is /test!");
});

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
    console.log(`Server error:\n${err.stack}`);
    server.close();
});



var nedb = require('nedb');
var datastore = new nedb({
    filename: path.join(databaseDir, config.root, config.filename)
});

datastore.loadDatabase();







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
                num: data.num,
                num2: data.num2,
                nested: {
                    z: data.z,
                    sz: data.sz
                }
            };
        }, encode: (message) => {
            // ???
            return undefined;
        }
    }
}

var MessageTypeMap = {
    0x02: MessageType.TestMessage
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

    var protocolVersion = buffer[1] & 0xF;

    if (protocolVersion != VERSION) {
        throw new Error("Invalid protocol version.");
    }

    if (MessageTypeMap[buffer[2]] === undefined) {
        throw new Error("Unknown message type.");
    }

    var messageOrig = TransportMap[buffer[1] >> 4];
    var messageType = MessageTypeMap[buffer[2]];
    var messageChan = buffer[3];

    var data = decodeData(buffer.slice(4), messageType.format, LE);

    if (data === undefined) {
        throw new Error("Failed to parse message.");
    }

    var message = messageType.decode(data);

    return {
        received: new Date().toISOString(),
        type:     messageType.name,
        channel:  messageChan,
        origin:   messageOrig,
        message:  message
    }
}

server.on('message', (packet, rinfo) => {
    var message = parseMessage(packet);

    console.log(JSON.stringify(message, null, 2));

    datastore.insert(message);
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