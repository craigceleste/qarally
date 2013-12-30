'use strict';

describe('Store', function() {

	var store;
	var mockWindow, $rootScope, $q;

	beforeEach(module('qa-rally'));

	beforeEach(module(function($provide){

		mockWindow = { localStorage: {} };

		$provide.value('$window', mockWindow);
	}));
 
	beforeEach(inject(function(_Store_, _$rootScope_, _$q_){
		$rootScope = _$rootScope_
		$q = _$q_;
		store = _Store_;
	}));

	it('can store and retrieve a non-promise object.', function() {

		// Try not to add knowledge of storage format into the test
		//		(don't inspect mock localStorage values)
		// If we put it in, and pull it out, and it's the same thing, that should be enough.

		var key = 'wpiList';
		var version = 5;
		var value;

		// Nothing in store yet.

		value = store.get({
			key:key,
			expectedVersion:version,
			fetch:function(){return 'from first fetch';}
		});

		expect(value).toEqual('from first fetch');

		// It should be in the store now.

		value = store.get({
			key:key,
			expectedVersion:version,
			fetch:function(){return 'from second fetch';}
		});

		expect(value).toEqual('from first fetch');

		// Put the value into the store

		store.$put({
			key:key,
			version:version,
			data: 'from put'
		});

		value = store.get({
			key:key,
			expectedVersion:version,
			fetch:function(){return 'from third fetch';}
		});

		expect(value).toEqual('from put');

		// Put undefined should clear it from store

		store.$put({
			key:key,
			version:version,
			data: undefined
		});

		value = store.get({
			key:key,
			expectedVersion:version,
			fetch:function(){return 'from fourth fetch';}
		});

		expect(value).toEqual('from fourth fetch');

		// Pretend the software version upgraded

		value = store.get({
			key:key,
			expectedVersion:version + 1,
			fetch:function(){return 'from fifth fetch';},
			upgrade:function(){return 'from first upgrade';}
		});

		expect(value).toEqual('from first upgrade');

		// The upgraded version should be in the store. It won't upgrade again.
		value = store.get({
			key:key,
			expectedVersion:version + 1,
			fetch:function(){return 'from sixth fetch';},
			upgrade:function(){return 'from second upgrade';}
		});

		expect(value).toEqual('from first upgrade');
	})

	it('can store and retrieve an object using a promise.', function() {
/*
	Testing a promise

	// create a deferred
	var deferred = $q.defer();
	alert(1)

	// Register a callback to it's .then
	deferred.promise.then(function(data) {
		alert(4)
		alert(data);
	});
	alert(2)

	// resolve the promise
	deferred.resolve('x');
	alert(3)

	// $q is tied into $rootScope. It's .$apply() will cause the promises to finish
	// I think they will finish eventually anyways, but on the nextTick.
	// This gets them to finish now.
	$rootScope.$apply(); // <-- alert(4) is called here
	alert(5)
*/
		var key = 'wpiList';
		var version = 5;
		var value;
		var deferred;

		// Nothing in store yet.

		deferred = $q.defer();
		store.get({
			key:key,
			expectedVersion:version,
			usePromise: true,
			fetch:function(){ return deferred.promise; }
		}).then(function(v){ value = v; });
		deferred.resolve('from fetch promise 1');
		$rootScope.$apply();
	
		expect(value).toEqual('from fetch promise 1');

		// It should be in the store now.

		deferred = $q.defer();
		store.get({
			key:key,
			expectedVersion:version,
			usePromise: true,
			fetch:function(){ return deferred.promise; }
		}).then(function(data){ value = data; });
		deferred.resolve('from fetch promise 2');
		$rootScope.$apply();
	
		expect(value).toEqual('from fetch promise 1');

		// Pretend the software version upgraded

		deferred = $q.defer();
		store.get({
			key:key,
			expectedVersion:version + 1, // <--
			usePromise: true,
			fetch:function(){ return deferred.promise; },
			upgrade:function(){return 'from upgrade 1';}
		}).then(function(data){ value = data; });
		deferred.resolve('from fetch promise 3');
		$rootScope.$apply();	

		expect(value).toEqual('from upgrade 1');

		// The upgraded version should be in the store. It won't upgrade again.

		deferred = $q.defer();
		store.get({
			key:key,
			expectedVersion:version + 1, // <--
			usePromise: true,
			fetch:function(){ return deferred.promise; },
			upgrade:function(){return 'from upgrade 2';}
		}).then(function(data){ value = data; });
		deferred.resolve('from fetch promise 4');
		$rootScope.$apply();	

		expect(value).toEqual('from upgrade 1');
	})

	// this should be a bunch of tests... cheat and just blast through bad-input cases in one test.
	it('get() returns undefined for bad inputs.', function() {

		// no options
		expect(store.get()).toBeUndefined();

		// empty options
		expect(store.get({})).toBeUndefined();

		// missing one of the 3 main required fields
		expect(store.get({
// 			key: <-- is absent
			expectedVersion:1,
			fetch:function(){}
		})).toBeUndefined();
		expect(store.get({
			key:'wpiList',
// 			expectedVersion: <-- is absent
			fetch:function(){}
		})).toBeUndefined();
		expect(store.get({
			key:'wpiList',
			expectedVersion:1,
//			fetch: <-- is absent
		})).toBeUndefined();

		// unrecognized section key
		expect(store.get({
			key:'is bad',
			expectedVersion:1,
			fetch:function(){}
		})).toBeUndefined();

		// subkey required for isDictionary sections
		expect(store.get({
			key:'testSetLists',  // <-- isDictionary key
//			subkey: 'is missing'
			expectedVersion:1,
			fetch:function(){}
		})).toBeUndefined();
	});

	it('get() guards against versionless data in store.', function() {

		var key = 'wpiList';
		var version = 5;

		// Legitimate old versions in storage should be protected.
		// Invalid data in storage is fair game to destroy.

		mockWindow.localStorage[key] = JSON.stringify({
			// absent --> 	v:version,
			d:'from store'
		});

		var actual = store.get({
			key:key,
			expectedVersion:version,
			fetch:function(){return 'from fetch';},
			upgrade:function(){return 'from upgrade';}
		});

		expect(actual).toEqual('from fetch');

		// store will get the new one
		expect(mockWindow.localStorage[key]).toContain('from fetch');
	});

	it('get() ignores invalid JSON.', function() {

		var key = 'wpiList';
		var version = 5;

		// Legitimate old versions in storage should be protected.
		// Invalid data in storage is fair game to destroy.

		mockWindow.localStorage[key] = '** not valid json **';

		var actual = store.get({
			key:key,
			expectedVersion:version,
			fetch:function(){return 'from fetch';},
			upgrade:function(){return 'from upgrade';}
		});

		expect(actual).toEqual('from fetch');

		// store will get the new one
		expect(mockWindow.localStorage[key]).toContain('from fetch');
	});

	it('get() protects isUserData that lacks upgrade.', function() {

		var key = 'wpiList';
		var version = 5;

		var json = JSON.stringify({
			v:version -1, // <-- old version
			d:'from store'
		});
		mockWindow.localStorage[key] = json;

		var actual = store.get({
			key:key,
			expectedVersion:version,
			fetch:function(){return 'from fetch';},
		//  upgrade: ...is absent
		});

		expect(actual).toBeUndefined();
		expect(mockWindow.localStorage[key]).toBe(json); // store is unmolested
	});

	// should be a bunch of tests... just blast through bad-input cases in one test.
	it('$put() ignores bad inputs.', function() {

		var key = 'wpiList';
		var version = 5;

		mockWindow.localStorage[key] = 'unmolested';

		// no options
		store.$put();
		expect(mockWindow.localStorage[key]).toBe('unmolested');

		// empty options
		store.$put({});
		expect(mockWindow.localStorage[key]).toBe('unmolested');

		// missing one of the required fields
		store.$put({
// 			key: key,  <-- is absent
			version:version,
		});
		expect(mockWindow.localStorage[key]).toBe('unmolested');

		store.$put({
 			key: key
//			version:version,    <-- is absent
		});
		expect(mockWindow.localStorage[key]).toBe('unmolested');

		// unrecognized section key
		store.$put({
			key:'is bad',
			version:version
		});
		expect(mockWindow.localStorage[key]).toBe('unmolested');

		// unrecognized section key
		store.$put({
			key:'testSetLists',  // <-- isDictionary key
//			subkey: 'is missing'
			version:version
		});
		expect(mockWindow.localStorage[key]).toBe('unmolested');

	});

});


