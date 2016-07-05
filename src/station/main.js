const services = require('./services');
const protocol = require('./protocol');
const frontend = require('./frontend');
const backend  = require('./backend');

const Promise = require('bluebird');

/* ======================================================================== */
/* ==== Main function that encodes all high-level application logic.   ==== */
/* ======================================================================== */

const config = require('./config')["test"]; // TODO: improve command line arguments

Promise.all([
    services.setup(config.services),
    frontend.setup(config.frontend),
    backend.setup(config.backend),
]).then(([services, frontend, backend]) => {

    backend.on('message', (message) => {

        // TODO: save to database!
        //services.saveMessage(message);

        if (config.notifications.email.shouldNotify(message)) {
            services.sendEmail(message, config.notifications.email.recipient).catch((err) => {
                console.log(err); // error handling
            });
        }

        if (config.notifications.sms.shouldNotify(message)) {
            services.sendSMS(message, config.notifications.sms.recipient).catch((err) => {
                console.log(err); // error handling
            });
        }

        // TODO: send message to front-end

        console.log(message);
    });

    backend.on('error', (error) => {
        /* TODO: better error handling */
        console.log(error);
    });

    /* TODO: hook up front-end to back-end through service events */
    /* e.g. endpoint that sends out message through back-end */
}).catch((err) => {
    throw err;
}).done();