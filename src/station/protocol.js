// encoding/decoding logic of messages

const constants = require('./constants');

const pack = require('bufferpack');


/* TODO: implement these somehow */


function parseIP(ipInteger) {
    var a = (ipInteger >>  0) & 0xFF;
    var b = (ipInteger >>  8) & 0xFF;
    var c = (ipInteger >> 16) & 0xFF;
    var d = (ipInteger >> 24) & 0xFF;

    return `${a}.${b}.${c}.${d}`;
}



var ErrorMap = {
    0x0000: constants.Errors.ExampleFault,
};

var FileMap = {
    0x0000: constants.Files.Main,
    0x0001: constants.Files.Wifi,
};


var TransportLayer = {
    WiFi: 'WiFi',
    GPRS: 'GPRS',
    Satellite: 'Satellite',
    Radio: 'Radio'
}


var TransportLayerMap = {
    0x0: TransportLayer.WiFi,
    0x1: TransportLayer.GPRS,
    0x2: TransportLayer.Satellite,
    0x3: TransportLayer.Radio
}

var Flags = {
    None: 1 << 0,
};


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
                    'error': ErrorMap[data[12 + i]],
                    'line': data[6 + i],
                    'file': FileMap[data[0 + i]],
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
    0x0002: MessageType.TestMessage,
    0x0004: MessageType.FaultMessage,
}



const PROTOCOL_VERSION = 0x1;

function unpackBuffer(buffer, format, endian) {
    if (buffer.length === pack.calcLength(endian + format)) {
        return pack.unpack(endian + format, buffer);
    } else {
        return undefined;
    }
}

function packRawData(rawData, format, endian) {
    return pack.pack(endian + format, rawData);
}


function decode(buffer) {
    if (buffer.length < 4) {
        throw new Error("Invalid buffer size.");
    }

    var endianness;

    if (buffer[0] == 0x00) {
        endianness = '<';
    } else if (buffer[0] == 0xFF) {
        endianness = '>';
    } else {
        throw new Error("Invalid byte order mark.");
    }

    if ((buffer[1] & 0x3) != PROTOCOL_VERSION) {
        throw new Error("Invalid protocol version.");
    }

    // TODO: parse and handle protocol flags here

    var msgTypeID; // on two bytes, need endianness

    if (endianness == '<') {
        msgTypeID = buffer.readUInt16LE(2);
    } else {
        msgTypeID = buffer.readUInt16BE(2);
    }

    if (MessageTypeMap[msgTypeID] === undefined) {
        throw new Error("Unknown message type.");
    }

    var messageOrig = TransportLayerMap[(buffer[1] >> 2) & 0x3];
    var messageType = MessageTypeMap[msgTypeID];

    var data = unpackBuffer(buffer.slice(4), messageType.format, endianness);

    if (data === undefined) {
        throw new Error("Failed to parse message.");
    }

    var message = messageType.decode(data);

    return {
        type:     messageType.name,
        source:   messageOrig,
        flags:    Flags.None,
        message:  message
    }
}


function encode(message, type, source, flags = Flags.None) {
    throw new Error("Encode not implemented yet!"); // todo
}


function flagsToString(flags) {
    const flagList = [];

    // TODO: here

    if (flagList.length > 0) {
        return JSON.stringify(flagList);
    } else {
        return "(no protocol flags)";
    }
};








module.exports = {
    encode: encode,
    decode: decode,
    TransportLayer: TransportLayer,
    MessageType: MessageType,
    Flags: Flags,
    flagsToString: flagsToString,
};