'use strict';

angular.module('qa-rally', ['ngSanitize', 'ngRoute'])
  .config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {

    $httpProvider.interceptors.push('rally-error-handler');

// TODO consider using 'resolve' on routes to prepare data instead of an 'isLoading' state for the controller/template.

    $routeProvider
      .when('/', {
        templateUrl: 'pages/run-test-cases/view.html',
        controller: 'RunTestCasesCtrl'
      })
      .when('/manage-wpi', {
        templateUrl: 'pages/manage-wpi/view.html',
        controller: 'ManageWpiCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);

