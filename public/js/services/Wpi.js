'use strict';

// WPI = named combination of {Workspace + Project + Iteration} for easier access to commonly used iterations.

app.factory('Wpi', ['$log', '$q', '$window', 'Rally', function($log, $q, $window, Rally) {

	var service = {};

	service.defaultWpiLabel = 'My WPI';

	service.createWpi = function() {

		// I am intentionally being not-clever about generating a locally unique (or very high cardinality) id.
		var newId = Math.random().toString();

		var wpi = {
			label: service.defaultWpiLabel,
			id: newId,

			// redundant, but documents my expectation
			workspaceRef: undefined,
			projectRef: undefined,
			iterationRef: undefined,
			testSetRef: undefined,
			buildNumber: undefined
		};
		service.clearFilter(wpi);

		return wpi;
	}

	service.clearFilter = function(wpi) {
		if (wpi) {
			wpi.filter = {
				nameContains: '',
				withoutTestFolder: false,
				withoutWorkProduct: false,
				workProducts: {},
				testFolders: {}
			}
		}
	}

	service.wpiIsValid = function(wpi) {
		// Each required field is set.
		return wpi
			&& wpi.workspaceRef
			&& wpi.projectRef
			&& wpi.iterationRef
			&& wpi.label
			? true : false;
	};

	service.setCurrentId = function(id) {
		if (id) {
			$window.localStorage['wpiCurrentId'] = JSON.stringify(id);
		}
		else {
			delete $window.localStorage['wpiCurrentId'];
		}
	}

	service.getCurrentId = function() {

		var json = $window.localStorage['wpiCurrentId'];
		if (json) {
			return JSON.parse(json);
		}
		return undefined;
	}

	// exposed for unit tests
	service._currentListVersion = 3;

	service.setList = function(list) {

		// TODO consider validating list. Is it worth it?

		if (!list) {
			delete $window.localStorage['wpiList'];
		}
		else {
			$window.localStorage['wpiList'] = JSON.stringify({
				version: service._currentListVersion,
				data: list
			});
		}
	}

	service.getList = function() {

		var innerData;
		var resave;
		var outerDataJson = $window.localStorage['wpiList'];
		if (outerDataJson) {
			var outerData = JSON.parse(outerDataJson);
			var innerData = outerData.data;
			switch(outerData.version) {
				
				// IMPORTANT: wpiList contains user-entered data. We should make an effort not to blow it away after a software  update.
				// If the schema changes:
				// 1. increment service._currentListVersion
				// 2. Note that there is no break until we get to _currentListVersion.

				case 1:
				{
					innerData.test1 = '1 to 2';
					resave = true;
				}
				case 2:
				{
					innerData.test2 = '2 to 3';
					resave = true;
				}
				case service._currentListVersion:
				break;

				default:
					// fail noisilly. do not blow away their data.
					throw new Error('wpi.getList: unsupported upgrade path.');
			}
		}

		if (!innerData) {
			innerData = {};
			resave = true;
		}

		if (resave) {
			service.setList(innerData)
		}

		return innerData;
	}

	service.refreshTestSets = function(wpi) {
		if (wpi) {
			wpi.testSets = undefined;
			wpi.testSetRef = undefined;
			if (wpi.iterationRef) {
				return Rally.getTestSetList(wpi.workspaceRef, wpi.iterationRef).then(function(testSetData) {
					// Concurrency: if iterationRef changes before this is complete, just ignore this response.
					if (testSetData.iterationRef === wpi.iterationRef) {
						wpi.testSets = testSetData.testSets;
						var first = _.chain(wpi.testSets).sortBy(function(ts){ return (ts.name || '').toUpperCase()}).first().value();
						wpi.testSetRef = first ? first._ref : undefined;
					}
					return wpi;
				});
			}
		}
		return $q.when(wpi);
	}

	return service;
}]);
