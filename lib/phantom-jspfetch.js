/**
 * Fetcher script
 */




var page = require('webpage').create();


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
        //console.log("clicking on", x, y);
        page.sendEvent("click", x, y);
    },
    "Sys.WebForms.PageRequestManagerTimeoutException": function(msg) {
        // dumb ajax manager fails. Attempt 2 more times
        if (++fails <= 2) setTimeout(function() { commands.click(lastClick) }, 1000 * (fails + 1) * (fails + 1));
    }
}

page.onConsoleMessage = function(msg) {
    //console.log(msg);
    var m = msg.substr(0, msg.indexOf(":"));
    if (commands.hasOwnProperty(m)) {
        try {
            commands[m](JSON.parse(msg.substr(msg.indexOf(":")+1)));
        } catch (e) {
            commands[m](msg.substr(msg.indexOf(":")+1));
        }
    } else {
        //console.log(msg);
    }
};

page.open("http://jsp.com.mk/VozenRed.aspx", function() {
    var evalfn = function() {


        function asyncForEach(array, iterator, then) {
            function loop(i) {
                if (i < array.length) 
                    iterator(array[i], function() { loop(i + 1); });
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
                if (newVal != oldVal) chFun(newVal);
                // if timed out, notify timeout
                else if (maxWait && ++cnt * delay > maxWait) chFun(null);
                // otherwise re-check again later
                else setTimeout(checkFn, delay);
            }
            setTimeout(checkFn, delay);
        };


        // Begin actual fetching
        // JSP has 35 buttons ctl00-ctl34

        var numBusses = 35;

        var buttonIds = [];
        for (var k = 0; k < numBusses; ++k) {
            var ctlId = (k < 10 ? "0" : "") + k.toString();
            buttonIds.push("ctl00_ContentPlaceHolder1_DataList1_ctl"
                    + ctlId + "_btnGrLinija");
        }

        var contEl = "ctl00_ContentPlaceHolder1_UpdatePanel1";

        asyncForEach(buttonIds, function(id, next) {
            var el = document.getElementById(id);
            if (el) {

                var elpos = el.getBoundingClientRect();

                // after a certain delay
                setTimeout(function() { 
                    // click where the element is
                    exec("click", elpos);

                    // setup a monitor to wait on next change of html
                    changeCheck(100, function() { return document.getElementById(contEl).innerHTML; }, function(html) {
                        // if html is null, timeout occured after 10 seconds fetch time
                        if (!html) { console.log("timeout"); return next(); }

                        // not the best selector but should be good enough
                        var busName = document.querySelectorAll(
                            "#ctl00_ContentPlaceHolder1_FormView1 table.red_tx tr td div strong")[0].innerText,

                            // this seems to be fairly consistent
                            cells = Array.prototype.slice.call(document.querySelectorAll("#PrintGR td"),0),

                        locs = {}; 

                    cells.forEach(function(el, i) { 
                        var text = el.innerText, ix = i % 3; 
                        // new start-name column
                        if (/Тргнува/.test(text)) locs[ix] = {name: null, times:[]}; 
                        else if (locs[ix] && !locs[ix].name) locs[ix].name = text; 
                        else el.innerText.split("/").forEach(function(d) { 
                            if (/\d{2}:\d{2}/.test(d)) locs[ix].times.push(d.replace(/[\*\s]/g,"")); 
                        }); 
                    }); 

                    // convert to array, then add
                    var locsa = [];
                    for (var key in locs) locsa.push(locs[key]);
                    exec("dbadd", {name: busName, starts: locsa });

                    next();

                    }, 25000);


                }, 100); 


            }

        }, function() {
            exec("exit", {});
        });


    };
    setTimeout(function() { page.evaluate(evalfn); }, 100);

});

