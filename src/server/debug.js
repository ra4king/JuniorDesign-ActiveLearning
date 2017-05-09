'use strict';

const config = require('./config.json');
const port = config.port;
const base_url = config.base_url;

const Webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackConfig = require('../../webpack.config.dev.js');

const compiler = Webpack(webpackConfig);
const server = new WebpackDevServer(compiler, {
    publicPath: base_url + '/js/',
    contentBase: false,
    stats: {
        colors: true
    }
});

const express = require('express')

const app = express();
server.use(base_url, app);

require('./site.js')(server.listeningApp, app, base_url, true);

server.listen(port, function() {
    console.log('Debug site is up at port ' + port + '.');
});
