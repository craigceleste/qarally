'use strict';

angular
  .module('qa-rally', [
    'ngSanitize',
    'ngRoute'
  ])
  .config(function ($routeProvider) {

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
  });

