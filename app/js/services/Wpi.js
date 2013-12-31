
// WPI = named combination of {Workspace + Project + Iteration} for easier access to commonly used iterations.

app.factory('Wpi', ['$log', 'Store', 'Rally', function($log, Store, Rally) {
	"use strict";

	var service = {};

	service.defaultWpiLabel = 'My WPI';

	service.createWpi = function(list) {

		// TODO find a more reliable way to create a locally unique id.
		// Consider making the list contain metadata like an auto incrementing key seed.
		// For now I am not pretending it is robust
		var newId = Math.random().toString();

		var wpi = {
			label: service.defaultWpiLabel,
			id: newId,

			// redundant, but documents my expectation of future fields
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

		Store.put({
			key: 'wpiCurrentId',
			version: 1, // no upgrade path but required. it's just an int
			data: id
		});
	}

	service.getCurrentId = function() {
		// mainly guard on save. If it's in the store, trust it.
		return Store.get({
			key: 'wpiCurrentId',
			expectedVersion: 1, // no upgrade path. it's just an int.
			fetch: function() { return undefined; },
		});
	}

	// exposed for unit tests
	service.$currentListVersion = 2;

	service.setList = function(list) {
		Store.put({
			key: 'wpiList',
			version: service.$currentListVersion,
			data: list
		});
	}

	service.getList = function(ignoreStore) {

		return Store.get({

			// Normal get

			ignoreStore: ignoreStore,
			key: 'wpiList',
			fetch: function() { return {}; },

			// Upgrade path

			expectedVersion: service.$currentListVersion,
			upgrade: function(dataVersion, data) {

				// I want the upgrade path roughed out and unit tested,
				// so this code contains a fake version 1 and version 2 is the real first one.
				switch(dataVersion) {
					case 1:
					{
						data.test1 = '1 to 2';
						// no break. flow into case 2.
					}
					/*
					case 2:
					{
						// upgrade 2 to 3. etc
					}
					*/

					// break after last upgrade case
					break;

					default:
						// No upgrade path is a bug
						throw new Error('wpi.getList: unsupported upgrade path.');
				}
				return data;
			}
		});
	}

	service.refreshTestSets = function(wpi) {
		if (!wpi) return;
		wpi.testSets = undefined;
		wpi.testSetRef = undefined;
		if (wpi.iterationRef) {

			Rally.getTestSetList(wpi.workspaceRef, wpi.iterationRef).then(function(testSetData) {

				// Concurrency: if iterationRef changes before this is complete, just ignore this response.
				if (testSetData.iterationRef === wpi.iterationRef) {
					wpi.testSets = testSetData.testSets;
				}
			});
		}
	}

	return service;
}]);
