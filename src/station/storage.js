var nedb = require('nedb');


const openDatabase = (options) => {
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
    openDatabase: openDatabase,
};