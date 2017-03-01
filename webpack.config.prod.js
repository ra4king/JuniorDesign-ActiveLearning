const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: {
        professor: './src/client/professor/professor-app.jsx',
        student: './src/client/student/student-app.jsx',
        login: './src/client/login.jsx',
        admin: './src/client/admin-app.jsx'
    },
    output: {
        filename: '[name]-bundle.js',
        path: path.resolve(__dirname, 'public', 'js')
    },
    module: {
        rules: [
            { test: /\.jsx$/, loader: 'babel-loader' }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: function(module) {
                return module.context && module.context.indexOf('node_modules') != -1;
            }
        })
    ]
}
