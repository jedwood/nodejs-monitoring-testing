Monitoring and Stress Testing Node.js Apps
---

>Using NodeFly and simple stress testing utilities

So you're sending your first real Node.js app into production. Nervous? You should be. Not because Node isn't ready, but because you haven't yet established a history of gotchas and lessons learned. Are there uncaught exceptions? Did you unknowingly write a blocking function somewhere that will only come back to bite you when your app hits the front page of Hacker News?

In this post we'll explore [NodeFly](http://nodefly.com) for reporting the performance of Node apps, and a few simple tools for stress testing.

## NodeFly Setup

![NodeFly Logo](http://nodefly.com/public/css/images/landing/hexamajig.png)

[Signing up](http://www.nodefly.com) for an account is really simple. After that, we just install via npm:

`npm install nodefly@stable`

and then add a block like this to our app code before any other `require` statements:

        require('nodefly').profile(
          'abc123',
          [APPLICATION_NAME]
        );

And when they say "This must be the first require before you load any modules. Otherwise you will not see data reported" they mean it. I started by first loading [nconf](https://github.com/flatiron/nconf) so that I could use a familiar way of putting the NodeFly config info in and external file. Sure enough, no data reported.

Also note that the second parameter of that `profile` method is in fact an Array. I got stuck on that during my first attempt. It allows you to also include a hostname and a process number, e.g.

        require('nodefly').profile(
          'abc123',
          ['Jed's App', 'local dev', 2]
        );


On the how-to page, NodeFly includes customized setup snippets for Nodejitsu, Heroku, and AppFog.

## Sample App

So let's start with a simple app that runs the fibonacci sequence for a variable number of iterations.

        app.get('/block/:n', function(req, res){
          var blockres = fibonacci(parseInt(req.param('n'), 10));
          res.send("done: " + blockres);
        });

        function fibonacci(n) {
          if (n < 2)
            return 1;
          else
            return fibonacci(n-2) + fibonacci(n-1);
        }

## Stress Testing

There is of course no reason why you need to use tools written in Node to test Node apps. Nevertheless, here are a couple simple ones I found by digging through [npm](https://npmjs.org/package/npm-search)

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
# How the PaaS Providers Stack Up

With our sample app deployed on many different Node PaaS hosts, now we can run some of these simple tests and take a look at our NodeFly dashboard to get some insights on performance. I'll be running `nab` to get a basic sense of how a traffic spike is handled. We'll follow that with a single request to `/block/42` to see how the CPU holds up.

To set a baseline, here are the results from an AWS "micro" instance with a fresh installation of Node 0.10.12:

#### EC2 Micro
    nab http://ec2-23-22-0-60.compute-1.amazonaws.com/block/1
    REQ NUM: 100 RTN NUM: 100 QPS: 33 BODY TRAF: 233B per second
    REQ NUM: 300 RTN NUM: 284 QPS: 47 BODY TRAF: 331B per second

    time to curl /block/42: 8.40

#### Nodejitsu
    nab http://jedwood.nodejitsu.com/block/1
    REQ NUM: 100 RTN NUM: 100 QPS: 33 BODY TRAF: 233B per second
    REQ NUM: 300 RTN NUM: 261 QPS: 43 BODY TRAF: 299B per second

    time to curl /block/42: 17.16s

#### Heroku
    nab http://jedwoodtest.herokuapp.com/block/1
    REQ NUM: 100 RTN NUM: 100 QPS: 33 BODY TRAF: 233B per second
    REQ NUM: 300 RTN NUM: 300 QPS: 49 BODY TRAF: 349B per second
    REQ NUM: 600 RTN NUM: 583 QPS: 64 BODY TRAF: 453B per second

    time to curl /block/42: 5.62s

#### Modulus.io
    nab http://jedwood-7762.onmodulus.net/block/1
    REQ NUM: 100 RTN NUM: 100 QPS: 33 BODY TRAF: 233B per second
    REQ NUM: 300 RTN NUM: 289 QPS: 48 BODY TRAF: 336B per second

    time to curl /block/42: 11.10s

#### AppFog
    nab http://jedwood.aws.af.cm/block/1
    REQ NUM: 100 RTN NUM: 100 QPS: 33 BODY TRAF: 233B per second
    REQ NUM: 300 RTN NUM: 259 QPS: 43 BODY TRAF: 6KB per second

    time to curl /block/42: 5.59s

#### Windows Azure
    nab http://jedwood.azurewebsites.net/block/1
    REQ NUM: 100 RTN NUM: 100 QPS: 33 BODY TRAF: 233B per second
    REQ NUM: 500 RTN NUM: 401 QPS: 66 BODY TRAF: 467B per second

    time to curl /block/42: 9.74s

#### dotCloud
    nab http://jedwood-jedwood.dotcloud.com/block/1
    REQ NUM: 100 RTN NUM: 100 QPS: 33 BODY TRAF: 233B per second
    REQ NUM: 300 RTN NUM: 286 QPS: 47 BODY TRAF: 329B per second

    time to curl /block/42: 9.93s

#### EngineYard
    nab http://204.236.233.168/block/1
    REQ NUM: 200 RTN NUM: 200 QPS: 66 BODY TRAF: 466B per second
    REQ NUM: 600 RTN NUM: 513 QPS: 85 BODY TRAF: 598B per second

    time to curl /block/42: 7.32

#### OpenShift.com
    nab http://test-jedwood.rhcloud.com/block/1
    REQ NUM: 100 RTN NUM: 100 QPS: 33 BODY TRAF: 233B per second
    REQ NUM: 500 RTN NUM: 409 QPS: 68 BODY TRAF: 476B per second

    time to curl /block/42: 52.70s
