const dgram = require('dgram');
const Promise = require('bluebird');
const protocol = require('./protocol');

// TODO: am I using promises right here for send() and close()?

/* ======================================================================== */
/* ==== Back-end endpoint implementation using UDP.                    ==== */
/* ======================================================================== */

// TODO: this isn't the right way to create an object, review this

const udp = {};

udp.createInstance = (server, options, callbacks) => {
    const object = {
        server: server,
        options: options,
        targets: options.targets,
        callbacks: callbacks,
    };

    object.send = (...args) => udp.send(object, ...args);
    object.close = (...args) => udp.close(object, ...args);

    return object;
};

udp.receive = (object, packet, remoteInfo) => {
    var message = protocol.decode(packet);

    message.received = new Date(); // TODO: abstract this away?

    object.callbacks.receive(message);
};

udp.send = (object, message, type, transport) => {
    return new Promise((fulfill, reject) => {
        const buffer = protocol.encode(message, type, transport, object.options.flags);

        object.server.send(buffer, port     = object.options.send.port,
                                   address  = object.options.send.address,
                                   callback = (err) => {
            (err === null) ? fulfill() : reject(err);
        });
    });
};

udp.close = (object) => {
    return new Promise((fulfill, reject) => {
        object.server.close(() => fulfill());
    });
};

const udpEndpoint = function(options, callbacks) {
    return new Promise((fulfill, reject) => {
        const server = dgram.createSocket(options.ipv6 ? 'udp6' : 'udp4');

        // this is only set until successful bind
        server.on('error', (err) => reject(err));

        server.bind(options.recv.port, options.recv.address, () => {
            fulfill(udp.createInstance(server, options, callbacks));
        });
    }).then((object) => {
        object.server.on('message', (packet, remoteInfo) => {
            udp.receive(object, packet, remoteInfo);
        });

        // reset error callback with the correct back-end callback
        object.server.on('error', (err) => callbacks.problem(err));

        return object;
    });
};

/* ======================================================================== */
/* ==== Main function that sets up back-end message routing.           ==== */
/* ======================================================================== */

const setup = (endpoints, callbacks) => {
    return Promise.map(endpoints, (endpoint) => {
        return endpoint.protocol(endpoint.options, callbacks);
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
    }
};

/* ======================================================================== */

module.exports.setup = setup;
module.exports.Endpoint = {
    UDP: udpEndpoint
};