
// Persistent Local Storage

//	- meant to house some re-usable logic related to storage validation and versioning.

app.factory('Store', ['$log', '$window', '$q', function($log, $window, $q) {
'use strict';

	var service = {};

	var maxStorage = 5 * 1024 * 1024; // 5 MB

	// TODO inject it. how? should it be a service itself?

	var sectionList = {

		// I am debating between 
		//		a) each consumer passes the rules for how they want their data stored in an options argument.
		//				PROS: probably simpler service; easier to centralize the storage limit and use a "the rest" clause
		//				CONS: probably more error prone consumers; people who will maintain this app will do so with ad hoc hacks. It is an internal app that nobody cares about (ideal as a semi throw-away vessel for getting some AngularJS exposure. :)
		//		b) this way: a structure describing how storage is allocated.

		// isUserData
		//		true means this data was entered by the user and should be guarded from casual deletion
		//		false means this data is cached in local storage but may be retrieved from somewhere else.
		//		use this to inform how we should approach deleting data from the store.

		// isDictionary
		//		false means it is a single object stored under the key.
		//		true means there is a subkey and we store a dictionary of items as "<key>_<subkey>"

		// limit
		//		window.localStorage is expected to have 5 MB of storage. Browsers don't publish (to JavaScript) how much space is available, but all major browsers follow W3C recommendation for 5MB.
		//		The sum of the limits should be less than 5 MB. All items with a limit of null will share "the rest" of the 5MB, divided evenly.
		//		this is soft upper limit for each item. It is the point at which we become noisy about it being a problem. The hard limit is when we run out of space.
		//		Note that the key names count towards storage.

		'subscriptionData': { isUserData: false, isDictionary: false, limit:  256 * 1024 }, // 5%
		'wpiCurrentId':     { isUserData: true,  isDictionary: false, limit:         100 },
		'wpiList':          { isUserData: true , isDictionary: false, limit:  256 * 1024 }, // 5%

		'wpiStats':         { isUserData: true,  isDictionary: false, limit:         100 },
		'testSetLists':     { isUserData: false, isDictionary: true,  limit:  500 * 1024 }, // 10%
		'testCases':        { isUserData: false, isDictionary: true,  limit:        null }  // the rest
	};

	// Initialize: fill and validate the sectionList

	(function () {

		var sectionStats = _.reduce(sectionList, function(memo, section) {

//			Console.assert(typeof section.isUserData === 'boolean', 'Store: misconfig isUserData.');
//			Console.assert(typeof section.isDictionary === 'boolean', 'Store: misconfig isDictionary.');

			if (section.limit === null) {
				memo.remainderSections.push(section);

			} else {
//				Console.assert(typeof section.limit === 'number' && section.limit > 0, 'Store service: misconfig limit.');
				memo.sumLimit += section.limit;
			}
			return memo;
		}, {sumLimit:0, remainderSections: []})

//		Console.assert(sectionStats.sumLimit <= maxStorage, 'Store: misconfig. the sum of limit must be less than 5 MB.');

		_.each(sectionStats.remainderSections, function(item) {
			item.limit = Math.max(0, Math.floor( (maxStorage - sectionStats.sumLimit) / sectionStats.remainderSections.length ));
		});

	}());

	// Store format in window.localStorage

	var versionKey = 'v';
	var dataKey = 'd';
	var itemsKey = 'i';

	// For NON-isDictionary sections
	//
	//		window.localStorage[key] = {
	//			v: 1,
	//			d: data
	// 		};

	// For isDictionary sections
	//
	//		window.localStorage[key] = {
	//			v: 1,
	//			i: {'subkey1': 12345678,'subkey2', 23456789 } // last accessed date as milliseconds since epoch (someDate.getTime())
	//		};
	//		window.localStorage[key+'_'+subkey] = {
	//			v: 1,
	//			d: data
	//		};


	// Note. This 'get' really does the following:
	//		- get from store if its there
	//		- otherwise get from a callback and put it in the store for later
	//		- handle upgrading old/stale data in the store via a different callback
	//		- handle cases where the store should be cleaned if the new value is legitimately null/undefined
	// If we feel 'get' doesn't describe this behavior, I would prefer changing the name to the behavior rather than the behavior to the name.

	service.get = function(options) {

		options = _.extend({
			// key must match one of the keys in the sectionList.
			// subkey is required for isDictionary items.
			key: null,
			subkey: null,

			// A callback function to get the item if its not in the store.
			// The value returned from here will be put into the store.
			fetch: null,

			// localStorage persists across software updates, so data versioning is required and handled here.
			// upgrade is expected to be a simple transform. The upgraded version replaces the old version in the store.
			// upgrade(fromVersion, data)
			// Return undefined or null to discard the stored version and call fetch.
			expectedVersion: null,
			upgrade: null,

			// If fetch() will return a promise, then set this to true so that the stored version is also returned in a promise.
			usePromise: false,

			// Use this to ignore the store and go directly to fetch.
			// Non-purist, I guess. It allows me to avoid re-implementing the force-get on each of the consumers.
			ignoreStore: false
		}, options);

		// I want to be a little over-zealous with the validation on this one

		if (!options.key || !options.expectedVersion || !options.fetch) {
			throw new Error('Store: missing required field.');
		}

		var section = sectionList[options.key];
		if (!section) {
			throw new Error('Store: unrecognized key.');
		}

		if (section.isDictionary && !options.subkey) {
			throw new Error('Store: missing required field.');
		}

if (section.isDictionary) {
// TODO isDictionary not implemented yet.
	return undefined;
}
		// Attempt to find it in the store

		var innerData;
		if (!options.ignoreStore) {

			var outerDataJson = $window.localStorage[options.key];
			if (outerDataJson) {

				// If JSON in the store doesn't parse, then someone has gone and hacked it themselves I think. Or its a bug.
				// Don't worry about preserving it. Fall into the fetch/replace code below.

				var outerData;
				try {
					outerData = JSON.parse(outerDataJson);
				} catch(err) {

					$log.debug('Store [' + options.key + ']: failed to parse json.'); // not an assert/error. Carry as though its not there.
				}

				// Not in store. Fall through to fetch.

				if (!outerData) {

				// All good. Fall through with data.

				} else if (outerData[versionKey] === options.expectedVersion) {
					innerData = outerData[dataKey];

				// If there is no version on the stored data, this is a bug.
				// Don't worry about preserving it and fall out below into the fetch.

				} else if (!outerData[versionKey]) {
					$log.debug('Store [' + options.key + ']: bad data in store will be ignored.');

				// If its an old version of data (the software has updated) then attempt to upgrade it.
				// Upgrade is expected to be a simple inline transform (no promise, round trip, etc.)
				// This may be too naive. If a new version tracks new fields about an entity, they may need to go to the server.
				// For now I expect if that's the case, they can use upgrade() to remember the old version, return undefined, we'll call fetch, they can do what they need.
				// This is more for user entered data where we're changing the schema a bit and don't want to lose their old data.

				} else if (typeof options.upgrade === 'function') {

					innerData = options.upgrade(outerData[versionKey], outerData[dataKey]);
					service.put({
						key: options.key,
						version: options.expectedVersion,
						data: innerData
					});

				// Version is bad and there is no upgrade path.
				// .isUserData means we are not allowed to stomp the data arbitrarilly.
				// If they don't care about upgrading it, then: a) don't set it as isUserData, or b) make an upgrade that returns undefined (explicitly ignore old version)

				} else if (section.isUserData) {

					$log.debug('Store [' + options.key + ']: out of date user data needs an upgrade function (even if it returns null or undefined to delete the old one).');
					return undefined;
				}
			}
		}

		// It was not in the store (or the Stored value was rejected)

		if (typeof innerData === 'undefined') {

			innerData = options.fetch();

			// If fetch returns a promise, then join the promise chain.

			if (innerData && typeof innerData.then === 'function') {

				if (!options.usePromise) throw new Error('fetch() should match the expectation of .usePromise.');

				return innerData.then(function(realInnerData) {
					service.put({
						key: options.key,
						version: options.expectedVersion,
						data: realInnerData
					});
					return realInnerData;
				});
			}

			// Not a promise

			if (options.usePromise) throw new Error('fetch() should match the expectation of .usePromise.');

			service.put({
				key: options.key,
				version: options.expectedVersion,
				data: innerData
			});
		}

		// If we have the item from store, or from non deferred fetch, or upgrade, return it in a pre-resolved promise

		if (options.usePromise){
			return $q.when(innerData);
		}
		return innerData;
	};

	service.put = function(options) {

		options = _.extend({
			key: null,					// required: expect to be a string
			subkey: null,				// required if sectionList[key].isDictionary is true
			version: null,				// required. we version the stored items since localStorage persists across software updates
			data: null					// required. UNCONVENTIONAL --> putting null or undefined will silently remove it from store. It prevents us always branching this way or that when we get a value that we want to store. Might be a bad idea. Also prohibits caching null/undefined (which is legitimate, I guess). We'll see how it goes.
		}, options);

		if (!options.key || !options.version) {
			$log.error('Store: missing required field.');
			return;
		}

		var section = sectionList[options.key];
		if (!section) {
			$log.error('Store: unrecognized key.');
			return;
		}

		if (section.isDictionary && !options.subkey) {
			$log.error('Store: missing required field.');
			return;
		}

if (section.isDictionary) {
// TODO isDictionary not implemented yet.
	return undefined;
}

		if (typeof options.data === 'undefined' || options.data === null) {

			// TODO review. this works on a mock, but I think I need .removeItem for window.localStorage
			delete $window.localStorage[options.key];
			return;
		}

		var outerData = {};
		outerData[versionKey] = options.version;
		outerData[dataKey] = options.data;
		var outerDataJson = angular.toJson(outerData);

		// the key and the data count to space used
		var actualSize = options.key.length + outerDataJson.length;
		$log.debug('Store [' + options.key + '] size: ' + Math.ceil(actualSize / 1024) + ' KB (' + Math.ceil(actualSize / maxStorage * 100)  + ' % of localStorage)');

		// I am using a naive fixed size silo for now.
		// If any one section grows beyond what I expect, the app will continue to work, but some assertions may start failing which is a hint to review it.
		// The app will hit the hard limit if the total storage is exceeded, at which point browser exceptions will cause it to stop working.
		// I may get more aggressive about the limit constraints eventually. But not yet.

		if (actualSize > section.limit) {
			$log.warn('Store [' + options.key + '] exceeded the expected upper range of size. This may compromize other parts of the application.');
		}

		$window.localStorage[options.key] = outerDataJson;
	};

	return service;
}]);
