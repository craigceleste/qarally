
// Manage WPI form

app.controller('ManageWpiCtrl', ['$log', '$scope', '$location', '$q', 'Wpi', 'Rally',  function($log, $scope, $location, $q, Wpi, Rally) {
	"use strict";
	$log.debug('Creating ManageWpiCtrl')

	$scope.refreshSubscriptionData = function(ignoreCache) {
		$scope.isLoading = true;
		Rally.initSubscriptionData(ignoreCache).then(function(subscriptionData) {
			$scope.isLoading = false;
			$scope.subscriptionData = subscriptionData;
		});
	}

	$scope.createWpi = function() {
		var wpi = Wpi.createWpi($scope.wpiList);
		$scope.setCurrentWpi(wpi.id);
	}

	$scope.setCurrentWpi = function(id)
	{
		Wpi.setCurrentId(id);

		$scope.wpiCurrentId = Wpi.getCurrentId();
		$scope.currentWpi = $scope.wpiList[$scope.wpiCurrentId];

		// I have a directive watching this property and whenever it changes, it will focus the control in the form. Seems over complicated just to focus a control.
		$scope.focusCurrentWpiHack = ($scope.focusCurrentWpiHack || 0) + 1;

// TODO		$scope.refreshTestSets($scope.currentWpi ? $scope.currentWpi.iterationRef : null);
	}

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

		var newCurrentId = _.reduce($scope.wpiList, function(memo, wpi, id, list) {

			var thisLabel = (wpi.label || '').toUpperCase();

			// If memo has no value (first iteration) this one is as good as any
			if (!memo.id) {
				memo.id = id;
				memo.label = thisLabel;
				return memo;
			}

			// If either memo or this one were before victim, take the greater of memo or victim
			if (memo.label < victimLabel || thisLabel < victimLabel) {
				if (thisLabel > memo.label) {
					memo.id = id;
					memo.label = thisLabel;
					return memo;
				}
				return memo; // no change. it is the best one so far
			}

			// Both this and memo are after victim. Take the lesser of them.
			if (thisLabel < memo.label) {
				memo.id = id;
				memo.label = thisLabel;
				return memo;
			}
			return memo; // no change. it is the best one so far

			// initial memo
		}, {id: undefined, label: undefined}).id;
		$scope.setCurrentWpi(newCurrentId);
	}

	$scope.currentWpiIsValid = function() {
		return Wpi.wpiIsValid($scope.currentWpi);
	};

	$scope.currentWpiHasDefaultLabel = function() {
		return $scope.currentWpi.label === Wpi.defaultWpiLabel
	}

	$scope.groupByProjectIterations = function(project) {
		var mostRecentStartDate;
		if (project && project.iterations) {
			_.each(project.iterations, function(iteration){
				var startDate = new Date(iteration.startDate);
				if (!mostRecentStartDate || mostRecentStartDate < startDate)
				{
					mostRecentStartDate = startDate;
				}
			})
		}

		// I am cheating on the group labels and making them alphabetical in the order I want them to appear :)

		if (!mostRecentStartDate) {
			return '...with no iterations';
		}

		// Arbitrary threshold
		var oldDateThreshold = new Date().setMonth(new Date().getMonth() - 4);
		if (mostRecentStartDate < oldDateThreshold) {
			return '...with dated iterations';
		}

		return 'Projects'
	}

	$scope.doneClick = function() {
		if ($scope.currentWpiIsValid()) {
			$location.url('/')
		}
	}

	// Expose wpiList to the $scope.
	// Make .currentWpi a shorthand to one of the objects in the list.

	$scope.wpiList = Wpi.getList();
	$scope.wpiCurrentId = Wpi.getCurrentId();
	$scope.currentWpi = $scope.wpiList[$scope.wpiCurrentId]; // may be undefined if none selected
	if ($scope.currentWpi) {
		$scope.focusCurrentWpiHack = ($scope.focusCurrentWpiHack || 0) + 1;
	}
	$scope.refreshSubscriptionData(false);

	// As the current WPI is edited, correct 'downstream' fields.

	$scope.$watch('currentWpi',
		function (newValue, oldValue) {

			// We're looking for changes to the currentWpi, from editing the form.
			// Ignore changes to currentWpi related to selection of current

			if (!newValue || !oldValue || newValue.id != oldValue.id) {
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
			}

			// If workspace changes, clear project

			if (newValue.workspaceRef != oldValue.workspaceRef) {
				$scope.currentWpi.projectRef = undefined;
			}

			// If project changes, clear iteration

			if (newValue.projectRef != oldValue.projectRef) {
				$scope.currentWpi.iterationRef = undefined;

				// Helper: default the label to match the project
				if (!newValue.label || newValue.label === Wpi.defaultWpiLabel) {
					var projectName = safeGetProjectName(newValue.workspaceRef, newValue.projectRef);
					if (projectName) {
						$scope.currentWpi.label = projectName;
					}
				}
			}

			// If iteration changes, clear test set and buildNumber

			if (newValue.iterationRef != oldValue.iterationRef) {
				$scope.currentWpi.testSetRef = undefined;
				$scope.currentWpi.buildNumber = undefined;

				// TODO begin loading/caching test sets for this iteration
			}

		}, true); // deep watch

	// TODO review the practice of $watch'ing non-trivial objects.
	//		Ideally I want to avoid having the View inform us that it made a change (onchange events, etc.)
	//		2-way model binding should take care of that for us.
	// 		On the other hand, I understand it's very bad, performance wise, to deep $watch objects.
	//		The question: is an array containing 5 or 10 objects, each containing 5 or so strings too big?
	//			10 x 5 == 50 strings x 100 bytes or so == about 5K every event? It might be, depending on how good the gc is.

	$scope.$watch('wpiList',
		function (newValue, oldValue) {

			// TODO review. this is getting called when the page loads and there is no change.
			// newValue and oldValue appear to be identical. Why?

			Wpi.setList($scope.wpiList);
		}, true); // deep watch

/*
TODO commented out code

	$scope.refreshTestSets = function(iterationRef) {

		// TODO review - proper use of $apply
		// 	When I use this function during initialization, the asynchronous stuff is seen by model binding.
		//	When I use it from a view (ng-click="refreshTests(...)") it is not.
		//	Research how and when to use $apply

		$scope.testSets = null;
		if (iterationRef)
		{
			Rally.initTestSetsForIteration(iterationRef)
			.then(function(testSets) {

				$scope.testSets = testSets;

				// refreshTestSets usually comes after setting the iteration or loading the page.
				// If they haven't chosen one from before, choosing one by default is better than leaving it null.
				if ($scope.currentWpi && !$scope.currentWpi.currentTestSetRef) {

					var defaultTestSetRef = _.chain(testSets)
						.sortBy(function(ts) { return ts.Name })
						.first()
						.value();

					$scope.currentWpi.currentTestSetRef = defaultTestSetRef ? defaultTestSetRef._ref : null;
				}
			});
		}
	}

	$scope.setCurrentTestSet = function(testSetRef) {
		$scope.currentWpi.currentTestSetRef = testSetRef;
	}

*/
}]);

