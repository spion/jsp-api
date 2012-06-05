/**
 * Fetcher script
 */

var util  = require('util'),
    spawn = require('child_process').spawn;

module.exports = function(cb) {

    newdb = [];

    var ph = spawn('phantomjs', [__dirname + '/phantom-jspfetch.js']);

    ph.stdout.on('data', function (data) {
        var s = data.toString()
        newdb.push(s);
        //console.log(s);
    });

    ph.on('exit', function (code) {
        var strdata = newdb.join("");
        console.log(strdata);
        var json = JSON.parse(strdata);
        cb(json);
    });

};
