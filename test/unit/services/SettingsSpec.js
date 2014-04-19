'use strict';

describe('The Settings service', function() {

	var settingsSvc; // object under test

	var mockWindow; // DI's

	beforeEach(function(){

		module('qa-rally')

		mockWindow = { localStorage: {} };

		module(function($provide){
			$provide.value('$window', mockWindow);
		});

		inject(function(Settings){
			settingsSvc = Settings;
		});

	});

	it('will set/get/delete a simple JavaScript object to localStorage.', function(){

		expect(settingsSvc).toBeDefined()

		// Set an object

		var expected = {mySetting:"setting"};
		settingsSvc.set(expected);

		// Get to compare it

		var actual = settingsSvc.get();
		expect(JSON.stringify(actual)).toBe(JSON.stringify(expected)); // cheap way to deep compare

		// Set undefined

		settingsSvc.set(undefined);

		// Get to compare it

		var actual = settingsSvc.get();
		expect(JSON.stringify(actual)).toBe(JSON.stringify({})); // get will return empty object if not present

	});

});
