
var jspfetch = require('../lib/jspfetch');

/**
 * Fetch tomorrow
 */
exports.tomorrow = function(test){
    test.expect(1);
    jspfetch(function(db) {
        var cnt = 0; for (var key in db) ++cnt;
        console.log(db);
        test.ok(db['2'], "all busses not fetched");
        // the test run gets 10 busses + nightshift
        test.ok(cnt > 10, "all busses not fetched");
        test.done();
    }, true, true);
};
/** 
 * Fetch today 
 */
exports.tomorrow = function(test) {        
    test.expect(2);
    jspfetch(function(db) {
        var cnt = 0; for (var key in db) ++cnt;
        console.log(db);
        test.ok(db['2'], "all busses not fetched");
        // the test run gets 10 busses + nightshift
        test.ok(cnt > 10, "all busses not fetched");
        test.done();
    }, false, true);
}
