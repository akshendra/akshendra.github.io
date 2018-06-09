---
title: Reloading the express server without nodemon
published: true
description: 
tags: node, webdev, express
---

I have been using `nodemon` for reloading express server and any other NodeJs code since I started writing backend NodeJS code. It does what it says on the label and does it pretty well. However, the problem with `nodemon` is lack of control and the fact that it seems to kill the process. You write a `console.log` statement and it will restart your whole server, which is all fine and dandy if your server starts quickly. But the situation becomes frustrating when restarting the server means reconnecting to a lot of external services.

### Code to explain, what I am talking about
We start with a pretty simple project with the following directory structure
```
.
├── boot.js
├── index.js
├── package.json
├── routes
│   └── index.js
└── server.js
```

`index.js` is the main script. We call `boot()` here with makes the connection to external services. Once we are connected, we start the `server()` and listen at port `3000`.

```js
const boot = require('./boot');
const server = require('./server');
const debug = require('debug')('app');

boot()
  .then(() => {
    const app = server();
    app.listen(3000, () => {
      debug('Started on 3000');
    });
  })
  .catch((err) => {
    debug(err);
  });
```

`boot.js` makes the connections to external service, which can be a database or a queue. To simulate that, I am just using a promise that will resolve in 10 seconds.

```js
const debug = require('debug')('app');

module.exports = function boot() {
  debug('Connecting to the satellites...');
  return new Promise((resolve) => {
    setTimeout(() => {
      debug('Connected to satellites...');
      resolve();
    }, 10000);
  });
};
```

`server.js` create an `express` app, adds all the middleware required and simply return the app.
```js
const express = require('express');

const routes = require('./routes');

module.exports = function () {
  const app = express();

  app.get('/', (req, res) => {
    res.send('Nothing here...');
  });

  app.use('/', routes);

  return app;
};
```

Now the `route/index.js`, a simple route that is just silly.

```js
const express = require('express');

const router = new express.Router();

router.get('/silly', (req, res) => {
  res.send('Now, I’ve noticed a tendency for this programme to get rather silly');
});

```


### I like your code, but what now?

Well, to start the server we can use `nodemon index.js`.

![Frustation](https://cdn-images-1.medium.com/max/800/1*8el_nMWQac1GXywI0kapow.gif)


As it is clearly visible, the app connects to external service (satellites) every time any change to the code is being made (noted by nodemon), which takes 10s + whatever extra time needed to restart the server.


### Now the solution

To build something that can restart the server when the code is changed, we need a way to listen to file changes. NodeJS `fs` module does give facility to watch over files, but there is something better, [`chokidar`](https://github.com/paulmillr/chokidar).


Using `chokidar` we are going to listen for any changes to `routes/index.js`.

```js
chokidar.watch('./routes').on('all', (event, at) => {
  if (event === 'add') {
    debug('Watching for', at);
  }
  if (event === 'change') {
    debug('Changes at', at);
    restart(); // assume that this exists
  }
});
```

Pretty straightforward. Now we need to figure out what to do in case of a restart. One of the first thing that comes to my mind is a way to `restart` the express server. As shown in `index.js`, we are starting an express app at port `3000`. Surely we can't start an express app at port `3000` again. We need to stop this app first.


From `express` documentation, `app.listen` is basically doing this

```js
app.listen = function() {
  var server = http.createServer(this);
  return server.listen.apply(server, arguments);
};
```

So, `http.Server` is what we need to stop. And by the grace of god we have a `close` method. Let's read the docs,

> Stops the server from accepting new connections and keeps existing connections.
This function is asynchronous, the server is finally closed when all connections are ended and the server emits a '[close](https://nodejs.org/api/net.html#net_event_close)' event.

Oh, so all the connection need to be `closed` before we attempt to close the server. Okay, we need a way to monitor all the connections and manually destroy them if required. We will use `server.on('connection')` to get access to all the connections.

Now that we have a little bit of state to maintain, we will use this very simple object for that,
```js
const state = {
  server: null,
  sockets: [],
};
```

We will start the server like this (remember `server.js` will return `express()` app).

```js
function start() {
  state.server = require('./server')().listen(3000, () => {
    debug('Started on 3000');
  });
  state.server.on('connection', (socket) => {
    debug('Add socket', state.sockets.length + 1);
    state.sockets.push(socket);
  });
}
At the end will destroy all the sockets.
state.sockets.forEach((socket, index) => {
  debug('Destroying socket', index + 1);
  if (socket.destroyed === false) {
    socket.destroy();
  }
});
```

*Before we go any further notice, the `require('./server')` inside the function `start`*


### This is done to avoid require cache

We also need to take care to `require` (CommonJS) cache. As an optimisation, `require` caches your code at the module level. Once it encounters a `require` it will compile the code inside the file and put the result in a cache. Next time it encounters the same `require` it will use the result saved in the cache.

This breaks all our plans. Since the changed code will never be loaded again. We should invalidate the cache, which is basically as simple as deleting the cached result.

```js
function pathCheck(id) {
  return (
    id.startsWith(path.join(__dirname, 'routes')) ||
    id.startsWith(path.join(__dirname, 'server.js'))
  );
}

Object.keys(require.cache).forEach((id) => {
  if (pathCheck(id)) { // delete selectively
    debug('Reloading', id);
    delete require.cache[id];
  }
});
```

That's it basically, we have all the ingredients ready. All we have to do now is put them in the correct order.

```js
const path = require('path');
const debug = require('debug')('app');
const chokidar = require('chokidar');

const boot = require('./boot');

const state = {
  server: null,
  sockets: [],
};

function start() {
  state.server = require('./server')().listen(3000, () => {
    debug('Started on 3000');
  });
  state.server.on('connection', (socket) => {
    debug('Add socket', state.sockets.length + 1);
    state.sockets.push(socket);
  });
}

function pathCheck(id) {
  return (
    id.startsWith(path.join(__dirname, 'routes')) ||
    id.startsWith(path.join(__dirname, 'server.js'))
  );
}

function restart() {
  // clean the cache
  Object.keys(require.cache).forEach((id) => {
    if (pathCheck(id)) {
      debug('Reloading', id);
      delete require.cache[id];
    }
  });

  state.sockets.forEach((socket, index) => {
    debug('Destroying socket', index + 1);
    if (socket.destroyed === false) {
      socket.destroy();
    }
  });

  state.sockets = [];

  state.server.close(() => {
    debug('Server is closed');
    debug('\n----------------- restarting -------------');
    start();
  });
}

boot()
  .then(() => {
    start();
    chokidar.watch('./routes').on('all', (event, at) => {
      if (event === 'add') {
        debug('Watching for', at);
      }

      if (event === 'change') {
        debug('Changes at', at);
        restart();
      }
    });
  })
  .catch((err) => {
    debug(err);
  });
```

The result,

![Better](https://cdn-images-1.medium.com/max/800/1*mzFub3kTFhEcLOHR9z6Bjg.gif)

> This has no error handling, so if your app crashes, it crashes. nodemon does handle crashes. You can easily combine nodemon here by making it ignore the files we are monitoring manually.
> If you are using mongoose, you might encounter an error saying something like `error recompiling model`. Mongoose too maintains a cache of models. You can invalidate it too, by just initialising the object to empty object `mongoose.connection.models = {}; mongoose.models = {};`.
