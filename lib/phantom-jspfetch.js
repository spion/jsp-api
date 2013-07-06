/**
 * Fetcher script
 */




var page = require('webpage').create();

var fetchTomorrow = phantom.args && phantom.args[0] == 'true';

var fetchTestonly = phantom.args && phantom.args.length > 1 && phantom.args[1] == 'true';


page.viewportSize = {width:1600,height:1200};

var lastClick = {}, fails = 0;


var busdb = {};

var commands = {
    dbadd: function(bus) {
        // add a new bus to the database
        if (!busdb[bus.name]) busdb[bus.name] = {};
        for (var dir in bus.starts) {
            if (!busdb[bus.name][dir]) busdb[bus.name][dir] = [];
            bus.starts[dir].forEach(function(start) { busdb[bus.name][dir].push(start); });
        }
        // reset failures
        fails = 0;
    },

    exit: function() {
        console.log(':::', JSON.stringify(busdb));
        // close phantom instance
        phantom.exit();
    },
    click: function(bounds) {
        lastClick = bounds;
        var x = Math.round((bounds.left + bounds.right) / 2),
            y = Math.round((bounds.top + bounds.bottom) / 2);
        page.sendEvent("click", x, y);
    },
    "Sys.WebForms.PageRequestManagerTimeoutException": function(msg) {
        // dumb ajax manager fails. Attempt 2 more times
        if (++fails <= 2) setTimeout(function() { commands.click(lastClick) }, 1000 * (fails + 1) * (fails + 1));
    }
}

page.onConsoleMessage = function(msg) {
    //console.log(msg)
    var m = msg.substr(0, msg.indexOf(":"));
    if (commands.hasOwnProperty(m)) {
        try {
            commands[m](JSON.parse(msg.substr(msg.indexOf(":")+1)));
        } catch (e) {
            console.log(e);
            commands[m](msg.substr(msg.indexOf(":")+1));
        }
    } else {
        //console.log("Page message: " + msg);
    }
};

