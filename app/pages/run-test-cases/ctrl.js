'use strict';

angular.module('QaRally')
  .controller('RunTestCases', ['$log', '$window', '$scope', '$location', '$timeout', '$sce', 'Settings', 'Wpi', 'Rally',
                       function($log,   $window,   $scope,   $location,   $timeout,   $sce,   Settings,   Wpi,   Rally) {
    $log.debug('Creating RunTestCases');

    // TODO inject it
    var _ = window._;

    // TODO better organization of routes in the site
    var manageWpiUrl = '/manage-wpi';

    // Private helper functions

    var privateHelpers = this.helpers = { }; // expose some of the private helper methods to unit tests as a mini mockable service.

    privateHelpers.updateFilters = function() {

      // We cache (to localStorage) the TestSetDetails as an immutable thing.
      // If we find it's stale, we'll refetch the whole thing from Rally.

      // But while in memory, we'll layer on additional helper info, which IS NOT persisted.

      // ALSO NOTE filtering is NOT done with Angular JS.
      // It is MUCH MUCH faster to render all data to the DOM and then show/hide it, rather than add/remove elements from the DOM on the fly.

      $scope.filterColor = undefined;
      $scope.filteredCount = 0;

      if (!$scope.currentWpi || !$scope.currentWpi.filter || !$scope.testSetDetails) {
        return;
      }

      angular.forEach($scope.testSetDetails.testCases, function(tc) {

        tc._isFiltered = (
             (!tc.WorkProductRef && $scope.currentWpi.filter.withoutWorkProduct) ||
             ( tc.WorkProductRef && $scope.currentWpi.filter.workProducts[tc.WorkProductRef]) ||
             (!tc.TestFolderRef  && $scope.currentWpi.filter.withoutTestFolder) ||
             ( tc.TestFolderRef  && $scope.currentWpi.filter.testFolders[tc.TestFolderRef]) ||
             ($scope.currentWpi.filter.nameContains && (tc.Name || '').toUpperCase().indexOf($scope.currentWpi.filter.nameContains.toUpperCase()) < 0)
          ) ? true : false;

        $scope.filteredCount += tc._isFiltered ? 1 : 0;
      });

      if (!$scope.currentWpi.filter.withoutWorkProduct &&
          !$scope.currentWpi.filter.withoutTestFolder &&
          !Object.keys($scope.currentWpi.filter.workProducts).length &&
          !Object.keys($scope.currentWpi.filter.testFolders).length &&
          !$scope.currentWpi.filter.nameContains) {
        $scope.filterColor = undefined; // not filtering
      }
      else if ($scope.testSetDetails.testCases.length > 0 && $scope.filteredCount === $scope.testSetDetails.testCases.length) {
        $scope.filterColor = 'red'; // all items are filtered out
      }
      else
      {
        $scope.filterColor = 'green'; // is filtering
      }

    };

    var refreshTestSetDetailsConcurrencyCounter = 0;
    privateHelpers.refreshTestSetDetails = function() {

      // Stop adding if something changed while we were working.
      var concurrencyCheck = ++refreshTestSetDetailsConcurrencyCounter;

      $scope.testSetDetails = undefined;
      if ($scope.currentWpi.testSetRef) {
        Rally.initTestSetDetails($scope.currentWpi.testSetRef).then(function(testSetDetails) {
          
          // it takes a significant amount of time for angular to render a large collection.
          // Adding them to the scope 1 at a time in sequential $timeout's takes longer, but feels much shorter.

          var testCases = testSetDetails.testCases;
          testSetDetails.testCases = [];
          $scope.testSetDetails = testSetDetails;
          
          function addOneTestCase() {
            if (concurrencyCheck === refreshTestSetDetailsConcurrencyCounter) {
              $scope.testSetDetails.testCases.push(testCases.shift());
              privateHelpers.updateFilters(); // it's overkill but it's quick
            }
          }

          for (var i = 0; i < testCases.length; ++i) {
            $timeout(addOneTestCase);
          }

          privateHelpers.updateFilters();
        });
      }
    };

    
    // Initialization

    $scope.build = $window.qarallyBuildNumber ? 'build ' + $window.qarallyBuildNumber : 'unbuilt'; // the build process will append this at the end of the main bundle.

    $scope.wpiList = Wpi.getList();
    $scope.wpiCurrentId = Wpi.getCurrentId();
    $scope.currentWpi = $scope.wpiList[$scope.wpiCurrentId];

    if (!Wpi.wpiIsValid($scope.currentWpi)) {
      $location.url(manageWpiUrl);
      return;
    }

    $scope.settings = Settings.get();

    privateHelpers.refreshTestSetDetails();

    $scope.$watch('settings',                       function() { Settings.set($scope.settings); }, true);
    $scope.$watch('wpiList',                        function() { Wpi.setList($scope.wpiList); }, true);
    $scope.$watch('currentWpi.filter.nameContains', function() { privateHelpers.updateFilters(); });

    // Define $scope helper functions

    $scope.getLength = function(obj) {
      if( Object.prototype.toString.call(obj) === '[object Array]') {
        return obj.length;
      }
      return Object.keys(obj || {}).length;
    };

    $scope.openManageWpiForm = function() {
      $location.url(manageWpiUrl);
    };

    $scope.wpiIsValid = function(wpi) {

      // TODO review
      // I have shared code between different controllers, such as this function.
      // The solution I made was to put it in a service (wpiService) and have passthroughs here. Is this expected?
      // If there were many pages, we'd have a lot of dumb passthroughs.

      // Maybe construct wpiService as a controller (takes $scope, manages state on $scope, etc)
      // inject it here and at the start angular.extend(this, baseController) or something.
      // that sounded worse at the time, but all the passthroughs don't look scallable.

      return Wpi.wpiIsValid(wpi);
    };

    $scope.setCurrentWpi = function(id) {
      Wpi.setCurrentId(id);
      $scope.wpiCurrentId = Wpi.getCurrentId(id);
      $scope.currentWpi = $scope.wpiList[$scope.wpiCurrentId];
      privateHelpers.refreshTestSetDetails();
    };

    $scope.refreshTestSets = function() {
      $scope.testSetDetails = undefined;
      Wpi.refreshTestSets($scope.currentWpi).then(function() {
        privateHelpers.refreshTestSetDetails();
      });
    };

    $scope.setCurrentTestSet = function(testSetRef) {
      if (testSetRef !== $scope.currentWpi.testSetRef) {
        $scope.currentWpi.testSetRef = testSetRef;
        Wpi.clearFilter($scope.currentWpi);
        privateHelpers.refreshTestSetDetails();
      }
    };

    $scope.toggleTestFolderFilter = function(testFolderRef) {
      if ($scope.currentWpi.filter) {
        if ($scope.currentWpi.filter.testFolders[testFolderRef]) {
          delete $scope.currentWpi.filter.testFolders[testFolderRef];
          privateHelpers.updateFilters();
        }
        else {
          $scope.currentWpi.filter.testFolders[testFolderRef] = true;
          privateHelpers.updateFilters();
        }
      }
    };

    $scope.toggleWorkProductFilter = function(workProductRef) {
      if ($scope.currentWpi.filter) {
        if ($scope.currentWpi.filter.workProducts[workProductRef]) {
          delete $scope.currentWpi.filter.workProducts[workProductRef];
          privateHelpers.updateFilters();
        }
        else {
          $scope.currentWpi.filter.workProducts[workProductRef] = true;
          privateHelpers.updateFilters();
        }
      }
    };

    $scope.toggleFilterTestCasesWithoutTestFolder = function() {
      if ($scope.currentWpi.filter) {
        $scope.currentWpi.filter.withoutTestFolder = $scope.currentWpi.filter.withoutTestFolder ? false : true;
        privateHelpers.updateFilters();
      }
    };

    $scope.toggleFilterTestCasesWithoutWorkProduct = function() {
      if ($scope.currentWpi.filter) {
        $scope.currentWpi.filter.withoutWorkProduct = $scope.currentWpi.filter.withoutWorkProduct ? false : true;
        privateHelpers.updateFilters();
      }
    };

    $scope.toggleAllTestFolderFilters = function(isFiltered) {
      if ($scope.currentWpi.filter && $scope.testSetDetails) {
        if (isFiltered) {
          $scope.currentWpi.filter.testFolders = _.reduce($scope.testSetDetails.testFolders , function(memo, tf) { memo[tf._ref] = true; return memo; }, {});
          $scope.currentWpi.filter.withoutTestFolder = true;
          privateHelpers.updateFilters();
        } else {
          $scope.currentWpi.filter.testFolders = {}; // remove all filters
          $scope.currentWpi.filter.withoutTestFolder = false;
          privateHelpers.updateFilters();
        }
      }
    };

    $scope.toggleAllWorkProductFilters = function(isFiltered) {
      if ($scope.currentWpi.filter && $scope.testSetDetails) {
        if (isFiltered) {
          $scope.currentWpi.filter.workProducts = _.reduce($scope.testSetDetails.workProducts , function(memo, tf) { memo[tf._ref] = true; return memo; }, {});
          $scope.currentWpi.filter.withoutWorkProduct = true;
          privateHelpers.updateFilters();
        } else {
          $scope.currentWpi.filter.workProducts = {}; // remove all filters
          $scope.currentWpi.filter.withoutWorkProduct = false;
          privateHelpers.updateFilters();
        }
      }
    };

    $scope.clearFilters = function() {
      Wpi.clearFilter($scope.currentWpi);
      privateHelpers.updateFilters();
    };

  }]);

