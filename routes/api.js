var db = require('../lib/db');

module.exports = function(app) {
    app.get("/api", function(req, res) {
        db.query(req.query.list.split(","), function(err, resp) {
            if (err) return res.json(err, 500)
            res.json(resp);
        });
    });
    app.get("/api/busses", function(req, res) {
        db.list(function(err, resp) {
            console.log(err, resp);
            if (err) return res.json({error: err}, 500);
            res.json(resp);
        });
    });
};
