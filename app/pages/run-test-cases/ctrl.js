'use strict';

angular.module('QaRally')
  .controller('RunTestCases', ['$log', '$scope', '$location', '$timeout', '$sce', 'Settings', 'Wpi', 'Rally',
                       function($log,   $scope,   $location,   $timeout,   $sce,   Settings,   Wpi,   Rally) {
    $log.debug('Creating RunTestCases');

    // TODO inject it
    var _ = window._;

    // private functions are exposed for ease of unit testing

    var helpers = {

      updateScope: function() {
        $scope.wpiCurrentId = Wpi.getCurrentId();
        $scope.currentWpi = $scope.wpiList[$scope.wpiCurrentId];
        $scope.testSetDetails = undefined;
        $scope.preferences = Settings.get(); // TODO call it settings instead of preferences. partial refactor missed it.

        if (!Wpi.wpiIsValid($scope.currentWpi)) {
          $scope.openManageWpiForm();
          return;
        }

        if ($scope.currentWpi.testSetRef) {
          Rally.initTestSetDetails($scope.currentWpi.testSetRef).then(function(testSetDetails) {
            $scope.testSetDetails = testSetDetails;
            helpers.updateFilters();
          });
        }
      },

      updateFilters: function() {

        // We cache (to localStorage) the TestSetDetails as a semi immutable thing. If we find it's stale, we'll refetch the whole thing from Rally.
        // But while in memory, we'll layer on additional helper info, which is NOT persisted.

        // NOTE filtering is NOT done with Angular JS. It is MUCH MUCH faster to render all data to the DOM and then show/hide it (rather than add/remove elements from the DOM on the fly.)

        if ($scope.currentWpi && $scope.currentWpi.filter && $scope.testSetDetails) {

          angular.forEach($scope.testSetDetails.testCases, function(tc) {

            tc._isFiltered = (
                 (!tc.WorkProductRef && $scope.currentWpi.filter.withoutWorkProduct) ||
                 ( tc.WorkProductRef && $scope.currentWpi.filter.workProducts[tc.WorkProductRef]) ||
                 (!tc.TestFolderRef  && $scope.currentWpi.filter.withoutTestFolder) ||
                 ( tc.TestFolderRef  && $scope.currentWpi.filter.testFolders[tc.TestFolderRef]) ||
                 ($scope.currentWpi.filter.nameContains && (tc.Name || '').toUpperCase().indexOf($scope.currentWpi.filter.nameContains.toUpperCase()) < 0)
              ) ? true : false;
          });
        }
      }
    };

    this.helpers = helpers; // expose helpers to unit tests

    $scope.getLength = function(obj) {
      return Object.keys(obj || {}).length;
    };

    $scope.openManageWpiForm = function() {
      $location.url('/manage-wpi');
    };

    $scope.wpiIsValid = function(wpi) {
      return Wpi.wpiIsValid(wpi);
    };

    $scope.setCurrentWpi = function(id) {
      Wpi.setCurrentId(id);
      helpers.updateScope();
    };

    $scope.refreshTestSets = function() {
      $scope.currentWpi.testSetRef = undefined;
      helpers.updateScope();
      Wpi.refreshTestSets($scope.currentWpi).then(function() {
        helpers.updateScope();
      });
    };

    $scope.setCurrentTestSet = function(testSetRef) {
      if (testSetRef !== $scope.currentWpi.testSetRef) {
        $scope.currentWpi.testSetRef = testSetRef;
        Wpi.clearFilter($scope.currentWpi); // TODO downstream cleaning shouldn't be done here.
        helpers.updateScope();
      }
    };

    $scope.toggleTestFolderFilter = function(testFolderRef) {
      if ($scope.currentWpi.filter) {
        if ($scope.currentWpi.filter.testFolders[testFolderRef]) {
          delete $scope.currentWpi.filter.testFolders[testFolderRef];
          helpers.updateFilters();
        }
        else {
          $scope.currentWpi.filter.testFolders[testFolderRef] = true;
          helpers.updateFilters();
        }
      }
    };

    $scope.toggleAllTestFolderFilter = function(isFiltered) {
      if ($scope.currentWpi.filter && $scope.testSetDetails) {
        if (isFiltered) {
          $scope.currentWpi.filter.testFolders = _.reduce($scope.testSetDetails.testFolders , function(memo, tf) { memo[tf._ref] = true; return memo; }, {});
          $scope.currentWpi.filter.withoutTestFolder = true;
          helpers.updateFilters();
        } else {
          $scope.currentWpi.filter.testFolders = {}; // remove all filters
          $scope.currentWpi.filter.withoutTestFolder = false;
          helpers.updateFilters();
        }
      }
    };

    $scope.toggleFilterTestCasesWithoutTestFolder = function() {
      if ($scope.currentWpi.filter) {
        $scope.currentWpi.filter.withoutTestFolder = $scope.currentWpi.filter.withoutTestFolder ? false : true;
        helpers.updateFilters();
      }
    };

    $scope.toggleWorkProductFilter = function(workProductRef) {
      if ($scope.currentWpi.filter) {
        if ($scope.currentWpi.filter.workProducts[workProductRef]) {
          delete $scope.currentWpi.filter.workProducts[workProductRef];
          helpers.updateFilters();
        }
        else {
          $scope.currentWpi.filter.workProducts[workProductRef] = true;
          helpers.updateFilters();
        }
      }
    };

    $scope.toggleAllWorkProductFilter = function(isFiltered) {
      if ($scope.currentWpi.filter && $scope.testSetDetails) {
        if (isFiltered) {
          $scope.currentWpi.filter.workProducts = _.reduce($scope.testSetDetails.workProducts , function(memo, tf) { memo[tf._ref] = true; return memo; }, {});
          $scope.currentWpi.filter.withoutWorkProduct = true;
          helpers.updateFilters();
        } else {
          $scope.currentWpi.filter.workProducts = {}; // remove all filters
          $scope.currentWpi.filter.withoutWorkProduct = false;
          helpers.updateFilters();
        }
      }
    };

    $scope.toggleFilterTestCasesWithoutWorkProduct = function() {
      if ($scope.currentWpi.filter) {
        $scope.currentWpi.filter.withoutWorkProduct = $scope.currentWpi.filter.withoutWorkProduct ? false : true;
        helpers.updateFilters();
      }
    };

    $scope.clearFilters = function() {
      Wpi.clearFilter($scope.currentWpi);
      helpers.updateFilters();
    };

    $scope.sanitizeHtml = function(untrustedHtml) {
      // TODO sanitize it and return the result
      return $sce.trustAsHtml(untrustedHtml);
    };

    // Initialization code

    $scope.wpiList = Wpi.getList();
    helpers.updateScope();

    $scope.$watch('preferences', function() { Settings.set($scope.preferences); }, true);
    $scope.$watch('wpiList', function() { Wpi.setList($scope.wpiList); }, true);
    $scope.$watch('currentWpi.filter.nameContains', function() { helpers.updateFilters(); });

  }]);

