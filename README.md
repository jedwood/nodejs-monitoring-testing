Monitoring and Stress Testing Node.js Apps
---

>Using NodeFly and simple stress testing utilities

So you're sending your first real Node.js app into production. Nervous? You should be. Not because Node isn't ready, but because you haven't yet established a history of gotchas and lessons learned. Are there uncaught exceptions? Did you unknowingly write a blocking function somewhere that will only come back to bite you when your app hits the front page of Hacker News?

In this post we'll explore [NodeFly](http://nodefly.com) for reporting the performance of Node apps, and a few simple tools for stress testing.

## NodeFly Setup

![NodeFly Logo](http://nodefly.com/public/css/images/landing/hexamajig.png)

Signing up for an account is really simple. After that, we just install via npm and then add a block like this before any other `require` statements:

        require('nodefly').profile(
          'abc123',
          [APPLICATION_NAME]
        );

And when they say "This must be the first require before you load any modules. Otherwise you will not see data reported" they mean it. I started by first loading [nconf](https://github.com/flatiron/nconf) so that I could use a familiar way of putting the NodeFly config info in an external file. Sure enough, no data reported.

Also note that the second parameter of that `profile` method is in fact an Array. I got stuck on that during my first attempt. It allows you to also include a hostname and a process number, e.g.

        require('nodefly').profile(
          'abc123',
          ['Jed's App', 'local dev', 2]
        );


On the how-to page, NodeFly includes customized setup snippets for Nodejitsu, Heroku, and AppFog.

## Sample App

So let's start with a simple app that includes two routes- one that returns `hello world` and another that will cause our app to think a bit by calculating the fibonacci secquence for a variable number of iterations.

        require('nodefly').profile(
          'abc123',
          ['NODE PaaS TEST', 'local dev']
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

## Stress Testing

There is of course no reason why you need to use tools written in Node to test Node apps, nor vice versa. Nevertheless, here are a couple simple ones I found by digging through [npm](https://npmjs.org/package/npm-search)

### node-http-perf

[zanchin/node-http-perf](https://github.com/zanchin/node-http-perf) is a tool with a familiar CLI:

`nperf -c 5 -n 10 http://example.com/`

That will send a total of 10 requests to example.com, 5 at a time.

### node-ab

([doubaokun/node-ab](https://github.com/doubaokun/node-ab)) has an even simpler command:

`nab example.com`

While running, it increases the number of requests by 100 more per second until less than 99% of requests are returned.

### Bees with Machine Guns

Mike Pennisi of [bocoup](http://weblog.bocoup.com/node-stress-test-procedure/) has a great three-part write up of his experience [stress-testing a realtime Node.js app](http://weblog.bocoup.com/node-stress-test-procedure/). His focus was primarily on testing [socket.io](http://socket.io) performance. In the process, he created [a fork of Bees with Machine Guns](https://github.com/jugglinmike/beeswithmachineguns) that's worth checking out if you're looking to do some serious distributed stress testing.

---
# Next: How the PaaS Providers Stack Up

With our sample app deployed on many different Node PaaS hosts, now we can run some of these simple tests and take a look at our NodeFly dashboard to get some insights on performance. Then we'll look at the process of scaling on each PaaS host.
