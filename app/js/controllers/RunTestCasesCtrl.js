
app.controller('RunTestCasesCtrl', ['$log', '$scope', '$location', '$timeout', 'Wpi', 'Rally', function($log, $scope, $location, $timeout, Wpi, Rally) {
	'use strict';
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

		$log.warn('TODO refresh test cases');
	}

	$scope.refreshTestSets = function() {
		Wpi.refreshTestSets($scope.currentWpi).then(function(){
			$log.warn('TODO refresh test cases');
		});
	}

	$scope.setCurrentTestSet = function(testSetRef) {
		$scope.currentWpi.testSetRef = testSetRef;
		$log.warn('TODO refresh test cases');
	}

	// Set up the state in the scope

	$scope.wpiList = Wpi.getList()
	$scope.wpiCurrentId = Wpi.getCurrentId();
	$scope.currentWpi = $scope.wpiList[$scope.wpiCurrentId];

	// If there isn't a focused/current wpi redirect to the manage

	if (!Wpi.wpiIsValid($scope.currentWpi)) {
		$scope.openManageWpiForm();
		return;
	}

	// We're mainly watching for changes to buildNumber, and later on selected testSetRef

	$scope.$watch('wpiList',
		function (newValue, oldValue) {
			Wpi.setList($scope.wpiList);
		}, true); // deep watch











	// ---------------
	// TODO the below code is experimenting/prototyping (moreso than the whole project)

	// Have the list of testFolders and workProducts in play for the set of TC's being tested.

	$scope.testFolders = {};
	$scope.workProducts = {};

	// --------------
	// Transform from Rally native format to Storage format.
	//		Problem: localStorage is very limited.
	//		As much as it would be nice, we can't store the entire TC in its native format.
	//			1. Eliminate properties we don't want to save.
	//			2. Flatten associated objects into 1 or more properties that we care about.
	//			3. Pseudo-minify the JSON: 2000 test cases * 200 characters of field labels each = 400000 = 5% of localStorage...
	//			4. reduce ref URI's to the relevant id (guid or int?) -- this goes against REST but will save a ton of space

	var tcKeys = {
		  _ref 							: 'a'
		, Description					: 'b'
		, FormattedID					: 'c'
		, Name 							: 'd'
		, Notes							: 'e'
		, ObjectId						: 'f'
		, Objective						: 'g'
		, PostConditions				: 'h'
		, PreConditions					: 'i'
		, TestFolderRef					: 'j'
		, TestFolderName				: 'k'
		, Type							: 'l'
		, ValidationExpectedResult		: 'm'
		, ValidationInput				: 'n'
		, WorkProductRef				: 'o'
		, WorkProductName				: 'p'
		// I'm sure I'm missing some. That's fine.
	};

	var testCasesFromStore = _.chain(window.fake_test_cases || [])
		.map(function(tc) {
			var newTc = {};
			newTc[tcKeys._ref] = tc._ref; // TODO may be reduced to just the id or eliminated and use tc.ObjectId
			newTc[tcKeys.Description] = tc.Description;
			newTc[tcKeys.FormattedID] = tc.FormattedID;
			newTc[tcKeys.Name] = tc.Name;
			newTc[tcKeys.Notes] = tc.Notes;
			newTc[tcKeys.ObjectId] = tc.ObjectId;
			newTc[tcKeys.Objective] = tc.Objective;
			newTc[tcKeys.PostConditions] = tc.PostConditions;
			newTc[tcKeys.PreConditions] = tc.PreConditions;
			newTc[tcKeys.TestFolderRef] = tc.TestFolder ? tc.TestFolder._ref : undefined;
			newTc[tcKeys.TestFolderName] = tc.TestFolder ? tc.TestFolder._refObjectName : undefined;		// TODO too much repetition
			newTc[tcKeys.Type] = tc.Type;
			newTc[tcKeys.ValidationExpectedResult] = tc.ValidationExpectedResult;
			newTc[tcKeys.ValidationInput] = tc.ValidationInput;
			newTc[tcKeys.WorkProductRef] = tc.WorkProduct ? tc.WorkProduct._ref : undefined;
			newTc[tcKeys.WorkProductName] = tc.WorkProduct ? tc.WorkProduct._refObjectName : undefined;		// TODO too much repetition
			return newTc;
		})
		.sortBy(function(tc) {
			// Pre-sort the list. We never sort on anything other than FormattedID.
			return parseInt(tc[tcKeys.FormattedID].substring(2));
		})
		.value()

	// delete or add shallow copies of the tcs to get more fake data for performance testing

	testCasesFromStore = _.reduce(testCasesFromStore, function(memo, tc, index){

		// skip original ones to reduce test data
		if (index % 3 == 0) memo.push(tc);

		// double the set a number of times to increase test data
		for (var i = 0; i < 0; i++) memo.push(angular.extend({}, tc));
		return memo;
	}, []);
	$log.debug('testCasesFromStore.length:', testCasesFromStore.length)

	// --------------
	// Transform Storage format into Working Format (in memory format)
	// 1. un-minify for more natural coding against it (properties we ditched are still gone, obviously)
	// 2. add helper pre-calculated values used for sorting, filtering, etc.

	$scope.allTestCases = _.map(testCasesFromStore, function(tc) {

		// unminify the stored version
		tc = _.reduce(tcKeys, function(memo, minifiedKey, unminifiedKey){ memo[unminifiedKey] = tc[minifiedKey]; return memo; }, {})

		// I'm not sure how I'll represent the verdicts and test results yet. For now have an _isHappy and _isSad
		if (Math.random() < 0.2) {
			tc._isSad = true;				// failed, blocked, etc. an aggregate of "bad" cases that need to be flagged red.
		} else if (Math.random() < 0.2) {
			tc._isHappy = true;				// passed or otherwise "good" end states.
		}

		// Produce a string containing all the text that can be searched.

		tc._searchContent = (tc.Name||'')  // ... looks like they only want Name. Possibly remove this and just go by name
			// + ' ' + (tc.Description||'')
			// + ' ' + (tc.Notes||'')
			.toUpperCase();

		// Produce the set of Test Folders and Work Products in play from the given TC's.

		if (!$scope.testFolders [tc.TestFolderRef ]) { $scope.testFolders [tc.TestFolderRef ] = { _ref: tc.TestFolderRef , name: tc.TestFolderName  }; }
		if (!$scope.workProducts[tc.WorkProductRef]) { $scope.workProducts[tc.WorkProductRef] = { _ref: tc.WorkProductRef, name: tc.WorkProductName }; }

		return tc;
	});

	// Fake some filters.
	// 		I am expecting that the WPI will get a testSets collection with a list of test set refs.
	//		These filters will probably be persisted there, associated with the test set.

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
























}]);

