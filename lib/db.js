var jspfetch = require('./jspfetch');
var cronJob = require('cron').CronJob;



var db = {}, 
    lock = false, 
    lastUpdate = null;


var update = exports.update = function() {
    var today = new Date().toISOString().split("T")[0],
        tomorrow = new Date(new Date().getTime() + 1000*60*60*24).toISOString().split("T")[0];
    // if we already have today's DB, end.
    if (db[tomorrow]) return;
    // lock for updates for now.
    if (lock) return; lock = true;
    jspfetch(function(newdb) {
        db[today] = newdb;
        lastUpdate = today;
        jspfetch(function(newdbT) {
            //tomorrow
            db[tomorrow] = newdbT;
        }, true);
        lock = false;
    });
};

// every day 3am
new cronJob('0 0 3 * * *', update, null, true); 

// once for today.
update(new Date().toISOString().split("T")[0]);

exports.list = function(cb) {
    var today = new Date().toISOString().split("T")[0],
        b = [];
    if (db[today]) for (var bus in db[today]) b.push(bus);
    return cb(null, b);
}

exports.query = function(buslist, cb) {
    var today = new Date().toISOString().split("T")[0],
        tomorrow = new Date(new Date().getTime() + 1000*60*60*24).toISOString().split("T")[0];

    try {
    var response = {};
    response[today] = {}; response[tomorrow] = {};

    if (!db[today]) return cb("Updating database, please wait", db)
    buslist.forEach(function(b) { 
        response[today][b] = db[today][b]; 
        if (db[tomorrow]) response[tomorrow][b] = db[tomorrow][b];
    });
    return cb(null, response);
    } catch (e) {
        return cb(e, response);
    }
}
