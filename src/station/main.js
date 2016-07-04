const config = require('./config')["test"]; // TODO: improve command line arguments

const Promise = require('bluebird');

const storage  = require('./storage');
const protocol = require('./protocol');
const frontend = require('./frontend');
const backend  = require('./backend');

/* ======================================================================== */
/* ==== Main function that encodes all high-level application logic.   ==== */
/* ======================================================================== */

Promise.all([
    storage.setup(config.storage),
    frontend.setup(config.frontend),
    backend.setup(config.backend),
]).then(([database, frontend, backend]) => {
    backend.on('message', (message) => {
        /* TODO:
         *
         * 1. write message to storage
         * 2. optionally send out notification?
         * 3. send to front-end
        */

        console.log(message);
    })

    backend.on('error', (error) => {
        /* TODO: better error handling */
        console.log(error);
    });

    /* TODO: hook up front-end to back-end through service events */
}).catch((err) => {
    throw err;
}).done();