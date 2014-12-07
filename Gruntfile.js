module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        
        // Configuration to be run (and then tested).
        webdriver: {
            options: {
                updateSauceJob: true,
                user: process.env.SAUCE_USERNAME,
                key: process.env.SAUCE_ACCESS_KEY,
                logLevel: 'verbose'
            },
            chrome_ci: {
                tests: './test/*.js',
                options: {
                    host: 'ondemand.saucelabs.com',
                    port: 80,
                    desiredCapabilities: {
                        browserName: 'chrome',
                        platform: 'Windows 8',
                        version: '31',
                        tags: ['chrome','Windows 8','31'],
                        name: 'grunt-webdriver test',
                        build: process.env.TRAVIS_BUILD_NUMBER || '008'
                    }
                }
            },
            chrome_ciTunnel: {
                tests: './test/*.js',
                options: {
                    port: 4445,
                    desiredCapabilities: {
                        browserName: 'chrome',
                        platform: 'Windows 8',
                        version: '31',
                        tags: ['chrome','Windows 8','31','sauce connect'],
                        'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
                        name: 'grunt-webdriver test',
                        build: process.env.TRAVIS_BUILD_NUMBER
                    }
                }
            },
            local: {
                tests: './test/*.js',
                options: {
                    desiredCapabilities: { 
                        browserName: 'phantomjs'
                    }
                }
            }
        },
        wdjs:{
            options: {
                desiredCapabilities: {
                    browserName: 'chrome'
                },
                reporter: 'XUNIT',// can user all of these: Base | Dot | Doc | TAP | JSON | HTML | List | Min | Spec | Nyan | XUnit | Markdown | Progress | Landing | JSONCov | HTMLCov | JSONStream
                logLevel: 'verbose'
            },
            local: {
                tests: './test/wd/*.js',
                output:'./reports/wd/output.xml'
            }
        }

    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'webdriver']);
    // default task for testing
    grunt.registerTask('wd', ['wdjs']);
    grunt.registerTask('test', ['webdriver:local']);
    grunt.registerTask('testTravis', ['webdriver:chrome_ci' ,'webdriver:chrome_ciTunnel']);

};
