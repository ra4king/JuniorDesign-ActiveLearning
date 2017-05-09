'use strict';

const config = require('./config.json');
const port = config.port;
const base_url = config.base_url;

var express = require('express');

const main = express();
const server = require('http').createServer(main);

const app = express();
main.use(base_url, app);

require('./site.js')(server, app, base_url);

server.listen(port, function() {
    console.log('Site is up at port ' + port + '.');
});
