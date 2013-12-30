'use strict';

describe('Wpi', function() {

	var wpiSvc;
	var mockRally, mockStore;

	beforeEach(function(){

		module('qa-rally')

		mockRally = {};
		mockStore = {};

		module(function($provide){
			$provide.value('Rally', mockRally);
			$provide.value('Store', mockStore);
		});

		inject(function(_Wpi_){
			wpiSvc = _Wpi_;
		})
	});

	it('.defaultWpiLabel contains a non-blank string.', function() {
		expect(typeof wpiSvc.defaultWpiLabel).toEqual('string'); // specifying what it is makes the test fragile.
		expect(wpiSvc.defaultWpiLabel.length).toBeGreaterThan(0);
	});

	it('.createWpi() returns a simple, blank wpi.', function() {

		var list = {};

		var wpi = wpiSvc.createWpi(list);

		// It was added to the list and returned.

		expect(wpi.id.length).toBeGreaterThan(0);
		expect(wpi).toBe(list[wpi.id]);


		expect(wpi.label).toEqual(wpiSvc.defaultWpiLabel);
		expect(wpi.workspaceRef).toBeUndefined();
		expect(wpi.projectRef).toBeUndefined();
		expect(wpi.iterationRef).toBeUndefined();
		expect(wpi.buildNumber).toBeUndefined();
		expect(wpi.currentTestSetRef).toBeUndefined();
	});

	it('.setCurrentIndex() saves value to store.', function(){

		mockStore.$put = function() {};
		spyOn(mockStore, '$put');

		wpiSvc.setCurrentId('a nice id');

		expect(mockStore.$put).toHaveBeenCalledWith({
			key: 'wpiCurrentId',
			version: 1,
			data: 'a nice id'
		});
	});

	it('.getCurrentIndex() gets the value from store.', function(){

		mockStore.get = function(options) {
			expect(options.key).toEqual('wpiCurrentId');
			expect(options.fetch()).toBeUndefined(); // whether the Store needs to call it or not

			return 'the current id';
		};

		var actual = wpiSvc.getCurrentId()

		expect(actual).toEqual('the current id');
	});

	// helper list used by tests below
	function getSampleList(){
		return	{
				  'frank': { id: 'frank', label: 'wpi1', workspaceRef: 'ws1', projectRef: 'p1', iterationRef: 'i1', buildNumber: 'ml.1' }
				, 'sally': { id: 'sally', label: 'wpi2', workspaceRef: 'ws2', projectRef: 'p2', iterationRef: 'i2', buildNumber: 'ml.2' }
				};
	}

	it('.setList() puts the value to store.', function() {

		mockStore.$put = function() {};
		spyOn(mockStore, '$put');
		var list = getSampleList();
		
		wpiSvc.setList(list);

		expect(mockStore.$put).toHaveBeenCalledWith({
			key: 'wpiList',
			version: wpiSvc.$currentListVersion,
			data: list
		})
	});

	it('.getList() gets from store.', function() {

		var list = getSampleList();
		mockStore.get = function(options) {
			expect(options.key).toEqual('wpiList');
			expect(options.expectedVersion).toEqual(wpiSvc.$currentListVersion);
			expect(options.fetch()).toEqual({}); // whether we call it or not

			return list;
		};

		var actual = wpiSvc.getList();

		expect(actual).toEqual(list);
	});

	it('.getList() handles an upgrade path.', function() {

		// They will call store.get...
		mockStore.get = function(options) {

			// If the store has data from an earlier schema version,
			// it will call their upgrade and return it.
			return options.upgrade(
				1,					// stored version
				{original:'bob'}	// stored data
			);
		};

		var actual = wpiSvc.getList();

		// And their upgrade path transformed the original in the right way.
		expect(actual).toEqual({original:'bob',test1:'1 to 2'});
	});

	it('.getList() throws on unrecognized stored version.', function() {

		// expect them to call our get
		var getWasCalled;
		mockStore.get = function(options) {
			getWasCalled = true;

			// expect them to pass an upgrade function.
			// If we pass in an unrecognized version, they should throw.
			expect(function() {
				options.upgrade( -10, 'bob');
			}).toThrow();
		};

		wpiSvc.getList();
		expect(getWasCalled).toEqual(true);
	});

	it('.wpiIsValid() returns true if each required field is set.', function() {

		expect(wpiSvc.wpiIsValid({
			  workspaceRef: 'something'
			, projectRef: 'something'
			, iterationRef: 'something'
			, label: 'something'
		})).toEqual(true);

		expect(wpiSvc.wpiIsValid(undefined)).toEqual(false);

		expect(wpiSvc.wpiIsValid({
			  workspaceRef: undefined
			, projectRef: 'something'
			, iterationRef: 'something'
			, label: 'something'
		})).toEqual(false);

		expect(wpiSvc.wpiIsValid({
			  workspaceRef: 'something'
			, projectRef: undefined
			, iterationRef: 'something'
			, label: 'something'
		})).toEqual(false);

		expect(wpiSvc.wpiIsValid({
			  workspaceRef: 'something'
			, projectRef: 'something'
			, iterationRef: undefined
			, label: 'something'
		})).toEqual(false);

		expect(wpiSvc.wpiIsValid({
			  workspaceRef: 'something'
			, projectRef: 'something'
			, iterationRef: 'something'
			, label: undefined
		})).toEqual(false);

	});
});
