
var jspfetch = require('../lib/jspfetch');

/**
 * Fetch tomorrow
 */
exports.tomorrow = function(test){
    test.expect(1);
    jspfetch(function(db) {
        console.log(db);
        test.ok(db['12'], "all busses not fetched");
        test.done();
    }, true);
};
/** 
 * Fetch today 
 */
exports.tomorrow = function(test) {        
    test.expect(1);
    jspfetch(function(db) {
        console.log(db);
        test.ok(db[12], "all busses not fetched");
        test.done();
    });
}
