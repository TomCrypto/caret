var publicDir = process.argv[2];
var databaseDir = '/ssd/caret-database'; /* FOR NOW *///process.argv[3];
var env = "test"; // for now

const config = require('./config')[env];

const path = require('path');
var mailer = require("nodemailer");


const storage = require('./storage');


const Promise = require('bluebird');
const protocol = require('./protocol');

const frontend = require('./frontend');
const backend = require('./backend');


/* Config options - move to config.js later */

config.frontend = {
    port: 3000,
    address: '0.0.0.0',
    ssl: undefined,
    rootDir: publicDir
};

config.backend = [
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

/* end config options */

storage.openDatabase({
    filename: path.join(databaseDir, config.root, config.filename),
}).then((db) => {
    console.log("Database opened!");
}).catch((err) => {
    console.log("Database error!");
});

frontend.setup(config.frontend).then((frontend) => {
    console.log("Front-end ready!");
    console.log(frontend);
}).catch((err) => {
    console.log("Front-end error!");
    console.log(err);
});


backend.setup(config.backend).then((backend) => {
    console.log("ready to send!");

    backend.on('message', (message) => {
        console.log(message);
    })

    backend.on('error', (error) => {
        console.log(error);
    });

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

*/








// TODO: this is how emails can be sent (put in a utility class?)

/*

var smtpTransport = mailer.createTransport(config.email.smtp);

var mail = {
    from: "test@test.com", // kind of needs to be the same user as config.email.smtp anyway
    to: config.email.admin,
    subject: "subject",
    text: "hello world",
    html: "<b>hello world</b>"
}

smtpTransport.sendMail(mail, (error) => {
    if(error){
        console.log(error);
    }else{
        console.log("Message sent!");
    }

    // smtpTransport.close();
});

*/