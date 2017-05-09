'use strict';

const config = require('./config.json');
const port = config.port;
const base_path = config.base_path;

var express = require('express');

const main = express();
const server = require('http').createServer(main);

const app = express();
main.use(base_path, app);

require('./site.js')(server, app, base_path);

server.listen(port, function() {
    console.log('Site is up at port ' + port + '.');
});
