var phantom = require('phantom');

var db = [], 
    lock = false, 
    lastUpdate = 0;

var update = exports.update = function(cb) {
    if (new Date().getTime() - lastUpdate
    if (lock) returnl else lock = true;
    phantom.create(function(ph) {
        ph.createPage(function(page) {

            // would be a waste of bandwidth
            page.settings.loadImages = false;

            // smaller than the actual page width so that
            // the coordinates are consistent.
            page.viewportSize = { width: 640, height: 480 };

            var commands = {
                dbadd: function(obj) {
                    for (var key in obj) if (obj.hasOwnProperty(key) 
                        db[key] = obj[key];
                }
                exit: function() {
                    ph.exit();
                }
            }
            page.onConsoleMessage = function(msg) {
                var m = msg.split(":");
                if (commands.hasOwnProperty(m[0])) {
                    commands[m[0]](JSON.parse(m[1]));
                } else {
                    console.log(msg);
                }
            };
            page.open("http://jsp.com.mk/VozenRed.aspx", function() {
                page.evaluate(function() {
                    var exec = function(cmd, obj) {
                        console.log(cmd + ":" + JSON.stringify(obj));
                    };
                    var monitor = function(delay, valFun, chFun) {
                        var oldVal = valFun();
                        return setInterval(function() {
                            var newVal = valFun();
                            if (newVal != oldVal) {
                                chFun(newVal);
                            }
                        });
                    };
                    //JSP has 36 buttons ctl00-ctl34
                    //
                    var numBusses = 36;
                    for (var k = 0; k < numBusses; ++k) {
                        // Close over k for each item
                        function(k) {
                            var ctlId = (k < 10 ? "0" : "") + k.toString();
                            var el = document.getElementById("ctl00_ContentPlaceHolder1_DataList1_ctl"
                                + ctlId + "_btnGrLinija");
                            var elpos = el.getBoundingClientRect();
                            //Try to collect a bus every second.
                            setTimeout(function() { 
                                exec("click", elpos);
                            }, 1000 * k);

                        }(k);
                    }
                    var contEl = document.getElementById("ctl00_ContentPlaceHolder1_UpdatePanel1");

                    var remaining = numBusses;
                    monitor(100, function() { return contEl.innerHTML; }, function(html) {
                        // this is actually very dependant on the inner structure of the element
                        var busName = document.querySelectorAll(
                            "#ctl00_ContentPlaceHolder1_FormView1 table.red_tx tr td div strong")[0].innerText

                        // this seems to be fairly consistent
                        var cells = Array.prototype.slice.call(document.querySelectorAll("#PrintGR td"),0);
                        var locs = {}; 
                        cells.forEach(function(el, i) { 
                            var text = el.innerText, ix = i % 3; 
                            // new start-name column
                            if (/Тргнува/.test(text)) locs[ix] = {name: null, times:[]}; 
                            else if (locs[ix] && !locs[ix].name) locs[ix].name = text; 
                            else el.innerText.split("/").forEach(function(d) { 
                                if (/\d{2}:\d{2}/.test(d)) locs[ix].times.push(d.replace(/[\*\s]/g,"")); 
                            }); 
                        }); 
                        var locsa = [];
                        for (var key in locs) locsa.push(locs[key]);
                        exec("dbadd", {name: busName, starts: locs });
                        if (--remaining) exec("exit", {});
                    });
                },
                function(result) {
                });
            });
        });
    });
};

exports.query = function() {
    if (
}
