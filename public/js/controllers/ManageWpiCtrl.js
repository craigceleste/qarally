
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

	$scope.getTestSetCount = function() {
		if (!$scope.currentWpi) return 0;
		return Object.keys($scope.currentWpi.testSets).length;
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
			// Ignore changes to which wpi is current.

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

			var projectReset;
			var iterationReset;

			// If workspace changes, clear project

			if (newValue.workspaceRef != oldValue.workspaceRef) {
				$scope.currentWpi.projectRef = undefined;
				projectReset = true;
			}

			// If project changes, clear iteration

			if (projectReset || newValue.projectRef != oldValue.projectRef) {
				$scope.currentWpi.iterationRef = undefined;
				iterationReset = true;

				// Helper: default the label to match the project
				if (!newValue.label || newValue.label === Wpi.defaultWpiLabel) {
					var projectName = safeGetProjectName(newValue.workspaceRef, newValue.projectRef);
					if (projectName) {
						$scope.currentWpi.label = projectName;
					}
				}
			}

			// If iteration changes, clear test set and buildNumber

			if (iterationReset || newValue.iterationRef != oldValue.iterationRef) {
				$scope.currentWpi.buildNumber = undefined;

				Wpi.refreshTestSets($scope.currentWpi);
			}

		}, true); // deep watch

	$scope.$watch('wpiList',
		function (newValue, oldValue) {

			$scope.wpiBytes = angular.toJson(newValue).length; // it's not accurate, but close enough (keys and encoding contribute too)

			// For some reason this is sometimes called when there are no chagnes (at page load at least). Ignore these cases.
			if (angular.toJson(newValue) === angular.toJson(oldValue)) return;

			Wpi.setList($scope.wpiList);
		}, true); // deep watch

}]);
