module.exports = (config) => {
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '../../',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine', 'detectBrowsers'],

        // list of files / patterns to load in the browser
        files: [
            { pattern: 'spec/utils.ts', watched: false },
            { pattern: 'spec/common/**/*.ts', watched: false },
            { pattern: 'spec/web/**/*.ts', watched: false },
        ],

        // list of files to exclude
        exclude: [
        ],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'spec/**/*.ts': 'webpack'
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
            resolve: {
                extensions: ['.js', '.ts', '.tsx'],
            },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        loader: 'ts-loader',
                        options: {
                            compiler: 'ttypescript'
                        },
                    },
                ],
            },
            stats: {
                colors: true,
                modules: true,
                reasons: true,
                errorDetails: true,
            },
            devtool: 'inline-source-map',
        },

        detectBrowsers: {
            usePhantomJS: false,
            postDetection: (availableBrowsers) => {
                const result = availableBrowsers;
                function removeBrowser(browser) {
                    if (availableBrowsers.length > 1 && availableBrowsers.indexOf(browser) > -1) {
                        result.splice(result.indexOf(browser), 1);
                    }
                }

                removeBrowser('IE');
                removeBrowser('Opera');
                removeBrowser('SafariTechPreview');

                var githubAction = process.env.GITHUB_WORKFLOW != null && process.env.GITHUB_WORKFLOW !== '';
                if (githubAction) {
                    removeBrowser('Firefox');
                    removeBrowser('Safari');
                }

                return result;
            }
        },
    })
}
