'use strict';

describe('Wpi', function() {

	var wpiSvc;
	var mockRally, mockWindow;

	beforeEach(function(){

		module('qa-rally')

		mockRally = {};
		mockWindow = {
			localStorage: {}
		};

		module(function($provide){
			$provide.value('Rally', mockRally);
			$provide.value('$window', mockWindow);
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

		wpiSvc.setCurrentId('a nice id');

		expect(mockWindow.localStorage.wpiCurrentId).toEqual(JSON.stringify('a nice id'));
	});

	it('.getCurrentIndex() gets the value from store.', function(){

		var value = 'the current id';
		mockWindow.localStorage.wpiCurrentId = JSON.stringify(value);

		var actual = wpiSvc.getCurrentId()

		expect(actual).toEqual(value);
	});

	// helper list used by tests below
	function getSampleList(){
		return	{
				  'frank': { id: 'frank', label: 'wpi1', workspaceRef: 'ws1', projectRef: 'p1', iterationRef: 'i1', buildNumber: 'ml.1' }
				, 'sally': { id: 'sally', label: 'wpi2', workspaceRef: 'ws2', projectRef: 'p2', iterationRef: 'i2', buildNumber: 'ml.2' }
				};
	}

	it('.setList() puts the value to cache.', function() {

		var list = getSampleList();
		
		wpiSvc.setList(list);

		expect(mockWindow.localStorage.wpiList).toEqual(JSON.stringify({
			version: wpiSvc.$currentListVersion,
			data: list
		}));
	});

	it('.getList() returns default value.', function() {

		var actual = wpiSvc.getList();
		expect(actual).toEqual({});
	});

	it('.getList() returns cached version.', function() {

		mockWindow.localStorage.wpiList = JSON.stringify({
			version: wpiSvc.$currentListVersion,
			data: getSampleList()
		});

		var actual = wpiSvc.getList();

		expect(actual).toEqual(getSampleList());
	});

	it('.getList() can ignore cached version.', function() {

		mockWindow.localStorage.wpiList = JSON.stringify({
			version: wpiSvc.$currentListVersion,
			data: getSampleList()
		});

		var actual = wpiSvc.getList(true);

		expect(actual).toEqual({});
	});

	it('.getList() handles an upgrade path.', function() {

		mockWindow.localStorage.wpiList = JSON.stringify({
			version: 1, // <-- old version
			data: getSampleList()
		});
		var upgraded = getSampleList();
		upgraded.test1 = '1 to 2';
		upgraded.test2 = '2 to 3';
		expect(wpiSvc.getList()).toEqual(upgraded);


		mockWindow.localStorage.wpiList = JSON.stringify({
			version: 2, // <-- old version
			data: getSampleList()
		});
		var upgraded = getSampleList();
		upgraded.test2 = '2 to 3';
		expect(wpiSvc.getList()).toEqual(upgraded);


		mockWindow.localStorage.wpiList = JSON.stringify({
			version: 555, // <-- bad version
			data: getSampleList()
		});
		expect(function() { wpiSvc.getList() }).toThrow();
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
