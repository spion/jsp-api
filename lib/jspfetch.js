/**
 * Fetcher script
 */

var util  = require('util'),
    spawn = require('child_process').spawn;

module.exports = function(cb, tomorrow) {
    newdb = [];

    var args = [__dirname + '/phantom-jspfetch.js'];
    if (tomorrow) args.push('true');
    var ph = spawn('phantomjs', args);

    ph.stdout.on('data', function (data) {
        var s = data.toString()
        newdb.push(s);
   });

    ph.on('exit', function (code) {
        var strdata = newdb.join("");
        var json = JSON.parse(strdata);
        var busses = {};
        for (var k = 0; k < json.length; ++k) {
            if (!json[k]) continue;
            for (var key in json[k].starts) {
                if (!busses[json[k].name]) 
                    busses[json[k].name] = json[k].starts;
                else {
                    busses[json[k].name].forEach(function(item, ix) {
                        json[k].starts[ix].times.forEach(function(t) {
                            item.times.push(t);
                        });
                    });
                }
            }
            if (json[k]) busses[json[k].name] = json[k].starts;
        }
        cb(busses);
    });

};
