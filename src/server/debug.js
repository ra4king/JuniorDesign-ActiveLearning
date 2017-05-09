'use strict';

const config = require('./config.json');
const port = config.port;
const base_path = config.base_path;

const Webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackConfig = require('../../webpack.config.dev.js');

const compiler = Webpack(webpackConfig);
const server = new WebpackDevServer(compiler, {
    publicPath: base_path + '/js/',
    contentBase: false,
    stats: {
        colors: true
    }
});

const express = require('express')

const app = express();
server.use(base_path, app);

require('./site.js')(server.listeningApp, app, base_path, true);

server.listen(port, function() {
    console.log('Debug site is up at port ' + port + '.');
});
