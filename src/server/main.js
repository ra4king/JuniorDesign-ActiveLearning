'use strict';

const port = 1337;
const base_url = '/active-learning';

var express = require('express');

const main = express();
const server = require('http').createServer(main);

const app = express();
main.use(base_url, app);

require('./site.js')(server, app, base_url);

server.listen(port, function() {
    console.log('Site is up at port ' + port + '.');
});
