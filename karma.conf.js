// Karma configuration
// Generated on Fri Nov 29 2013 16:44:21 GMT-0500 (Eastern Standard Time)

module.exports = function(config) {
	config.set({

		// base path, that will be used to resolve files and exclude
		basePath: '',


		// frameworks to use
		frameworks: ['jasmine'],


		// list of files / patterns to load in the browser
		files: [
			// third party libraries
			'public/lib/underscore/underscore-min.js',
			'public/lib/jquery/jquery.min.js',
			'public/lib/bootstrap/bootstrap.min.js',
			'public/lib/angular/angular.min.js',
			'public/lib/angular/angular-route.min.js',

			// code under test
			'public/js/**/*.js',

			// testing tools
			'test/lib/angular/angular-mocks.js',
			'test/mocks/**/*.js',

			// tests
			'test/**/*Spec.js'
		],


		// list of files to exclude
		exclude: [
		],

		preprocessors: {
			'**/public/js/**/*.js': 'coverage'
		},

		// test results reporter to use
		// possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
		reporters: ['progress', 'coverage'],


		// web server port
		port: 9876,


		// enable / disable colors in the output (reporters and logs)
		colors: true,


		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,


		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,


		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera (has to be installed with `npm install karma-opera-launcher`)
		// - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
		// - PhantomJS
		// - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
		browsers: [
			  'Chrome'
//			, 'Firefox'
//			, 'IE'
		],


		// If browser does not capture in given timeout [ms], kill it
		captureTimeout: 60000,


		// Continuous Integration mode
		// if true, it capture browsers, run tests and exit
		singleRun: false
	});
};
