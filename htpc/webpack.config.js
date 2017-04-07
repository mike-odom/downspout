var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: [
        './src/client/app.tsx'
    ],
    devtool: 'eval-source-map',
    output: {
        path: path.join(__dirname, 'build/webpack'),
        filename: 'webpack.js',
        publicPath: '/webpack/'
    },
    module: {
        loaders: [{
            test: /\.tsx$/,
            loaders: ['awesome-typescript-loader?configFileName=' + path.join(__dirname, 'src/client/tsconfig.json')],
            include: path.join(__dirname, 'src/client')
        }]
    },
    resolve: {
        extensions: ['.js', '.jsx', '.tsx'],
    },
};