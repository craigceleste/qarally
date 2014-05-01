'use strict';

angular.module('qa-rally').controller('RunTestCasesCtrl', ['$log', '$scope', '$location', '$timeout', '$sce', 'Settings', 'Wpi', 'Rally', function($log, $scope, $location, $timeout, $sce, Settings, Wpi, Rally) {
  $log.debug('Creating RunTestCasesCtrl');

  // TODO inject it
  var _ = window._;

  function updateScope() {
    $scope.wpiCurrentId = Wpi.getCurrentId();
    $scope.currentWpi = $scope.wpiList[$scope.wpiCurrentId];
    $scope.testSetDetails = undefined;
    $scope.preferences = Settings.get();

    if (!Wpi.wpiIsValid($scope.currentWpi)) {
      $scope.openManageWpiForm();
      return;
    }

    if ($scope.currentWpi) {
      if ($scope.currentWpi.testSetRef) {
        Rally.initTestSetDetails($scope.currentWpi.testSetRef).then(function(testSetDetails) {
          $scope.testSetDetails = testSetDetails;
          updateFilters();
        });
      }
    }
  }

  function updateFilters() {
    // We cache (to localStorage) the TestSetDetails as a semi immutable thing. If we find it's stale, we'll refetch the whole thing from Rally.
    // But while in memory, we'll layer on additional helper info, which is NOT persisted.

    // NOTE filtering is NOT done with Angular JS. It is MUCH MUCH faster to render all data to the DOM and then show/hide it (rather than add/remove elements from the DOM as you filter.)

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
    updateScope();
  };

  $scope.refreshTestSets = function() {
    if ($scope.currentWpi) {
      $scope.currentWpi.testSetRef = undefined;
      updateScope();
      Wpi.refreshTestSets($scope.currentWpi).then(function() {
        updateScope();
      });
    }
  };

  $scope.setCurrentTestSet = function(testSetRef) {
    if ($scope.currentWpi) {
      if (testSetRef !== $scope.currentWpi.testSetRef) {
        $scope.currentWpi.testSetRef = testSetRef;
        Wpi.clearFilter($scope.currentWpi); // TODO downstream cleaning shouldn't be done here.
        updateScope();
      }
    }
  };

  $scope.toggleTestFolderFilter = function(testFolderRef) {
    if ($scope.currentWpi && $scope.currentWpi.filter) {
      if ($scope.currentWpi.filter.testFolders[testFolderRef]) {
        delete $scope.currentWpi.filter.testFolders[testFolderRef];
        updateFilters();
      }
      else {
        $scope.currentWpi.filter.testFolders[testFolderRef] = true;
        updateFilters();
      }
    }
  };

  $scope.toggleAllTestFolderFilter = function(isFiltered) {
    if ($scope.currentWpi && $scope.currentWpi.filter && $scope.testSetDetails) {
      if (isFiltered) {
        $scope.currentWpi.filter.testFolders = _.reduce($scope.testSetDetails.testFolders , function(memo, tf) { memo[tf._ref] = true; return memo; }, {});
        $scope.currentWpi.filter.withoutTestFolder = true;
        updateFilters();
      } else {
        $scope.currentWpi.filter.testFolders = {}; // remove all filters
        $scope.currentWpi.filter.withoutTestFolder = false;
        updateFilters();
      }
    }
  };

  $scope.toggleFilterTestCasesWithoutTestFolder = function() {
    if ($scope.currentWpi && $scope.currentWpi.filter) {
      $scope.currentWpi.filter.withoutTestFolder = $scope.currentWpi.filter.withoutTestFolder ? false : true;
      updateFilters();
    }
  };

  $scope.toggleWorkProductFilter = function(workProductRef) {
    if ($scope.currentWpi && $scope.currentWpi.filter) {
      if ($scope.currentWpi.filter.workProducts[workProductRef]) {
        delete $scope.currentWpi.filter.workProducts[workProductRef];
        updateFilters();
      }
      else {
        $scope.currentWpi.filter.workProducts[workProductRef] = true;
        updateFilters();
      }
    }
  };

  $scope.toggleAllWorkProductFilter = function(isFiltered) {
    if ($scope.currentWpi && $scope.currentWpi.filter && $scope.testSetDetails) {
      if (isFiltered) {
        $scope.currentWpi.filter.workProducts = _.reduce($scope.testSetDetails.workProducts , function(memo, tf) { memo[tf._ref] = true; return memo; }, {});
        $scope.currentWpi.filter.withoutWorkProduct = true;
        updateFilters();
      } else {
        $scope.currentWpi.filter.workProducts = {}; // remove all filters
        $scope.currentWpi.filter.withoutWorkProduct = false;
        updateFilters();
      }
    }
  };

  $scope.toggleFilterTestCasesWithoutWorkProduct = function() {
    if ($scope.currentWpi && $scope.currentWpi.filter) {
      $scope.currentWpi.filter.withoutWorkProduct = $scope.currentWpi.filter.withoutWorkProduct ? false : true;
      updateFilters();
    }
  };

  $scope.clearFilters = function() {
    Wpi.clearFilter($scope.currentWpi);
    updateFilters();
  };

  $scope.sanitizeHtml = function(untrustedHtml) {
    // TODO sanitize it and return the result
    return $sce.trustAsHtml(untrustedHtml);
  };

  $scope.$watch('preferences',
    function() {
      Settings.set($scope.preferences);
    }, true); // deep watch

  $scope.$watch('wpiList',
    function () {
      Wpi.setList($scope.wpiList);
    }, true); // deep watch

  $scope.$watch('currentWpi.filter.nameContains', function() {
    updateFilters();
  });

  // Set up the state in the scope

  $scope.wpiList = Wpi.getList();
  updateScope();


}]);