page.open("http://jsp.com.mk/VozenRed.aspx", function() {

    page.evaluate("function () { window.fetchTomorrow = " + fetchTomorrow.toString() + "; return true;}");
    page.evaluate("function () { window.fetchTestonly = " + fetchTestonly.toString() + "; return true;}");

    var evalfn = function() {

        var fetchD = new Date(window.dateToFetch);

        function asyncForEach(array, iterator, then) {
            function loop(i) {
                if (i < array.length) iterator(array[i], function() { loop(i + 1); });
                else then && then();
            }   
            loop(0);
        };


        var exec = function(cmd, obj) {
            console.log(cmd + ":" + JSON.stringify(obj));
        };

        var changeCheck = function(delay, valFun, chFun, maxWait) {
            var oldVal = valFun(), cnt = 0;
            var checkFn = function() {
                var newVal = valFun();
                // if changed, notify
                if (newVal != oldVal) chFun(newVal, true);
                // if timed out, notify timeout
                else if (maxWait && ++cnt * delay > maxWait) chFun(null, false);
                // otherwise re-check again later
                else setTimeout(checkFn, delay);
            }
            setTimeout(checkFn, delay);
        };
        var A = function(na) { return Array.prototype.slice.call(na, 0); }
        var Q = function(q, parentEl) { 
            parentEl = parentEl ? parentEl : document;
            if (q.hasOwnProperty('innerHTML')) return [q];
            return A(parentEl.querySelectorAll(q)); 
        }

        var clickAndWait = function(clickSelector, valueSelector, timeout, cb) {
            setTimeout(function() {
                var el = Q(clickSelector);
                el.length && exec('click', el[0].getBoundingClientRect());
            }, 50);
            changeCheck(100, function() {
                var el = Q(valueSelector);                
                return el.length?el[0].innerHTML:"";
            }, cb, timeout);
        };



        // Begin actual fetching
        // JSP has 35 buttons ctl00-ctl34


        var doFetch = function(dataList, suffix, numBusses, fetchcb) {
            var numBusses = numBusses?numBusses:35;

            var buttonIds = [];
            for (var k = 0; k < numBusses; ++k) {
                var ctlId = (k < 10 ? "0" : "") + k.toString();
                buttonIds.push("#ctl00_ContentPlaceHolder1_DataList"+dataList+"_ctl"
                        + ctlId + "_btn"+suffix+"Linija");
            }

            var dayChanged = false;

            var contEl = 
                asyncForEach(buttonIds, function(id, next) {
                    console.log(id, Q(id).length);
                    // What to do when schedule is fetched
                    var cb = function(html) {
                        // if html is null, timeout occured after 10 seconds fetch time
                        if (!html) { console.log("timeout"); return next(); }

                        // not the best selector but should be good enough
                        var busName = Q(
                            "#ctl00_ContentPlaceHolder1_FormView"+dataList
                                +" table.red_tx tr td div strong")[0].innerText,

                            // this seems to be fairly consistent
                            cells = Q("#Print"+suffix.toUpperCase()+" td"), locs = {}; 

                        cells.forEach(function(el, i) { 
                            var text = el.innerText, col = i % 3; 
                            // new start-name column
                            if (/Тргнува/.test(text)) locs[col] = {name: null, times:[]}; 
                            else if (locs[col] && !locs[col].name) locs[col].name = text; 
                            else if (locs[col] &&  locs[col].name) {
                                el.innerText.split("/").forEach(function(d) { 
                                    var matches = d.match(/(\d{1,2}:\d{2})(.*)/);
                                    if (matches)
                                        locs[col].times.push({when: matches[1], info: matches[2]}); 
                                }); 
                            }
                        }); 

                        // convert to array, then add
                        var locsa = {};
                        for (var key in locs) locsa[locs[key].name] = locs[key].times;
                        exec("dbadd", {name: busName, starts: locsa });
                        next();
                    }
                    // this is the date and bus holder, changes when any of the two change.
                    var headingHolder = "#ctl00_ContentPlaceHolder1_UpdatePanel"+dataList
                        +" #Print" + suffix.toUpperCase() + " .main_tx";
                    clickAndWait(id, headingHolder, 20000, function(html) {
                        // If we are simply fetching today, callback and exit.
                        
                        if (!window.fetchTomorrow || dayChanged) return cb(html);
                        // this button activates the calendar.
                        clickAndWait("#ctl00_ContentPlaceHolder1_ImageButton" + dataList, 
                            "body > .calendar", 1000, function(cal) {
                                var days = Q("body > .calendar td.day");
                                var todayIndex = days.map(function(a) { 
                                    return A(a.classList).indexOf('today') != -1; 
                                }).indexOf(true);
                                // If its not the last day of the month we can simply click the next
                                // day in the month.
                                if (todayIndex < days.length) {
                                    clickAndWait(days[todayIndex + 1], headingHolder, 10000, 
                                        function() {
                                            dayChanged = true;
                                            cb(html);
                                        });
                                }
                                else { // today is the last day of the month

                                    // the 3rd button is next month
                                    clickAndWait(Q('body > .calendar .headrow td')[3], "body > .calendar",
                                        1000, function(cal) {

                                            clickAndWait(
                                                // first day cell that isn't a day name
                                                Q(".calendar td.day")
                                                .filter(function(i) { 
                                                    return A(i.classList).indexOf('name') == -1 
                                                })[0], headingHolder, 10000,
                                                function(html) {
                                                    dayChanged = true;
                                                    cb(html);
                                                });
                                        });

                                }
                            });
                    });

                }, fetchcb);
        };


        doFetch('1', 'Gr', fetchTestonly?5:35, function() {
            clickAndWait(Q('.TabbedPanelsTab')[1], '.TabbedPanelsContentGroup', 1000, function() {
                doFetch('2', 'Pr', fetchTestonly?5:41, function() {
                    clickAndWait(Q('.TabbedPanelsTab')[2], '.TabbedPanelsContentGroup',
                        1000, function() {
                            Q('.red_tx .content_tx').forEach(function(busEl) {
                                if (busEl.innerText.split('\n').length <= 1) return;
                                var busImgSrc = Q('img', busEl)[0].src;
                                var busName = busImgSrc.substr(
                                    busImgSrc.lastIndexOf('_') + 1).replace('.jpg','');

                                var locs = {}; 
                               
                                lines = busEl.innerText.split('\n')
                                    .forEach(function(line, ix) {
                                        var col = ix % 2;
                                        if (line.length && !locs[col]) 
                                            locs[col] = {name:line, times:[]};
                                        else if (line.length && /^[0-9]/.test(line)) {
                                            var matches = line.replace(',',':')
                                                .match(/(\d{1,2}:\d{2})(.*)/);
                                            if (matches)
                                                locs[col].times.push({
                                                    when: matches[1], info: matches[2]
                                                }); 
                                        }
                                    });
                                var locsa = {};
                                for (var key in locs) locsa[locs[key].name] = locs[key].times;
                                exec("dbadd", {name: busName, starts: locsa });
 
                            });
                            exec("exit", {});
                        });

                }); // doFetch 2
            }); // clickAndWait [1]
        }) // doFetch 1
    };
    setTimeout(function() { page.evaluate(evalfn); }, 100);

});

