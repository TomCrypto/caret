const nedb = require('nedb');
const Promise = require('bluebird');

const protocol = require('./protocol');

// TODO: implement database service

/*
var datastore = new nedb({
filename: options.filename,
autoload: true,
onload: (err) => ...

saveMessage: function(message) {
    datastore.insert(message);
}
*/

/* ======================================================================== */
/* ==== External email service implementation using NodeMailer.        ==== */
/* ======================================================================== */

const mailer = require('nodemailer');

const formatMessageForEmail = (message) => {
    const parts = [];

    parts.push(`Received via ${message.source} on ${message.received}.`);
    parts.push('');
    parts.push(JSON.stringify(message.message, null, 2));

    parts.push('');
    parts.push(`Protocol flags: ${protocol.flagsToString(message.flags)}.`);

    if (message.sent) {
        parts.push(`Message sent on ${message.sent}.`);
    }

    return ['ESP8266 - ' + message.type, parts.join('\n')];
};

const emailSetup = (options) => {
    const smtp = mailer.createTransport(options.server);

    return {
        smtp: smtp,
        sender: options.sender,
    };
};

const emailSend = (email, message, recipient) => {
    const [subject, body] = formatMessageForEmail(message);

    var mail = {
        from: email.sender,
        to: recipient,
        subject: subject,
        text: body
    }

    // TODO: doesn't seem to work with promisify()??
    return new Promise((fulfill, reject) => {
        email.smtp.sendMail(mail, (err) => {
            err ? reject(err) : fulfill();
        });
    });
};

/* ======================================================================== */
/* ==== External SMS service implementation using Twilio.              ==== */
/* ======================================================================== */

const twilio = require('twilio');

const formatMessageForText = (message) => {
    const parts = [];

    parts.push(`${message.type} via ${message.source}`);
    parts.push('');
    parts.push(JSON.stringify(message.message, null, 2));

    parts.push('');
    parts.push(`R: ${message.received}`);

    if (message.sent) {
        parts.push(`S: ${message.sent}`);
    }

    return parts.join('\n');
};

const smsSetup = (options) => {
    const client = new twilio.RestClient(options.auth.sid, options.auth.token);

    return {
        client: client,
        number: options.number,
    };
};

const smsSend = (sms, message, recipient) => {
    // TODO: use promisify()?

    return new Promise((fulfill, reject) => {
        sms.client.sendMessage({
            to: recipient,
            from: sms.number,
            body: formatMessageForText(message)
        }, function(err) {
            err ? reject(err) : fulfill();
        });
    });
};

/* ======================================================================== */
/* ==== Main function that sets up back-end external services.         ==== */
/* ======================================================================== */

const setup = (options) => {
    return Promise.all([
        emailSetup(options.email),
        smsSetup(options.sms),
        // TODO: database
    ]).then(([email]) => {
        return { // TODO: has to be a better way to do this!
            sendEmail: (message, recipient) => {return emailSend(email, message, recipient);},
            sendSMS: (message, recipient) => {return smsSend(sms, message, recipient);}
            // TODO: database functions
        };
    });
};

/* ======================================================================== */

module.exports = {
    setup: setup,
};