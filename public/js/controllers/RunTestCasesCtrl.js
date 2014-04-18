'use strict';

app.controller('RunTestCasesCtrl', ['$log', '$scope', '$location', '$timeout', 'Wpi', 'Rally', function($log, $scope, $location, $timeout, Wpi, Rally) {
	$log.debug('Creating RunTestCasesCtrl')

	function updateScope() {
		$scope.wpiCurrentId = Wpi.getCurrentId();
		$scope.currentWpi = $scope.wpiList[$scope.wpiCurrentId];
		$scope.testSetDetails = undefined;

		if (!Wpi.wpiIsValid($scope.currentWpi)) {
			$scope.openManageWpiForm();
			return;
		}

		if ($scope.currentWpi) {
			if ($scope.currentWpi.testSetRef) {
				Rally.initTestSetDetails($scope.currentWpi.testSetRef).then(function(testSetDetails) {
					$scope.testSetDetails = testSetDetails
				});
			}
		}
	}

	$scope.openManageWpiForm = function() {
		$location.url('/manage-wpi')
	}

	$scope.wpiIsValid = function(wpi) {
		return Wpi.wpiIsValid(wpi);
	}

	$scope.setCurrentWpi = function(id)
	{
		Wpi.setCurrentId(id);
		updateScope();
	}

	$scope.refreshTestSets = function() {
		if ($scope.currentWpi) {
			$scope.currentWpi.testSetRef = undefined;
			updateScope();
			Wpi.refreshTestSets($scope.currentWpi).then(function(wpi) {
				updateScope();
			});
		}
	}

	$scope.setCurrentTestSet = function(testSetRef) {
		if ($scope.currentWpi) {
			if (testSetRef !== $scope.currentWpi.testSetRef) {
				$scope.currentWpi.testSetRef = testSetRef;
				Wpi.clearFilter($scope.currentWpi); // TODO downstream cleaning shouldn't be done here.
				updateScope();
			}
		}
	}

	// We're watching for changes to buildNumber, selected testSetRef, filter settings.
	// TODO These don't change overly often, and it's expensive to check on each digest.
	// Consider a better approach. 

	$scope.$watch('wpiList',
		function (newValue, oldValue) {
			Wpi.setList($scope.wpiList);
		}, true); // deep watch

	// Set up the state in the scope

	$scope.wpiList = Wpi.getList()
	updateScope();

	// IMPORTANT: Filtering and Sorting
	// 		1. (sorting) We pre-sort the TC's by FormattedID, into an array in the TestSetDetails structure. It is NOT done by Angular on the fly (which is slow).
	// 		2. (filtering) We render ALL TC's into the DOM. Then toggle CSS classes to show/hide them. This is MUCH MUCH faster than deleting and creating DOM elements on the fly as we filter.

	$scope.toggleTestFolderFilter = function(testFolderRef) {
		if ($scope.currentWpi && $scope.currentWpi.filter) {
			if ($scope.currentWpi.filter.testFolders[testFolderRef]) {
				delete $scope.currentWpi.filter.testFolders[testFolderRef];
				// TODO update TC's
			}
			else {
				$scope.currentWpi.filter.testFolders[testFolderRef] = true;
				// TODO update TC's
			}
		}
	}

	$scope.toggleAllTestFolderFilter = function(isFiltered) {
		if ($scope.currentWpi && $scope.currentWpi.filter && $scope.testSetDetails) {
			if (isFiltered) {
				$scope.currentWpi.filter.testFolders = _.reduce($scope.testSetDetails.testFolders , function(memo, tf) { memo[tf._ref] = true; return memo; }, {});
				$scope.currentWpi.filter.withoutTestFolder = true;
				// TODO update TC's
			} else {
				$scope.currentWpi.filter.testFolders = {}; // remove all filters
				$scope.currentWpi.filter.withoutTestFolder = false;
				// TODO update TC's
			}
		}
	}

	$scope.toggleFilterTestCasesWithoutTestFolder = function() {
		if ($scope.currentWpi && $scope.currentWpi.filter) {
			$scope.currentWpi.filter.withoutTestFolder = $scope.currentWpi.filter.withoutTestFolder ? false : true;
			// TODO update TC's
		}
	}

	$scope.toggleWorkProductFilter = function(workProductRef) {
		if ($scope.currentWpi && $scope.currentWpi.filter) {
			if ($scope.currentWpi.filter.workProducts[workProductRef]) {
				delete $scope.currentWpi.filter.workProducts[workProductRef];
				// TODO update TC's
			}
			else {
				$scope.currentWpi.filter.workProducts[workProductRef] = true;
				// TODO update TC's
			}
		}
	}

	$scope.toggleAllWorkProductFilter = function(isFiltered) {
		if ($scope.currentWpi && $scope.currentWpi.filter && $scope.testSetDetails) {
			if (isFiltered) {
				$scope.currentWpi.filter.workProducts = _.reduce($scope.testSetDetails.workProducts , function(memo, tf) { memo[tf._ref] = true; return memo; }, {});
				$scope.currentWpi.filter.withoutWorkProduct = true;
				// TODO update TC's
			} else {
				$scope.currentWpi.filter.workProducts = {}; // remove all filters
				$scope.currentWpi.filter.withoutWorkProduct = false;
				// TODO update TC's
			}
		}
	}

	$scope.toggleFilterTestCasesWithoutWorkProduct = function() {
		if ($scope.currentWpi && $scope.currentWpi.filter) {
			$scope.currentWpi.filter.withoutWorkProduct = $scope.currentWpi.filter.withoutWorkProduct ? false : true;
			// TODO update TC's
		}
	}

}]);

