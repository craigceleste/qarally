'use strict';

// WPI = named combination of {Workspace + Project + Iteration} for easier access to commonly used iterations.

app.factory('Wpi', ['$log', '$q', '$window', 'Rally', function($log, $q, $window, Rally) {

	var service = {};

	service.defaultWpiLabel = 'My WPI';

	service.createWpi = function(list) {

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
			buildNumber: undefined,
		};

		list[newId] = wpi;
		return wpi;
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
	service.$currentListVersion = 3;

	service.setList = function(list) {

		// TODO consider validating list. Is it worth it?

		$window.localStorage['wpiList'] = JSON.stringify({
			version: service.$currentListVersion,
			data: list
		});
	}

	service.getList = function(ignoreCache) {

		var innerData;
		var resave;
		if (!ignoreCache) {
			var outerDataJson = $window.localStorage['wpiList'];
			if (outerDataJson) {
				var outerData = JSON.parse(outerDataJson);
				var innerData = outerData.data;
				switch(outerData.version) {
					
					// Upgrade code: if wpiList schema changes
					// 1. increment service.$currentListVersion
					// 2. provide an upgrade case here (note there are no breaks between upgrades. each flows into the next. break at the end.)

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
					case service.$currentListVersion:
					{
					}
					break;

					default:
						throw new Error('wpi.getList: unsupported upgrade path.');
				}
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
