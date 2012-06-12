/**
 * Fetcher script
 */




var page = require('webpage').create();

var fetchTomorrow = phantom.args && phantom.args[0] == 'true';


page.viewportSize = {width:1600,height:1200};

var lastClick = {}, fails = 0;

console.log('[');

var commands = {
    dbadd: function(obj) {
        // add a new bus to the database
        //newdb.push(obj);
        console.log(JSON.stringify(obj) + ",");
        // reset failures
        fails = 0;
    },

    exit: function() {
        console.log("null\n]");
        //console.log(JSON.stringify(newdb));
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
            commands[m](msg.substr(msg.indexOf(":")+1));
        }
    } else {
        //console.log("Page message: " + msg);
    }
};

page.open("http://jsp.com.mk/VozenRed.aspx", function() {

    page.evaluate("function () { window.fetchTomorrow = " + fetchTomorrow.toString() + "; return true;}");

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
        var Q = function(q) { 
            if (q.hasOwnProperty('innerHTML')) return [q];
            return A(document.querySelectorAll(q)); 
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

        var numBusses = 35;

        var buttonIds = [];
        for (var k = 0; k < numBusses; ++k) {
            var ctlId = (k < 10 ? "0" : "") + k.toString();
            buttonIds.push("#ctl00_ContentPlaceHolder1_DataList1_ctl"
                    + ctlId + "_btnGrLinija");
        }

        var dayChanged = false;

        var contEl = 
            asyncForEach(buttonIds, function(id, next) {
                // What to do when schedule is fetched
                var cb = function(html) {
                    // if html is null, timeout occured after 10 seconds fetch time
                    if (!html) { console.log("timeout"); return next(); }
                    
                    // not the best selector but should be good enough
                    var busName = Q(
                        "#ctl00_ContentPlaceHolder1_FormView1 table.red_tx tr td div strong")[0].innerText,

                        // this seems to be fairly consistent
                        cells = Q("#PrintGR td"), locs = {}; 

                    cells.forEach(function(el, i) { 
                        var text = el.innerText, col = i % 3; 
                        // new start-name column
                        if (/Тргнува/.test(text)) locs[col] = {name: null, times:[]}; 
                        else if (locs[col] && !locs[col].name) locs[col].name = text; 
                        else el.innerText.split("/").forEach(function(d) { 
                            var matches = d.match(/(\d{1,2}:\d{2})(.*)/);
                            if (matches)
                                locs[col].times.push({when: matches[1], info: matches[2]}); 
                        }); 
                    }); 

                    // convert to array, then add
                    var locsa = [];
                    for (var key in locs) locsa.push(locs[key]);
                    exec("dbadd", {name: busName, starts: locsa });
                    next();
                }
                // this is the date and bus holder, changes when any of the two change.
                var headingHolder = "#ctl00_ContentPlaceHolder1_UpdatePanel1 #PrintGR .main_tx";
                clickAndWait(id, headingHolder, 20000, function(html) {
                    // If we are simply fetching today, callback and exit.
                    
                    if (!window.fetchTomorrow || dayChanged) return cb(html);
                    // this button activates the calendar.
                    clickAndWait("#ctl00_ContentPlaceHolder1_ImageButton1", 
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

            }, function() {
                exec("exit", {});
            });


    };
    setTimeout(function() { page.evaluate(evalfn); }, 100);

});

