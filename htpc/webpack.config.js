var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: [
        './src/client/app'
    ],
    devtool: 'eval-source-map',
    output: {
        path: path.join(__dirname, 'build/webpack'),
        filename: 'app.js',
        publicPath: '/webpack/'
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loaders: ['babel-loader'],
            include: path.join(__dirname, 'src/client')
        }]
    }
};