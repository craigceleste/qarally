'use strict';

var app = angular.module('qa-rally', ['ngRoute','ngSanitize']);

// TODO review moving routes to another file.
// TODO consider using 'resolve' on routes to prepare data instead of an 'isLoading' state for the controller/template.

app.config(['$routeProvider', function($routeProvider){
	$routeProvider
		.when('/', {
			templateUrl: 'templates/RunTestCases.html',
			controller: 'RunTestCasesCtrl'
		})
		.when('/manage-wpi', {
			templateUrl: 'templates/ManageWpi.html',
			controller: 'ManageWpiCtrl'
		})
		.otherwise({
			redirectTo: '/'
		})
}]);

