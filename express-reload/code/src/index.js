
const path = require('path');
const debug = require('debug')('');
const chokidar = require('chokidar');

const state = {
  app: null,
  sockets: [],
  times: 1,
};

function log(...arr) {
  console.log(`rexs [${state.times}]`, ...arr); // eslint-disable-line
}

function mainFile(base, main) {
  return path.resolve(base, main);
}

function addConnection(socket) {
  state.sockets.push(socket);
}

function start(base, main) {
  try {
    state.app = require(mainFile(base, main))(); // eslint-disable-line
    state.times += 1;
    state.sockets = [];
    if (state.app) {
      state.app.on('connection', addConnection);
    }
  } catch (ex) {
    console.log('\n'); // eslint-disable-line
    log('Error....\n');
    console.error(ex); // eslint-disable-line
    if (state.app) {
      state.app.close();
    }
    console.log('\n'); // eslint-disable-line
    log('Waiting....\n');
  }
}


function pathCheck(base, id, files) {
  return files.reduce((prev, curr) => {
    if (id.indexOf('node_modules') > 0) {
      return false;
    }
    return prev || id.startsWith(path.resolve(base, curr));
  }, false);
}


function restart(base, main, clean, files) {
  clean();

  Object.keys(require.cache).forEach((id) => {
    if (pathCheck(base, id, files)) {
      debug('Reloading', id);
      delete require.cache[id];
    }
  });

  delete require.cache[mainFile(base, main)];

  state.sockets.forEach((socket) => {
    if (socket.destroyed === false) {
      socket.destroy();
    }
  });
  state.app.removeListener('connection', addConnection);
  state.app.close(() => start(base, main));
}


module.exports = function reload(opts) {
  const { main, base, watch, clean, files } = Object.assign({
    base: process.cwd(),
    watch: false,
    clean: () => {},
    files: [],
  }, opts);

  start(base, main);

  if (watch === true) {
    chokidar.watch(files.map(file => {
      return path.resolve(base, file);
    })).on('all', (event, file) => {
      if (event === 'add') {
        debug('Watching for', file);
      }

      if (event === 'change') {
        log('Changes at', file);
        restart(base, main, clean, files);
      }
    });
  }

  return start.app;
};
