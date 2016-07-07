const Promise = require('bluebird');

const helpers  = require('./helpers');

/* ======================================================================== */
/* ==== External message store implementation using ElasticSearch.     ==== */
/* ======================================================================== */

const elasticsearch = require('elasticsearch');
const nStore = require('nstore');
const path = require('path');

const storeSetup = (options) => {
    const search = new elasticsearch.Client({
        host: options.search.hostname,
        log: options.search.logging,
    });

    const stores = {
        messages: nStore.new(path.join(options.storePath, 'messages')),
        events: nStore.new(path.join(options.storePath, 'events')),
    };

    return {
        store: (category, type, data) => {
            const key = stores.messages.length + 1;

            const backupMessage = new Promise((fulfill, reject) => {
                stores[category].save(key, data, (err) => {
                    err ? reject(err) : fulfill();
                });
            });

            const indexMessage = new Promise((fulfill, reject) => {
                search.create({
                    index: category,
                    type: type,
                    id: key.toString(),
                    body: data,
                }, (err) => {
                    err ? reject(err) : fulfill();
                });
            });

            return Promise.all([backupMessage, indexMessage]);
        }
    };
};

/* ======================================================================== */
/* ==== External email service implementation using NodeMailer.        ==== */
/* ======================================================================== */

const mailer = require('nodemailer');

const emailSetup = (options) => {
    const smtp = mailer.createTransport(options.auth);

    return {
        smtp: smtp,
        sender: options.sender,
        recipient: options.recipient
    };
};

const emailSend = (email, recipient, subject, body, priority) => {
    var mail = {
        from: email.sender,
        to: recipient,
        subject: subject,
        text: body,
        priority: priority
    };

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

const smsSetup = (options) => {
    const client = new twilio.RestClient(options.auth.sid, options.auth.token);

    return {
        client: client,
        number: options.number,
        recipient: options.recipient
    };
};

const smsSend = (sms, recipient, body) => {
    // TODO: use promisify()?

    return new Promise((fulfill, reject) => {
        sms.client.sendMessage({
            to: recipient,
            from: sms.number,
            body: body,
        }, function(err) {
            err ? reject(err) : fulfill();
        });
    });
};

/* ======================================================================== */
/* ==== Logging service, which uses the other external services.       ==== */
/* ======================================================================== */

const winston = require('winston');
const util = require('util');

const syslog = winston.config.syslog.levels;



const protocol = require('./protocol');

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




const makeEmailTransport = (options, email) => {
    const EmailTransport = winston.transports.CustomLogger = function() {
        this.name = 'EmailTransport';
        this.level = options.level;
    };

    util.inherits(EmailTransport, winston.Transport);

    EmailTransport.prototype.log = (level, msg, meta, callback) => {
        const body = JSON.stringify(meta, null, 4);

        var priority;

        if (syslog[level] <= syslog.warning) {
            priority = 'high';
        } else if (syslog[level] <= syslog.info) {
            priority = 'normal';
        } else {
            priority = 'low';
        }

        emailSend(email, options.recipient, msg, body, priority).then(() => {
            callback(null);
        }).catch((err) => callback(err));
    };

    return new EmailTransport();
};

// TODO: implement makeSMSTransport and makeDatabaseTransport

const loggingSetup = (options, email, sms, database) => {
    const transports = [];

    options.forEach((option) => {
        switch (option.transport) {
            case 'email':
                transports.push(makeEmailTransport(option, email));
                break;
            case 'sms':
                transports.push(makeSMSTransport(option, sms));
                break;
            case 'database':
                transports.push(makeDatabaseTransport(options, database));
                break;
            case 'file':
                transports.push(new winston.transports.File({
                    timestamp: helpers.getLocalDate,
                    filename: option.filename,
                    level: option.level,
                    json: false,
                }));
                break;
            default:
                throw new Error(`Unknown transport '${option.name}'.`);
        }
    });

    return new(winston.Logger)({
        transports: transports,
        levels: syslog,
    });
};

/* ======================================================================== */
/* ==== Main function that sets up back-end external services.         ==== */
/* ======================================================================== */

const setup = (options) => {
    return Promise.all([
        emailSetup(options.email),
        smsSetup(options.sms),
        storeSetup(options.store),
    ]).then(([email, sms, store]) => {
        const logging = loggingSetup(options.logging, email, sms, store);

        return {
            sendEmail: (message) => {
                const [subject, body] = formatMessageForEmail(message);
                return emailSend(email, subject, body);
            },
            sendSMS: (message) => {
                const body = formatMessageForText(message);
                return smsSend(sms, body);
            },
            storeMessage: (message) => {
                return store.store('messages', 'default', message);
            },
            logEvent: (level, msg, meta = {}) => {
                return new Promise((fulfill, reject) => {
                    logging.log(level, msg, meta, (err) => {
                        err ? reject(err) : fulfill();
                    });
                });
            }
        };
    });
};

/* ======================================================================== */

module.exports = {
    setup: setup,
};