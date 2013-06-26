
/**
 * Module dependencies.
 */

var express = require('express'),
    fs = require('fs');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use('/', express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
fs.readdirSync(__dirname + '/routes').forEach(function(f) {
    console.log("Loading", f);
    if (/.+\.js/.test(f)) {
        require('./routes/' + f)(app);
    }
});

app.listen(process.env.PORT || 8150, function(){
  console.log("Express server listening on port %d in %s mode", 
              process.env.PORT, app.settings.env);
});
