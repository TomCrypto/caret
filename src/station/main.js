const services = require('./services');
const protocol = require('./protocol');
const frontend = require('./frontend');
const backend  = require('./backend');
const helpers  = require('./helpers');

const Promise = require('bluebird');

/* ======================================================================== */
/* ==== Main function that encodes all high-level application logic.   ==== */
/* ======================================================================== */

const main = (config) => Promise.all([
    services.setup(config.services),
    frontend.setup(config.frontend),
    backend.setup(config.backend),
]).then(([services, frontend, backend]) => {

    backend.on('message', (message) => {

        services.storeMessage(message).catch((err) => {
            console.log("Failed to save message!"); // TODO
        });

        services.logEvent('info', 'Received message.', message);

        // then implement rules such as: if message.flags has emergency, log as emerg, otherwise log as info?

        frontend.pushMessage(message);

        console.log(message);
    });

    backend.on('error', (err) => {
        services.logEvent('error', 'Back-end error.', err);
    });

    /* Remote control test! */

    {
        var time = 0;

        setInterval(() => {
            time += 1;

            var duty;

            duty = Math.floor((0.5 * Math.sin(time * 0.1) + 0.5) * 44444);

            backend.send({
                duty: duty
            }, protocol.MessageType.PulseWidthMessage, protocol.TransportLayer.WiFi).catch((err) => {
                console.log("Failed to send test message!");
                console.log(err);
            });
        }, 25);
    }

    /* end test */

    /* TODO: hook up front-end to back-end through service events */
    /* e.g. endpoint that sends out message through back-end */
});

/* ======================================================================== */
/* ==== Command-line argument parsing (e.g. selected environment).     ==== */
/* ======================================================================== */

if (process.argv.length !== 3) {
    console.log(`Usage:\n\t${process.argv[0]} ${process.argv[1]} <ENV>`);
} else if (require('./config')[process.argv[2]] === undefined) {
    throw new Error(`No environment '${process.argv[2]}'.`);
} else {
    main(require('./config')[process.argv[2]]).catch((err) => {
        throw err;
    }).done();
}