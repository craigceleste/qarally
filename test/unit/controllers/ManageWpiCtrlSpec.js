'use strict';

describe('The ManageWpiCtrl', function() {

	var manageWpiCtrl; // unit under test

	// DI's
	var $httpBackend, $q, $location, $rootScope, $scope, mockWindow, rallySvc, wpiSvc;

	beforeEach(function() {

		module('qa-rally');

		module(function($provide) {
			mockWindow = { localStorage: {} };
			$provide.value('$window', mockWindow);
		});

		inject(function($injector, _$q_, _$location_, _$rootScope_, Wpi, Rally) {
			$httpBackend = $injector.get('$httpBackend');
			$q = _$q_;
			$location = _$location_;
			$rootScope = _$rootScope_;
			wpiSvc = Wpi;
			rallySvc = Rally;
		});

	});

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
 		$httpBackend.verifyNoOutstandingRequest();
 	});

	// A vanilla WPI with data that matches the fake data in fakeBackend mocks.
	function getMockWpi(fakeBackend) {
		return {
			"id": "0.3256912708748132", 
			"label": "My WPI", 
			"workspaceRef": "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab",
			"projectRef": "https://rally1.rallydev.com/slm/webservice/v3.0/project/d0e34bc7-55c0-4757-857d-6be2604a6c6c", 
			"iterationRef": "https://rally1.rallydev.com/slm/webservice/v3.0/iteration/1becc454-eca1-4b00-ae02-fcdf8cade4d5", 
			"testSets": {
				"https://rally1.rallydev.com/slm/webservice/v3.0/testset/0d0ac990-94c6-4fbd-ba76-12cda2e90bcd": {
					"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testset/0d0ac990-94c6-4fbd-ba76-12cda2e90bcd", 
					"name": "My Test Set"
				},
			}, 
			"testSetRef": "https://rally1.rallydev.com/slm/webservice/v3.0/testset/a2407f6c-7835-4e04-98dd-96fa93837a45", 
			"filter": {
				"nameContains": "My", 
				"testFolders": {}, 
				"withoutTestFolder": false, 
				"withoutWorkProduct": false, 
				"workProducts": {}
			}
		};
	}

	// Tests in this 'describe' sub-section will create the controller manually

	describe('initialization', function() {

		var $controller;

		beforeEach(inject(function(_$controller_){
			$scope = $rootScope.$new();
			$controller = _$controller_;
		}));

		it('of fresh environment initializes state correctly.', function() {

			spyOn(wpiSvc, 'getList').andCallThrough();
			spyOn(wpiSvc, 'getCurrentId').andCallThrough();
			spyOn(rallySvc, 'initSubscriptionData').andCallThrough();

			// Use our boilerplate mock data access.
			var fakeBackend = window.fakeBackendFactory.create();
			fakeBackend.setup($httpBackend);
		
			// --- code under test: creating a controller
			manageWpiCtrl = $controller('ManageWpiCtrl', { $scope: $scope });
			// ---

			// it should initialize with an empty list
			expect($scope.wpiList).toEqual({});
			expect($scope.wpiCurrentId).not.toBeDefined();
			expect($scope.currentWpi).not.toBeDefined();
			expect($scope.focusCurrentWpiHack).not.toBeDefined();
			expect(wpiSvc.getList).toHaveBeenCalled();
			expect(wpiSvc.getCurrentId).toHaveBeenCalled();

			// It should begin loading the subscription data
			expect($scope.isLoading).toEqual(true);
			expect(rallySvc.initSubscriptionData).toHaveBeenCalled();
			expect($scope.subscriptionData).not.toBeDefined();

			// resolve async requests
			$httpBackend.flush();

			// the subscription data is loaded and put into local storage.
			expect($scope.isLoading).toEqual(false);
			expect($scope.subscriptionData).toBeDefined();
		});

	});

	// Tests in this describe sub-section share a beforeEach to create the controller.
	describe('', function() {

		var fakeBackend;

		beforeEach(inject(function($controller){

			fakeBackend = window.fakeBackendFactory.create();
			fakeBackend.setup($httpBackend);

			$scope = $rootScope.$new();
			manageWpiCtrl = $controller('ManageWpiCtrl', { $scope: $scope });

			$httpBackend.flush();

		}));

		it('getWpiCount returns the right number.', function(){

			$scope.wpiList = {};
			expect($scope.getWpiCount()).toEqual(0);

			$scope.wpiList = { a: 'x', b: 'y'};
			expect($scope.getWpiCount()).toEqual(2);

		});

		it('createWpi calls the Wpi service.', function(){

			var fakeWpi = { id: 'fake', foo: 'bar'};
			spyOn(wpiSvc, 'createWpi').andReturn(fakeWpi);

			$scope.createWpi();

			expect($scope.wpiList[fakeWpi.id]).toBe(fakeWpi);
			expect($scope.currentWpi).toBe(fakeWpi);

		});

		it('setCurrentWpi saves the current value.', function() {

			spyOn(wpiSvc, 'setCurrentId').andCallThrough();
			spyOn(wpiSvc, 'getCurrentId').andReturn('the value from getter');
			expect($scope.focusCurrentWpiHack).not.toBeDefined();

			$scope.setCurrentWpi('fake');

			expect(wpiSvc.setCurrentId).toHaveBeenCalledWith('fake');

			// It should write the value, then re-read it in case the service rejected it for some reason.
			expect($scope.wpiCurrentId).toEqual('the value from getter');

			expect($scope.focusCurrentWpiHack).toBeGreaterThan(0);
		});

		it('removeCurrentWpi deals with different cases', function() {

			$scope.wpiList = {
				// make key orders different than labels
				'1A': { id:'1A', label: 'A' },
				'3B': { id:'3B', label: 'B' },
				'4C': { id:'4C', label: 'C' },
				'2D': { id:'2D', label: 'D' },
			}
			
			$scope.wpiCurrentId = '3B'; // alphabetically middle (neither first nor last)
			$scope.removeCurrentWpi();
			expect($scope.wpiList['1A']).toBeDefined();
			expect($scope.wpiList['3B']).not.toBeDefined();
			expect($scope.wpiList['4C']).toBeDefined();
			expect($scope.wpiList['2D']).toBeDefined();
			expect($scope.wpiCurrentId).toEqual('4C'); // next alphabetical label becomes current.

			$scope.wpiCurrentId = '2D'; // alphabetically last label
			$scope.removeCurrentWpi();
			expect($scope.wpiList['1A']).toBeDefined();
			expect($scope.wpiList['3B']).not.toBeDefined();
			expect($scope.wpiList['4C']).toBeDefined();
			expect($scope.wpiList['2D']).not.toBeDefined();
			expect($scope.wpiCurrentId).toEqual('4C'); // if none after victim, new last place is current.

			// TODO the order that the items go through the _.reduce in the code under test seems nondeterministic.
			// I'm not sure how to cover each branch. I'm pretty sure it's working correctly. :(
		});

		it('currentWpiIsValid passes through to service.', function() {

			spyOn(wpiSvc, 'wpiIsValid').andReturn('sandwiches');

			// it is a dumb passthrough
			expect($scope.currentWpiIsValid()).toEqual('sandwiches');

		});

		it('currentWpiHasDefaultLabel compares the label.', function() {

			wpiSvc.defaultWpiLabel = 'sandwiches';

			$scope.currentWpi = { label: 'sandwiches' };
			expect($scope.currentWpiHasDefaultLabel()).toEqual(true);

			$scope.currentWpi = { label: 'XX' };
			expect($scope.currentWpiHasDefaultLabel()).toEqual(false);

			$scope.currentWpi = undefined;
			expect($scope.currentWpiHasDefaultLabel()).toEqual(false);

		});

		it('orderByProjectIterations produces a number based on whether the project has recent iterations', function() {

			var rank;

			// Project with no iteration (or project is not set)

			rank = $scope.orderByProjectIterations(undefined);
			expect(rank).toEqual(2)

			rank = $scope.orderByProjectIterations({});
			expect(rank).toEqual(2)

			rank = $scope.orderByProjectIterations({iterations:{}});
			expect(rank).toEqual(2)

			// Project with old iterations

			rank = $scope.orderByProjectIterations({iterations:{
				'it1': {startDate: '2010-01-01T00:00:00'},
				'it2': {startDate: '2010-02-01T00:00:00'},
				'it3': {startDate: '2010-03-01T00:00:00'}
			}});
			expect(rank).toEqual(1)

			// Project with old iterations

			rank = $scope.orderByProjectIterations({iterations:{
				'it1': {startDate: '2010-01-01T00:00:00'},
				'it2': {startDate: new Date()}, // recent
				'it3': {startDate: '2010-03-01T00:00:00'}
			}});
			expect(rank).toEqual(0)

		});

		it('scope.groupByProjectIterations produces a label based on the orderByProjectIterations.', function() {

			var rank;
			spyOn($scope, 'orderByProjectIterations').andCallFake(function(project) { return rank });

			rank = 2; var label2 = $scope.groupByProjectIterations('ignore project');
			rank = 1; var label1 = $scope.groupByProjectIterations('ignore project');
			rank = 0; var label0 = $scope.groupByProjectIterations('ignore project');

			// We can change the labels without updating the test. But they should be different and defined.
			expect(label0).toBeDefined();
			expect(label1).toBeDefined();
			expect(label2).toBeDefined();

			expect(label0).not.toEqual(label1);
			expect(label1).not.toEqual(label2);
			expect(label2).not.toEqual(label0);
		});

		it('getTestSetCount returns count.', function() {

			$scope.currentWpi = { testSets: { 1: 'X', 2: 'Y'}};
			expect($scope.getTestSetCount()).toEqual(2);

			$scope.currentWpi = undefined;
			expect($scope.getTestSetCount()).toEqual(0);
		});

		it('doneClick navigates to root of site.', function() {

			var isValid;
			spyOn($scope, 'currentWpiIsValid').andCallFake(function(project) { return isValid });
			spyOn($location, 'url').andCallThrough();

			var isValid = false;
			$scope.doneClick();
			expect($location.url).not.toHaveBeenCalled();

			var isValid = true;
			$scope.doneClick();
			expect($location.url).toHaveBeenCalledWith('/');

		})
	})
});
