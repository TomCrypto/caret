// DB load/save logic (including query filters)



var nedb = require('nedb');


var openDatabase = function(options, ready) {
    var datastore = new nedb({
        filename: options.filename,
        autoload: true,
        onload: (err) => {
            ready(err);
        }
    });

    return {
        saveMessage: function(message) {
            datastore.insert(message);
            options.callback(message);
        }
    };
};









module.exports = {
    openDatabase: openDatabase,
};