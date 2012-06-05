
var jspfetch = require('../lib/jspfetch');

exports.basic = function(test){
        test.expect(1);
        jspfetch(function(db) {
            console.log(db);
            test.ok(db.length > 33, "all busses fetched");
            test.done();
        });
};
