const webpack = require('webpack');

module.exports = (config) => {
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine', 'webpack'],

        // list of files / patterns to load in the browser
        files: [
            { pattern: 'spec/**/*.spec.ts', watched: false },
        ],

        browsers: [
            'Chrome'
        ],

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'spec/**/*.ts': ['webpack', 'sourcemap'],
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress', 'kjhtml'],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,

        client: {
            clearContext: false // leave Jasmine Spec Runner output visible in browser
        },

        webpack: {
            mode: 'development',
            resolve: {
                extensions: ['.js', '.ts', '.tsx'],
                fallback: {
                    "util": require.resolve("util/"),
                    "url": require.resolve("url/"),
                },
            },
            plugins: [
                new webpack.ProvidePlugin({
                    process: 'process/browser',
                }),
            ],
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        loader: 'ts-loader',
                    },
                ],
            },
            stats: {
                colors: true,
                modules: true,
                reasons: true,
                errorDetails: true,
            },
        },
    })
}
