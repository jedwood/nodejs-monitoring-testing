require('nodefly').profile(
    '123abc',
    ['NODE PaaS TEST', 'local dev'],
    {blockThreshold: 10}
);

var express = require('express'),
    config   = require('nconf'),
    app     = express();

config.argv().env().file({ file: '../config.json' });
config.defaults({'PORT': 1337, SECRET: 'default secret.'});

app.configure(function(){
  app.set('port', config.get('PORT'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.logger('dev'));
  app.use(express.errorHandler());
});

app.get('/', function(req, res) {
  res.send("hello world");
});

app.get('/block/:n', function(req, res){
  var blockres = fibonacci(parseInt(req.param('n'), 10));
  res.send("done: " + blockres);
});

app.listen(app.get('port'), function(){
  console.log("Node.js Hosting Test listening on port " + config.get('PORT') + ', running in ' + app.settings.env + " mode, Node version is: " + process.version);
});

function fibonacci(n) {
  if (n < 2)
    return 1;
  else
    return fibonacci(n-2) + fibonacci(n-1);
}
