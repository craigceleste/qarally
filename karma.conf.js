// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      // third party libraries
      'app/bower_components/underscore/underscore.js',
      'app/bower_components/angular/angular.js',
      'app/bower_components/angular-sanitize/angular-sanitize.js',
      'app/bower_components/angular-route/angular-route.js',
      // NOT jQuery 'app/bower_components/jquery/dist/jquery.js'

      // testing tools
      'app/bower_components/angular-mocks/angular-mocks.js',
      'test/mocks/**/*.js',

      // code under test
      'app/scripts/*.js',
      'app/scripts/**/*.js',
      'app/pages/**/*.js',

      // tests
      'test/**/*-spec.js'
    ],

    // list of files / patterns to exclude
    exclude: [
      // contains old-school DOM manipulation. not tested.
      'app/scripts/site.js'
    ],

    preprocessors: {
      'app/scripts/**/*.js': 'coverage',
      'app/pages/**/*.js': 'coverage'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress', 'coverage'],

    // web server port
    port: 9876,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
