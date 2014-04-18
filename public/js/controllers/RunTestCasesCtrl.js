'use strict';

app.controller('RunTestCasesCtrl', ['$log', '$scope', '$location', '$timeout', 'Wpi', 'Rally', function($log, $scope, $location, $timeout, Wpi, Rally) {
	$log.debug('Creating RunTestCasesCtrl')

	$scope.openManageWpiForm = function() {
		$location.url('/manage-wpi')
	}

	$scope.wpiIsValid = function(wpi) {
		return Wpi.wpiIsValid(wpi);
	}

	$scope.setCurrentWpi = function(id)
	{
		Wpi.setCurrentId(id);

		$scope.wpiCurrentId = Wpi.getCurrentId();
		$scope.currentWpi = $scope.wpiList[$scope.wpiCurrentId];

		$scope.testSetDetails = undefined;
		Rally.initTestSetDetails($scope.currentWpi.testSetRef).then(function(testSetDetails) {
			$scope.testSetDetails = testSetDetails;
		});
	}

	$scope.refreshTestSets = function() {
		$scope.testSetDetails = undefined;
		Wpi.refreshTestSets($scope.currentWpi).then(function(){
			Rally.initTestSetDetails($scope.currentWpi.testSetRef).then(function(testSetDetails) {
				$scope.testSetDetails = testSetDetails;
			});
		});
	}

	$scope.setCurrentTestSet = function(testSetRef) {
		$scope.currentWpi.testSetRef = testSetRef;
		$scope.testSetDetails = undefined;
		Rally.initTestSetDetails($scope.currentWpi.testSetRef).then(function(testSetDetails) {
			$scope.testSetDetails = testSetDetails;
		});
	}

	// Set up the state in the scope

	// TODO combine similar code to this initialization and setCurrentWpi
	$scope.wpiList = Wpi.getList()
	$scope.wpiCurrentId = Wpi.getCurrentId();
	$scope.currentWpi = $scope.wpiList[$scope.wpiCurrentId];
	$scope.testSetDetails = undefined;

	// If there isn't a focused/current wpi redirect to the manage

	if (!Wpi.wpiIsValid($scope.currentWpi)) {
		$scope.openManageWpiForm();
		return;
	}

	Rally.initTestSetDetails($scope.currentWpi.testSetRef).then(function(testSetDetails) {
		$scope.testSetDetails = testSetDetails;
	});

	// We're mainly watching for changes to buildNumber and selected testSetRef

	$scope.$watch('wpiList',
		function (newValue, oldValue) {
			Wpi.setList($scope.wpiList);
		}, true); // deep watch









/*

	// ---------------

	$scope.testFolderFilters  = {};
	$scope.workProductFilters = {};
	$scope.filterTestCasesWithoutTestFolder = false;
	$scope.filterTestCasesWithoutWorkProduct = false;

	// Filter dropdown handlers
	//		TODO review performance concept
	//		The original attempt had an angular filter on the ng-repeat to eliminate, but that caused DOM elements to be added/removed as we filter, which proved to be poor performance for > 1000 items
	//		This approach has no ng filtering or sorting.
	//		Items in the array are pre-sorted.
	//		We will add properties to the in-memory TC's, and toggle display:none for filtering.
	//		It looks like more code, becasue we need to iterate the TC's on each filter change. But this seems MUCH faster than iterating and removing/adding DOM elements.

	$scope.toggleTestFolderFilter = function(tf) {
		if ($scope.testFolderFilters[tf._ref]){
			delete $scope.testFolderFilters[tf._ref]
			_.each($scope.allTestCases, function(tc) { if (tc.TestFolderRef == tf._ref) { tc._isTestFolderFiltered = undefined; }});
		} else {
			$scope.testFolderFilters[tf._ref] = true;
			_.each($scope.allTestCases, function(tc) { if (tc.TestFolderRef == tf._ref) { tc._isTestFolderFiltered = true; }});
		}
	}

	$scope.toggleAllTestFolderFilter = function(applyFilter) {
		if (applyFilter) {
			$scope.testFolderFilters = _.reduce($scope.testFolders , function(memo, tf) { memo[tf._ref] = true; return memo; }, {});
			$scope.filterTestCasesWithoutTestFolder = true;
			_.each($scope.allTestCases, function(tc) { tc._isTestFolderFiltered = true; });
		} else {
			$scope.testFolderFilters = {}; // remove all filters
			$scope.filterTestCasesWithoutTestFolder = false;
			_.each($scope.allTestCases, function(tc) { tc._isTestFolderFiltered = undefined; });
		}
	}

	$scope.toggleFilterTestCasesWithoutTestFolder = function() {
		$scope.filterTestCasesWithoutTestFolder = $scope.filterTestCasesWithoutTestFolder ? false : true;
		_.each($scope.allTestCases, function(tc) { if (!tc.TestFolderRef) { tc._isTestFolderFiltered = $scope.filterTestCasesWithoutTestFolder; }});
	}

	$scope.toggleWorkProductFilter = function(wp) {
		if ($scope.workProductFilters[wp._ref]){
			delete $scope.workProductFilters[wp._ref]
			_.each($scope.allTestCases, function(tc) { if (tc.WorkProductRef == wp._ref) { tc._isWorkProductFiltered = undefined; }});
		} else {
			$scope.workProductFilters[wp._ref] = true;
			_.each($scope.allTestCases, function(tc) { if (tc.WorkProductRef == wp._ref) { tc._isWorkProductFiltered = true; }});
		}
	}

	$scope.toggleAllWorkProductFilter = function(applyFilter) {
		if (applyFilter) {
			$scope.workProductFilters = _.reduce($scope.workProducts , function(memo, wp) { memo[wp._ref] = true; return memo; }, {});
			$scope.filterTestCasesWithoutWorkProduct = true;
			_.each($scope.allTestCases, function(tc) { tc._isWorkProductFiltered = true; });
		} else {
			$scope.workProductFilters = {}; // remove all filters
			$scope.filterTestCasesWithoutWorkProduct = false;
			_.each($scope.allTestCases, function(tc) { tc._isWorkProductFiltered = undefined; });
		}
	}

	$scope.toggleFilterTestCasesWithoutWorkProduct = function() {
		$scope.filterTestCasesWithoutWorkProduct = $scope.filterTestCasesWithoutWorkProduct ? false : true;
		_.each($scope.allTestCases, function(tc) { if (!tc.WorkProductRef) { tc._isWorkProductFiltered = $scope.filterTestCasesWithoutWorkProduct; }});
	}

	// The search predecate (NOT USED AT PRESENT)

	$scope.search = '';
	$scope.searchFilterPredicate = function(tc) {
		
		// Eliminate based on association filters

		if ( ($scope.filterTestCasesWithoutTestFolder  && !tc.TestFolderRef)  || (tc.TestFolderRef  && $scope.testFolderFilters [tc.TestFolderRef ])) return false;
		if ( ($scope.filterTestCasesWithoutWorkProduct && !tc.WorkProductRef) || (tc.WorkProductRef && $scope.workProductFilters[tc.WorkProductRef])) return false;

		if ($scope.search && tc._searchContent.indexOf($scope.search.toUpperCase()) === -1) return false;

		return true;
	}

	// Simulate polling for periodic updates.

	function simulateUpdates() {
		// Optimistic? :) Every few seconds, a number of tests are passed or failed.
		for (var i = 0; i < 20; i++) {

			var tc = $scope.allTestCases[Math.min($scope.allTestCases.length-1, Math.floor(Math.random() * $scope.allTestCases.length))];
			if (!tc) return;
			
			if(Math.random() < 0.7) {
				tc._isHappy = true;
			} else {
				tc.isSad = true;
			}
		}
		$timeout(simulateUpdates, 5000);
	}
	$timeout(simulateUpdates, 3000);

*/

}]);

