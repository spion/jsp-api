/**
 * Fetcher script
 */

var util  = require('util'),
    spawn = require('child_process').spawn;







var dbtransform = function(db) {
    var now = new Date().getTime();
    var o = {};
    for (var day in db) {
        for (var bus in db[day]) {
            var busday = db[day][bus],
                dir1 = busday[0], 
                dir2 = busday[1];

            var ymd = day.split('-').map(function(item) { return parseInt(item, 10); });
            if (!o[bus]) o[bus] = {};
            busday.forEach(function(direction) {
                if (!o[bus][direction.name]) o[bus][direction.name] = [];
                var arr = o[bus][direction.name];
                direction.times.forEach(function(time) {
                    var hm = time.when.split(':')
                        .map(function(item) { return parseInt(item, 10) });
                    var actualTime = new Date(ymd[0], ymd[1] - 1, ymd[2], hm[0], hm[1]);
                        o[bus][direction.name].push({when: actualTime, info:time.info});
                });
                o[bus][direction.name].sort(function(a, b) { 
                    return a.when.getTime() - b.when.getTime();
                });
                o[bus][direction.name] = o[bus][direction.name]
                    .filter(function(item, i) { 
                        return i < 1 || 
                            o[bus][direction.name][i - 1].when.getTime()
                                - item.when.getTime() != 0;
                    });
                var lastTime = null;

            });
        }
    }
    return o;
};




module.exports = function(cb, tomorrow, test) {
    newdb = [];

    var args = [__dirname + '/phantom-jspfetch.js'];
    if (tomorrow) args.push('true'); else args.push('false');
    if (test) args.push('true'); else args.push('false');
    var ph = spawn('phantomjs', args);

    ph.stdout.on('data', function (data) {
        var s = data.toString()
        newdb.push(s);
   });

    ph.on('exit', function (code) {
        var strdata = newdb.join("");
        var json = JSON.parse(strdata);
        //var busses = dbtransform(json); return cb(busses);
        return cb(json);
    });

};
