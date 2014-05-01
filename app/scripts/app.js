'use strict';

angular.module('qa-rally', ['ngSanitize', 'ngRoute'])
  .config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {

    $httpProvider.interceptors.push('rallyErrorHandler');

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

