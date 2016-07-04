var nedb = require('nedb');
var mailer = require("nodemailer");


const setup = (options) => {
    return new Promise((fulfill, reject) => {
        var datastore = new nedb({
            filename: options.filename,
            autoload: true,
            onload: (err) => {
                if (err) {
                    reject(err);
                } else {
                    const db = {
                        saveMessage: function(message) {
                            datastore.insert(message);
                            options.callback(message);
                        }
                    };

                    fulfill(datastore);
                }
            }
        });
    });
};

/* ======================================================================== */

module.exports = {
    setup: setup,
};

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