'use strict';

// Manage WPI form

angular.module('qa-rally').controller('ManageWpiCtrl', ['$log', '$scope', '$location', '$q', 'Wpi', 'Rally',  function($log, $scope, $location, $q, Wpi, Rally) {
  $log.debug('Creating ManageWpiCtrl');

  // TODO inject it
  var _ = window._;

  $scope.refreshSubscriptionData = function(ignoreCache) {
    $scope.isLoading = true;
    Rally.initSubscriptionData(ignoreCache).then(function(subscriptionData) {
      $scope.isLoading = false;
      $scope.subscriptionData = subscriptionData;
    });
  };

  $scope.getWpiCount = function() {
    return Object.keys($scope.wpiList).length;
  };

  $scope.createWpi = function() {
    var wpi = Wpi.createWpi();
    $scope.wpiList[wpi.id] = wpi;
    $scope.setCurrentWpi(wpi.id);
  };

  $scope.setCurrentWpi = function(id)
  {
    Wpi.setCurrentId(id);

    $scope.wpiCurrentId = Wpi.getCurrentId();
    $scope.currentWpi = $scope.wpiList[$scope.wpiCurrentId];

    // I have a directive watching this property.
    // Whenever it changes, it will focus the control in the form. Seems over complicated just to focus a control.
    $scope.focusCurrentWpiHack = ($scope.focusCurrentWpiHack || 0) + 1;
  };

  $scope.removeCurrentWpi = function() {
    var victimId = $scope.wpiCurrentId;
    var victim = $scope.wpiList[victimId];
    var victimLabel = victim ? (victim.label || '').toUpperCase() : '';

    // First remove the victim if it exists

    if (victim) {
      delete $scope.wpiList[victimId];
    }

    // Second, choose a new wpiCurrentId.
    // Take this opportunity to clean bad references: if the currentId existed, but didn't point to an item, clear currentId and set it to a new value.
    // It should be the one immediately after the victim alphabetically by label, or the last one in the list if there wasn't one.
    // Gah! I suck at algorithms. This could be way better.

    var newCurrentId = _.reduce($scope.wpiList, function(bestYet, wpi, id) {

      var thisLabel = (wpi.label || '').toUpperCase();

      // If bestYet has no value (first iteration) this one is as good as any
      if (!bestYet.id) {
        bestYet.id = id;
        bestYet.label = thisLabel;
        return bestYet;
      }

      // If either bestYet or this one were before victim, take the greater of bestYet or victim
      if (bestYet.label < victimLabel || thisLabel < victimLabel) {
        if (thisLabel > bestYet.label) {
          bestYet.id = id;
          bestYet.label = thisLabel;
          return bestYet;
        }
        return bestYet; // no change. it is the best one so far
      }

      // Both this and bestYet are after victim. Take the lesser of them.
      if (thisLabel < bestYet.label) {
        bestYet.id = id;
        bestYet.label = thisLabel;
        return bestYet;
      }
      return bestYet; // no change. it is the best one so far

      // initial bestYet
    }, {id: undefined, label: undefined}).id;
    $scope.setCurrentWpi(newCurrentId);
  };

  $scope.currentWpiIsValid = function() {
    return Wpi.wpiIsValid($scope.currentWpi);
  };

  $scope.currentWpiHasDefaultLabel = function() {
    return $scope.currentWpi && $scope.currentWpi.label === Wpi.defaultWpiLabel ? true : false;
  };

  $scope.orderByProjectIterations = function(project) {

    // Group projects into 3 buckets:
    //    0. those with recent iterations (presumably active projects)
    //    1. those with old iterations (presumably inactive)
    //    2. those with no iterations at all

    var mostRecentStartDate;
    if (project && project.iterations) {
      angular.forEach(project.iterations, function(iteration){
        var startDate = new Date(iteration.startDate);
        if (!mostRecentStartDate || mostRecentStartDate < startDate)
        {
          mostRecentStartDate = startDate;
        }
      });
    }

    if (!mostRecentStartDate) {
      return 2;
    }

    // Arbitrary threshold
    var oldDateThreshold = new Date().setMonth(new Date().getMonth() - 4);
    if (mostRecentStartDate < oldDateThreshold) {
      return 1;
    }

    return 0;
  };

  $scope.groupByProjectIterations = function(project) {
    switch($scope.orderByProjectIterations(project)) {
      case 0:
        {
          return 'Projects';
        }
      case 1:
        {
          return '...with dated iterations';
        }
      default:
        {
          return '...with no iterations';
        }
    }
  };

  $scope.getTestSetCount = function() {
    if (!$scope.currentWpi)
    {
      return 0;
    }
    return Object.keys($scope.currentWpi.testSets).length;
  };

  $scope.doneClick = function() {
    if ($scope.currentWpiIsValid()) {
      $location.url('/');
    }
  };

  // Expose wpiList to the $scope.
  // Make .currentWpi a shorthand to one of the objects in the list.

  $scope.wpiList = Wpi.getList();
  $scope.wpiCurrentId = Wpi.getCurrentId();
  $scope.currentWpi = $scope.wpiList[$scope.wpiCurrentId]; // may be undefined if none selected
  if ($scope.currentWpi) {
    $scope.focusCurrentWpiHack = ($scope.focusCurrentWpiHack || 0) + 1;
  }
  $scope.refreshSubscriptionData();

  // As the current WPI is edited, correct 'downstream' fields.

  $scope.$watch('currentWpi',
    function (newValue, oldValue) {

      // We're looking for changes to the currentWpi, from editing the form.
      // Ignore changes to which wpi is current.

      if (!newValue || !oldValue || newValue.id !== oldValue.id) {
        return;
      }

      function safeGetProjectName(workspaceRef, projectRef) {
        // if objects are defined, expect their schema is correct.
        if ($scope.subscriptionData) {

          var workspace = $scope.subscriptionData.workspaces[workspaceRef];
          if (workspace) {
            var project = workspace.projects[projectRef];
            if (project) {
              return project.name;
            }
          }
        }
        return undefined;
      }

      var projectReset;
      var iterationReset;

      // If workspace changes, clear project

      if (newValue.workspaceRef !== oldValue.workspaceRef) {
        $scope.currentWpi.projectRef = undefined;
        projectReset = true;
      }

      // If project changes, clear iteration

      if (projectReset || newValue.projectRef !== oldValue.projectRef) {
        $scope.currentWpi.iterationRef = undefined;
        iterationReset = true;

        // UX helper: actively try to default the label so everyone doesn't have "New WPI" or so as their WPI label
        if (!newValue.label || newValue.label === Wpi.defaultWpiLabel) {
          var projectName = safeGetProjectName(newValue.workspaceRef, newValue.projectRef);
          if (projectName) {
            $scope.currentWpi.label = projectName;
          }
        }
      }

      // If iteration changes, clear test set and buildNumber

      if (iterationReset || newValue.iterationRef !== oldValue.iterationRef) {
        $scope.currentWpi.buildNumber = undefined;

        // TODO: continue defaulting WPI .label
        // If it is "FA Web", call it "FA Web 90" where 90 is the trailing number of iteration name (in the format "Sprint 90"). If it is off convention, leave the .label unchanged

        Wpi.refreshTestSets($scope.currentWpi).then(function(wpi){
          Rally.initTestSetDetails(wpi.testSetRef);
        });

        Wpi.clearFilter();
      }

    }, true); // deep watch

  // Watch the WPI List and save changes as they are made.
  // Arguably this is expensive, but mitigated by the fact that the WPI list is not too huge.

  $scope.$watch('wpiList',
    function (newValue, oldValue) {

      // An alert will show up in the UI if they use too much of local storage for WPI's
      $scope.wpiBytes = angular.toJson(newValue).length;

      // Ignore false positive calls to this watch (happens on page load)
      if (angular.toJson(newValue) === angular.toJson(oldValue))
      {
        return;
      }

      Wpi.setList($scope.wpiList);
    }, true); // deep watch

}]);

