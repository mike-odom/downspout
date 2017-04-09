var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: [
        path.join(__dirname, './src/app.tsx')
    ],
    devtool: 'source-map',
    output: {
        path: path.join(__dirname, 'build'),
        filename: 'webpack.js',
        publicPath: '/webpack/'
    },
    module: {
        loaders: [{
            test: /\.tsx|.ts$/,
            loaders: ['awesome-typescript-loader?configFileName=' + path.join(__dirname, 'tsconfig.json')],
            include: path.join(__dirname, 'src')
        }]
    },
    resolve: {
        extensions: ['.js', '.jsx', '.tsx', '.ts'],
    },
};