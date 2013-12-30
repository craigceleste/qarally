'use strict';

describe('RunTestCasesCtrl', function() {

	var $rootScope, $scope, $location, $q, mockConsole, mockWpi, mockRally;
	var ctrl;

	beforeEach(module('qa-rally'));

	// Mock Console Service

	beforeEach(module(function($provide) {
		mockConsole =  { log: function() {}, assert: function() {} };
		$provide.value('Console', mockConsole);
	}));

	// Mock Wpi Service -- TODO ** I'm repeating this too much **

	beforeEach(module(function($provide) {
		mockWpi = {

			// fake data for baseline.
			// Tests may change it as needed.

			list: {
				  'frank': { id: 'frank', label: 'wpi0', workspaceRef: 'ws0', projectRef: 'p0', iterationRef: 'i0', buildNumber: 'm0.0' }
				, 'sally': { id: 'sally', label: 'wpi1', workspaceRef: 'ws1', projectRef: 'p1', iterationRef: 'i1', buildNumber: 'ml.1' }
			},
			currentId: 'sally',

			// mock api

			getList: function() { return this.list; },
			getCurrentId: function() { return this.currentId; },
			setCurrentId: function() {},
			setList: function() {},
			defaultWpiLabel: 'Banana Pancake',
			wpiIsValid: function() { return true; }
		};
		$provide.value('Wpi', mockWpi);
	}));

	beforeEach(inject(function(_$q_, _$location_, _$rootScope_) {
		$q = _$q_;
		$location = _$location_;
		$rootScope = _$rootScope_;

		$location.path('/');
		$rootScope.$apply();
		expect($location.path()).toEqual('/');
	}));

	// These tests will create the ctrl themselves,
	// so they can adjust DI's before creation

	describe('initialization', function() {

		var $controller;

		beforeEach(inject(function(_$controller_){
			$controller = _$controller_;
		}));

		it('adds WPI info to scope.', function() {

			// Default happy path mocks from above
			$scope = $rootScope.$new();
			ctrl = $controller('RunTestCasesCtrl', { $scope: $scope });

			// Puts WPI info into the scope
			expect($scope.wpiList).toBe(mockWpi.list);
			expect($scope.wpiCurrentId).toBe(mockWpi.currentId);
			expect($scope.currentWpi).toBeDefined()
			expect($scope.currentWpi).toBe(mockWpi.list[mockWpi.currentId]);

			// Does not navigate away in protest
			expect($location.path()).toBe('/');
		});

		it('refuses entry if there is no current wpi.', function() {

			// Bad or undefined current wpi
			spyOn(mockWpi, 'wpiIsValid').andReturn(false);

			// And initialize with that
			$scope = $rootScope.$new();
			ctrl = $controller('RunTestCasesCtrl', { $scope: $scope });

			// It should guard that current wpi is valid, and navigate away if it isn't
			expect(mockWpi.wpiIsValid).toHaveBeenCalledWith($scope.currentWpi);
			expect($location.path()).toBe('/manage-wpi');
		});

	})
	
	// The rest of the tests can use the happy path initialization

	beforeEach(inject(function($controller){
		$scope = $rootScope.$new();
		ctrl = $controller('RunTestCasesCtrl', { $scope: $scope });
	}));

	it ('.currentWpiIsValid() returns true if any of the required wpi fields are blank.', function() {

		spyOn(mockWpi, 'wpiIsValid').andReturn('freddie');
		var fakeWpi = {fake:'wpi'};

		var actual = $scope.wpiIsValid(fakeWpi);

		// It passes a given wpi into the Wpi service...
		expect(mockWpi.wpiIsValid).toHaveBeenCalledWith(fakeWpi);

		// ...and dumb pass-through, returns whatever it gives us.
		expect(actual).toBe('freddie');
	});

	it ('.setCurrentWpi() sets the current one if it is valid', function() {

		expect($scope.wpiCurrentId).toBe('sally');
		expect($scope.currentWpi.id).toBe('sally');

		spyOn(mockWpi, 'setCurrentId');
		spyOn(mockWpi, 'getCurrentId').andReturn('frank');

		$scope.setCurrentWpi('something else');

		// It will attempt to set the id given to it
		expect(mockWpi.setCurrentId).toHaveBeenCalledWith('something else');

		// But it will allow/trust the service to transform it if needed.
		expect($scope.wpiCurrentId).toBe('frank');
		expect($scope.currentWpi.id).toBe('frank');
	});

	it ('will set up a $watch to save model changes as they happen.', function() {

		spyOn(mockWpi, 'setList');

		$scope.wpiList['sally'].extra = 'stuff';
		$scope.$apply();

		expect(mockWpi.setList).toHaveBeenCalledWith($scope.wpiList);
	});

});
