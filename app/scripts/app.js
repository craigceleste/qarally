'use strict';

angular.module('QaRally', ['ngSanitize', 'ngRoute'])
  .config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {

    $httpProvider.interceptors.push('RallyErrorHandler');

    $routeProvider
      .when('/', {
        templateUrl: 'pages/run-test-cases/view.html',
        controller: 'RunTestCases'
      })
      .when('/manage-wpi', {
        templateUrl: 'pages/manage-wpi/view.html',
        controller: 'ManageWpi'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);

