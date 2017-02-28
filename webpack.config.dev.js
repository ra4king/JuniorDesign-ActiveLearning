const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: './src/client/professor/professor-app.jsx',
    output: {
        filename: 'professor-bundle.js',
        path: path.resolve(__dirname, 'public', 'js')
    },
    module: {
        rules: [
            { test: /\.(js|jsx)$/, use: 'babel-loader' }
        ]
    }
}
