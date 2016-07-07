const dgram = require('dgram');
const Promise = require('bluebird');
const protocol = require('./protocol');

const helpers = require('./helpers');

// TODO: am I using promises right here for send() and close()?

/* ======================================================================== */
/* ==== Back-end endpoint implementation using UDP.                    ==== */
/* ======================================================================== */

udpCreateInstance = (server, options) => {
    const callbacks = {};

    const udp = {
        receive: (packet, remoteInfo) => {
            var message = protocol.decode(packet);

            message.received = helpers.getLocalDate(); // TODO: where to put this?

            if (callbacks['message'] !== undefined) {
                callbacks['message'](message);
            }
        },
        send: (message, type, transport) => {
            return new Promise((fulfill, reject) => {
                const buffer = protocol.encode(message, type, transport, options.flags);

                server.send(buffer, port     = options.send.port,
                                    address  = options.send.address,
                                    callback = (err) => {
                    (err === null) ? fulfill() : reject(err);
                });
            });
        },
        close: () => {
            return new Promise((fulfill, reject) => {
                server.close(() => fulfill());
            });
        },
        on: (event, callback) => {
            callbacks[event] = callback;
        },
        targets: options.targets
    };

    server.on('message', (packet, remoteInfo) => {
        udp.receive(packet, remoteInfo);
    });

    server.on('error', (err) => {
        if (callbacks['error'] !== undefined) {
            callbacks['error'](err);
        }
    });

    return udp;
};

const udpEndpoint = function(options) {
    return new Promise((fulfill, reject) => {
        const server = dgram.createSocket(options.ipv6 ? 'udp6' : 'udp4');

        // this is only set until successful bind
        server.on('error', (err) => reject(err));

        server.bind(options.recv.port, options.recv.address, () => {
            fulfill(udpCreateInstance(server, options));
        });
    });
};

/* ======================================================================== */
/* ==== Main function that sets up back-end message routing.           ==== */
/* ======================================================================== */

const setup = (endpoints) => {
    return Promise.map(endpoints, (endpoint) => {
        return endpoint.protocol(endpoint.options);
    }).then((setups) => Promise.all(setups)).then((instances) => {
        return {
            send: (message, type, transport) => {
                return Promise.filter(instances, (instance) => {
                    return instance.targets.indexOf(transport) !== -1;
                }).then((ableToSend) => {
                    if (ableToSend.length === 0) {
                        throw new Error(Errors.noEndpoint(transport));
                    } else {
                        return ableToSend;
                    }
                }).map((instance) => {
                    return instance.send(message, type, transport);
                }).all();
            },
            close: () => {
                return Promise.map(instances, (instance) => {
                    return instance.close();
                }).all();
            },
            on: (event, callback) => {
                instances.forEach((instance) => {
                    instance.on(event, callback);
                });
            }
        };
    });
};

/* ======================================================================== */
/* ==== Strings used in error messages produced by this module.        ==== */
/* ======================================================================== */

const Errors = {
    noEndpoint: (transport) => {
        return `Message not sent: no endpoint can assume ${transport} delivery.`;
    },
    noSuchEvent: (event) => {
        return `No such event '${event}'.`;
    }
};

/* ======================================================================== */

module.exports.setup = setup;
module.exports.Endpoint = {
    UDP: udpEndpoint
};