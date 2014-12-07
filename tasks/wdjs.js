var Mocha         = require('mocha'),
    SauceLabs     = require('saucelabs'),
    SauceTunnel   = require('sauce-tunnel'),
    selenium      = require('selenium-standalone'),
    wdjs          = require('wd'),
    util          = require('util'),
    http          = require('http'),
    async         = require('async'),
    hooker        = require('hooker'),
    path          = require('path'),
    fs            = require('fs-extra'),
    deepmerge     = require('deepmerge'),
    server = null,
    isSeleniumServerRunning = false,
    tunnel = null,
    isSauceTunnelRunning = false,
    isHookedUp = false;

module.exports = function(grunt) {

    grunt.registerMultiTask('wdjs', 'run wdjs tests with Mocha', function() {

        var that = this,
            done = this.async(),
            base = process.cwd(),
            options = this.options({
                reporter: 'spec',
                ui: 'bdd',
                slow: 75,
                bail: false,
                grep: null,
                timeout: 1000000,
                updateSauceJob: false,
                output: null,
                quiet: false,
                nospawn: false
            }),
            sessionID = null,
            capabilities = deepmerge(options,this.data.options || {}),
            tunnelIdentifier = options['tunnel-identifier'] || (capabilities.desiredCapabilities ? capabilities.desiredCapabilities['tunnel-identifier'] : null) || null,
            tunnelFlags = (capabilities.desiredCapabilities ? capabilities.desiredCapabilities['tunnel-flags'] : []) || [],
            fd;

        var queue = grunt.task._queue.filter(function(task) {
            return typeof task.placeholder === 'undefined'
        });

        var isLastTask = queue.length === 0;

        /**
         * initialize wdjs
         */
        grunt.log.debug('run wdjs with following capabilities: ' + JSON.stringify(capabilities));
        capabilities.logLevel = options.quiet ? 'silent' : capabilities.logLevel;
        GLOBAL.driver = wdjs.promiseRemote();
        //GLOBAL.driver.init(capabilities.desiredCapabilities);

        /**
         * initialize Mocha
         */
        var mocha = new Mocha(options);

        grunt.file.setBase(base);

        grunt.file.expand(this.data.tests).forEach(function(file) {
            mocha.addFile(file);
        });

        /**
         * hook process.stdout.write to save reporter output into file
         * thanks to https://github.com/pghalliday/grunt-mocha-test
         */
        if(!isHookedUp) {
            if (options.output) {
                fs.mkdirsSync(path.dirname(options.output));
                fd = fs.openSync(options.output, 'w');
            }

            // Hook process.stdout.write
            hooker.hook(process.stdout, 'write', {

                // This gets executed before the original process.stdout.write
                pre: function(result) {

                    // Write result to file if it was opened
                    if (fd && result.slice(0, 3) !== '[D]' && result.match(/\u001b\[/g) === null) {
                        fs.writeSync(fd, result);
                    }

                    // Prevent the original process.stdout.write from executing if quiet was specified
                    if (options.quiet) {
                        return hooker.preempt();
                    }

                }

            });

            isHookedUp = true;
        }

        /**
         * temporary remove the grunt exception handler , to make tasks continue (see also)
          - https://github.com/pghalliday/grunt-mocha-test/blob/master/tasks/mocha.js#L57
          - https://github.com/gregrperkins/grunt-mocha-hack
         */
        var uncaughtExceptionHandlers = process.listeners('uncaughtException');
        process.removeAllListeners('uncaughtException');

        /*istanbul ignore next*/
        var unmanageExceptions = function() {
            uncaughtExceptionHandlers.forEach(process.on.bind(process, 'uncaughtException'));
        };

        /**
         * initialise tunnel
         */
        if(!tunnel && options.user && options.key && tunnelIdentifier) {
            tunnel = new SauceTunnel(options.user , options.key, tunnelIdentifier, true, tunnelFlags);
            tunnel.on('verbose:debug', grunt.log.debug);
        }

        // Clear require cache to allow for multiple execution of same mocha commands
        Object.keys(require.cache).forEach(function (key) {
            delete require.cache[key];
        });

        /**
         * helper function for asyncjs
         */
        var next = function() {
            if(!!this.call)
                this.call(null, null, Array.prototype.slice.call(arguments)[0]);
        }

        async.waterfall([

            /**
             * check if selenium server is already running
             */
            function(callback) {

                if(tunnel) {
                    return callback(null);
                }

                var options = {
                    host: 'localhost',
                    port: 4444,
                    path: '/wd/hub/status'
                };

                http.get(options, function() {
                    isSeleniumServerRunning = true;
                    callback(null);
                }).on('error', function() {
                    callback(null);
                });

            },

            /**
             * start selenium server or sauce tunnel (if not already started)
             */
            function(callback) {

                if(tunnel) {

                    if(isSauceTunnelRunning) {
                        return callback(null,true);
                    }

                    grunt.log.debug('start sauce tunnel');

                    /**
                     * start sauce tunnel
                     */
                    tunnel.start(next.bind(callback));

                } else if(!server && !isSeleniumServerRunning && !options.nospawn) {

                    grunt.log.debug('start selenium standalone server');

                    /**
                     * starts selenium standalone server if its not running
                     */
                    server = selenium.start({ stdio: 'pipe' });

                    /**
                     * listen on server output
                     */
                    ['stderr','stdout'].forEach(function(output) {
                        server[output].on('data', next.bind(callback));
                    });

                } else {

                    callback(null,true);

                }

            },

            /**
             * check if server is ready
             */
            function(output,callback) {

                if(tunnel && !isSauceTunnelRunning) {

                    // output here means if tunnel was created successfully
                    if(output === false) {
                        grunt.fail.warn(new Error('Sauce-Tunnel couldn\'t created successfully'));
                    }

                    grunt.log.debug('tunnel created successfully');
                    isSauceTunnelRunning = true;
                    callback(null);

                } else if(server && !isSeleniumServerRunning && !options.nospawn) {

                    var line = output.toString().trim();

                    grunt.log.debug(line);
                    if (line.indexOf('Started HttpContext[/wd,/wd]') > -1) {
                        grunt.log.debug('selenium server started successfully');
                        isSeleniumServerRunning = true;

                        ['stderr','stdout'].forEach(function(output) {
                            server[output].removeAllListeners('data');
                        });

                        callback(null);
                    }

                } else {

                    callback(null);

                }

            },

            /**
             * init wdjs instance
             */
            function(callback) {
                var b;
                grunt.log.debug('init wdjs instance');

                GLOBAL.b = b = GLOBAL.driver;
                b.on('status', function(info){console.log('[36m%s[0m', info);});b.on('command', function(meth, path, data){  console.log(' > [33m%s[0m: %s', meth, path, data || '');});
                GLOBAL.bInit = GLOBAL.driver.init(capabilities.desiredCapabilities);

                callback(null);
            },

            /**
             * run mocha tests
             */
            function(args,callback) {
                grunt.log.debug('run mocha tests');

                /**
                 * save session ID
                 */
                sessionID = GLOBAL.driver.getSessionId();//GLOBAL.driver.requestHandler.sessionID;

                mocha.run(next.bind(callback));
            },

            /**
             * handle test results
             */
            function(args,callback) {
                grunt.log.debug('handle test results');

                // Restore grunt exception handling
                unmanageExceptions();

                // Close Remote sessions if needed
                //GLOBAL.driver.end(next.bind(callback,args));
                GLOBAL.driver.quit();
                callback(null, args);
            },

            /**
             * destroy sauce tunnel if connected (once all tasks were executed)
             */
            function(args,callback) {

                if(isLastTask && isSauceTunnelRunning) {

                    grunt.log.debug('destroy sauce tunnel if connected (once all tasks were executed)');
                    tunnel.stop(next.bind(callback,args));

                } else {

                    callback(null,args);

                }

            },

            /**
             * update job on Sauce Labs
             */
            function(args,callback) {
                grunt.log.debug('update job on Sauce Labs');

                if(options.user && options.key && options.updateSauceJob) {

                    var sauceAccount = new SauceLabs({
                        username: options.user,
                        password: options.key
                    });

                    sauceAccount.updateJob(sessionID, {
                        passed: args === 0,
                        public: true
                    }, next.bind(callback,args === 0));

                } else {

                    callback(null,args === 0);

                }

            },

            /**
             * finish grunt task
             */
            function(args,callback){
                grunt.log.debug('finish grunt task',args);

                if(isLastTask) {

                    // close the file if it was opened
                    if (fd) {
                        fs.closeSync(fd);
                    }

                    // Restore process.stdout.write to its original value
                    hooker.unhook(process.stdout, 'write');

                }

                done(args);
                callback();
            }
        ]);

    });

};