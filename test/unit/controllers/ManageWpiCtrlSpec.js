'use strict';

describe('ManageWpiCtrl', function() {

	var $rootScope, $scope, $q, $location, mockWpi, mockRally;

	// Load app

	beforeEach(module('qa-rally'));

	// Mock Wpi Service

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
			defaultWpiLabel: 'Banana Pancake'
		};
		$provide.value('Wpi', mockWpi);
	}));

	// Mock Rally Service

	beforeEach(module(function($provide) {

		// TODO centralize fake data somewhere? I have repeated this in mock-rally-backend, rally-spec and here so far. If the structure of this changes, it gets more difficult to refactor.
		function getFakeSubscriptionData() {
			return {
				  _ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/subscription/15647602362'
				, workspacesRef: 'https://rally1.rallydev.com/slm/webservice/v2.0/Subscription/15647602362/Workspaces'
				, workspaces: {
					'https://rally1.rallydev.com/slm/webservice/v2.0/workspace/15647602518': {
						  _ref:'https://rally1.rallydev.com/slm/webservice/v2.0/workspace/15647602518'
						, name: 'Workspace 1'
						, projectsRef: 'https://rally1.rallydev.com/slm/webservice/v2.0/Workspace/15647602518/Projects'
						, projects: {
							'https://rally1.rallydev.com/slm/webservice/v2.0/project/15647602608': {
								  _ref:'https://rally1.rallydev.com/slm/webservice/v2.0/project/15647602608'
								, name:'Sample Project'
								, iterationsRef:'https://rally1.rallydev.com/slm/webservice/v2.0/Project/15647602608/Iterations'
								, iterations: {
									'https://rally1.rallydev.com/slm/webservice/v2.0/iteration/15647935070': {
										  _ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/iteration/15647935070'
										, name: 'Sprint 1'
										, startDate: '2013-12-16T07:00:00.000Z'
										, endDate: '2013-12-23T06:59:59.000Z'
									}
								}
							}
						}
					}
				}
			};
		}

		// TODO I set this up before learing about jasmine spies. Reconsider this one. It might be fine.
		mockRally = {

			// initSubscriptionData
			// - tests may modify or replace the fake data before use.
			// - tests may set DoResolve to false to leave the promise unresolved (to test the behavior prior to resolution)

			initSubscriptionData$FakeData: getFakeSubscriptionData(),
			initSubscriptionData$DoResolve: true,
			initSubscriptionData: function() {
				var mock = this;
				return {
					then: function(callback) {
						if (mock.initSubscriptionData$DoResolve) {
							callback(mock.initSubscriptionData$FakeData);
						}
					}
				};
			}

		};

		$provide.value('Rally', mockRally);
	}));

	beforeEach(inject(function(_$q_, _$location_, _$rootScope_) {
		$q = _$q_;
		$location = _$location_;
		$rootScope = _$rootScope_;
	}));

	describe('initialization', function() {

		var $controller;

		// Get the $controller factory so I can create the ctrl in the tests.

		beforeEach(inject(function(_$controller_){
			$scope = $rootScope.$new();
			$controller = _$controller_;
		}));

		it('will add {wpiList, wpiCurrentId, currentWpi} to $scope.', function() {

			var ctrl = $controller('ManageWpiCtrl', { $scope: $scope });

			expect($scope.wpiList).toEqual(mockWpi.list);
			expect($scope.wpiCurrentId).toEqual(mockWpi.currentId);
			expect($scope.currentWpi).toBe(mockWpi.list[mockWpi.currentId]);

			// sanity check that currentWpi and wpiList[currentId] are the same instance.
			// if we update currentWpi as a handy shorthand, we ARE actually changing the list (intended!)

			$scope.currentWpi.mork = 'mork';
			expect($scope.currentWpi.mork).toEqual(mockWpi.list[mockWpi.currentId].mork);
		});

		it('will leave currentWpi undefined if there isn\'t a current one.', function() {

			mockWpi.currentId = undefined;

			var ctrl = $controller('ManageWpiCtrl', { $scope: $scope });

			expect($scope.wpiList).toEqual(mockWpi.list);
			expect($scope.wpiCurrentId).toBeUndefined();
			expect($scope.currentWpi).toBeUndefined();
		});

		it ('will remain in isLoading==true state until  subscriptionData is loaded.', function() {

			mockRally.initSubscriptionData$DoResolve = false; // leave the promise hanging

			var ctrl = $controller('ManageWpiCtrl', { $scope: $scope });

			expect($scope.isLoading).toEqual(true);
			expect($scope.subscriptionData).toBeUndefined();
		});

		it ('will set subscriptionData to the $scope after its loaded.', function() {

			var ctrl = $controller('ManageWpiCtrl', { $scope: $scope });

			expect($scope.isLoading).toEqual(false);
			expect($scope.subscriptionData).toBe(mockRally.initSubscriptionData$FakeData);

		});

		it ('will set up a $watch to save model changes as they happen.', function() {

			mockWpi.setList = function() {};
			spyOn(mockWpi, 'setList');

			var ctrl = $controller('ManageWpiCtrl', { $scope: $scope });
			
			// No changes. Don't call it.
			$scope.$apply();
			expect(mockWpi.setList).not.toHaveBeenCalled();

			// Changes. Call it.
			$scope.wpiList['sally'].extra = 'stuff';
			$scope.$apply();
			expect(mockWpi.setList).toHaveBeenCalledWith($scope.wpiList);
		});
		
		// This test may be overly complex, making it hard to maintain the code under test.
		// The purpose of the code under test is to make sure wpiList is in sync with subscriptionData,
		// so we need to mock this data in a non-trivial way.

		describe('will set up a $watch to correct the .currentWpi as it is edited.', function() {

			var ctrl;
			var workspace0, project00, iteration000;
			var workspace1, project01, iteration001;

			beforeEach(function(){

				// Initial state will be a WPI with: ws[0].p[0].it[0]
				workspace0 = mockRally.initSubscriptionData$FakeData.workspaces['https://rally1.rallydev.com/slm/webservice/v2.0/workspace/15647602518']
				project00 = workspace0.projects['https://rally1.rallydev.com/slm/webservice/v2.0/project/15647602608'];
				iteration000 = project00.iterations['https://rally1.rallydev.com/slm/webservice/v2.0/iteration/15647935070'];

				// Add a second item to each list, that we can switch to (note that these are NOT inside each other)
				workspace1 = {_ref: 'ws1', name: 'Workspace 1', projectsRef: 'projects ref', projectsList: []};
				mockRally.initSubscriptionData$FakeData.workspaces[workspace1._ref] = workspace1;

				project01 = {_ref: 'p1', name: 'Project 1', iterationsRef: 'it ref', iterationList: [] };
				workspace0.projects[project01._ref] = project01;

				iteration001 = { _ref: 'it1', name: 'Iteration 1', startDate: '2013-12-16T07:00:00.000Z', endDate: '2013-12-23T06:59:59.000Z' };
				project00.iterations[iteration001._ref] = iteration001;

				// create the initial wpi and make it current.
				var newId = 'george';
				mockWpi.list[newId]= {
					id: newId,
					workspaceRef: workspace0._ref,
					projectRef: project00._ref,
					iterationRef: iteration000._ref,
					testSets: {},
					testSetRef: 'initial test set',
					label: 'initial label',
					buildNumber: 'initial buildNumber'
				};
				mockWpi.currentId = newId;

				// TODO review. I'm failing on these tests. It's getting out of hand... I find myself forced to come in and hack stuff like this just to pass tests without thinking about how or why.
				// The easy thing to say is "don't do that". But I think the it's an artifact of me not knowing what I'm doing.
				mockWpi.refreshTestSets = function() {}
				spyOn(mockWpi, 'refreshTestSets');

				// setList is unrelated to this test but needs to be mocked.
				mockWpi.setList = function() {};
				spyOn(mockWpi, 'setList');

				// Create the unit under test
				ctrl = $controller('ManageWpiCtrl', { $scope: $scope });

				// Set initial digest state
				$scope.$apply();

				// sanity check on the starting condition
				expect($scope.currentWpi.id).toEqual('george');
				expect($scope.currentWpi.workspaceRef).toEqual(workspace0._ref);
				expect($scope.currentWpi.projectRef).toEqual(project00._ref);
				expect($scope.currentWpi.label).toEqual('initial label');
				expect($scope.currentWpi.iterationRef).toEqual(iteration000._ref);
				expect($scope.currentWpi.testSetRef).toEqual('initial test set');
				expect($scope.currentWpi.testSets).toEqual({});
				expect($scope.currentWpi.buildNumber).toEqual('initial buildNumber');
			});

			it ('Modifying .workspaceRef clears out everything.', function() {

				$scope.currentWpi.workspaceRef = workspace1._ref;
				$scope.$apply();

				// Edited
				expect($scope.currentWpi.workspaceRef).toEqual(workspace1._ref);

				// Downstream cleared
				expect($scope.currentWpi.projectRef).toBeUndefined();
				expect($scope.currentWpi.iterationRef).toBeUndefined();
				expect($scope.currentWpi.buildNumber).toBeUndefined();
				expect(mockWpi.refreshTestSets).toHaveBeenCalled();

				// Label is special
				expect($scope.currentWpi.label).toEqual('initial label'); // label doesn't get cleared
			});

			it ('Modifying .projectRef clears out everything below it.', function() {

				$scope.currentWpi.projectRef = project01._ref;
				
				$scope.$apply();

				// Upstream. Unchanged
				expect($scope.currentWpi.workspaceRef).toEqual(workspace0._ref);

				// Edited
				expect($scope.currentWpi.projectRef).toEqual(project01._ref);

				// Downstream cleared.
				expect($scope.currentWpi.iterationRef).toBeUndefined();
				expect($scope.currentWpi.buildNumber).toBeUndefined();
				expect(mockWpi.refreshTestSets).toHaveBeenCalled();

				// Label is special
				expect($scope.currentWpi.label).toEqual('initial label');
			});

			it ('Modifying .iterationRef clears out everything below it.', function() {

				$scope.currentWpi.iterationRef = iteration001._ref;
				
				$scope.$apply();

				// Upstream. Unchanged
				expect($scope.currentWpi.workspaceRef).toEqual(workspace0._ref);
				expect($scope.currentWpi.projectRef).toEqual(project00._ref);

				// Edited.
				expect($scope.currentWpi.iterationRef).toEqual(iteration001._ref);

				// Downstream cleared.
				expect($scope.currentWpi.buildNumber).toBeUndefined();
				expect(mockWpi.refreshTestSets).toHaveBeenCalled();

				// Label is special
				expect($scope.currentWpi.label).toEqual('initial label');
			});

			it ('Modifying .projectRef can default the wpi label.', function() {

				$scope.currentWpi.label = mockWpi.defaultWpiLabel;
				$scope.currentWpi.projectRef = project01._ref;
				
				$scope.$apply();

				// Edited.
				expect($scope.currentWpi.label).toEqual(project01.name);
			});

			it('False edits by changing index are ignored', function() {

				$scope.currentWpi.id = 'different';
				
				$scope.$apply();

				// Nothing has changed
				expect($scope.currentWpi.workspaceRef).toEqual(workspace0._ref);
				expect($scope.currentWpi.projectRef).toEqual(project00._ref);
				expect($scope.currentWpi.label).toEqual('initial label');
				expect($scope.currentWpi.iterationRef).toEqual(iteration000._ref);
				expect($scope.currentWpi.testSetRef).toEqual('initial test set');
				expect($scope.currentWpi.buildNumber).toEqual('initial buildNumber');
			});

		})
	});
	// The rest of the cases assume a standard ctrl is created.

	describe('', function() {

		var ctrl, $scope;

		// Get the $controller factory so I can create the ctrl in the tests.

		beforeEach(function(){
			inject(function($controller){
				$scope = $rootScope.$new();
				ctrl = $controller('ManageWpiCtrl', { $scope: $scope });
			});
		});

		it('will expose .setCurrentWpi() on the $scope, which sets the currently focused wpi.', function() {

			mockWpi.setCurrentId = function() {};
			spyOn(mockWpi, 'setCurrentId');
			mockWpi.getCurrentId = function() { return 'frank'; };

			$scope.setCurrentWpi('to something awesome');

			expect(mockWpi.setCurrentId).toHaveBeenCalledWith('to something awesome');

			// it should do a get from the service which may return a transformed or different current value.
			expect($scope.wpiCurrentId).toEqual('frank');
			expect($scope.currentWpi).toBe($scope.wpiList['frank']);
		});
		
		it('will expose .createWpi() on the $scope, which adds a WPI to the list.', function() {

			mockWpi.createWpi = function() {};
			spyOn(mockWpi, 'createWpi').andReturn({id:'something cool'});
			spyOn($scope, 'setCurrentWpi');

			$scope.createWpi();

			expect(mockWpi.createWpi).toHaveBeenCalledWith($scope.wpiList);
			expect($scope.setCurrentWpi).toHaveBeenCalledWith('something cool');
		});
		
		it('exposes .removeCurrentWpi() on the $scope, which removes the currently focused wpi from the list.', function() {

			spyOn($scope, 'setCurrentWpi');

			$scope.wpiList = {
				// It will iterate them in key order, incidentally
				'1': { id: '1', label: 'a'},
				'7': { id: '7', label: 'b'},
				'2': { id: '2', label: 'c' },
				'6': { id: '6', label: undefined},
				'3': { id: '3', label: 'e'},
				'5': { id: '5', label: 'f'},
				'4': { id: '4', label: 'g'}
			};

			_.each([
				{victimId: '3', nextCurrentId: '5', expectLength: 6},
				{victimId: '4', nextCurrentId: '5', expectLength: 5},
				{victimId: '1', nextCurrentId: '7', expectLength: 4},
				{victimId: '6', nextCurrentId: '7', expectLength: 3},
			], function(test) {
				expect($scope.wpiList[test.victimId]).not.toBeUndefined()
				$scope.wpiCurrentId = test.victimId;
				$scope.currentWpi = $scope.wpiList[test.victimId];

				$scope.removeCurrentWpi();

				expect($scope.wpiList[test.victimId]).toBeUndefined()
				expect(Object.keys($scope.wpiList).length).toEqual(test.expectLength);
				expect($scope.setCurrentWpi).toHaveBeenCalledWith(test.nextCurrentId);
			});

//			expect($scope.wpiList.length).toEqual(0);
		});

		it ('.currentWpiIsValid() returns true if any of the required wpi fields are blank.', function() {

			mockWpi.wpiIsValid = function() {};
			spyOn(mockWpi, 'wpiIsValid').andReturn('freddie');

			var actual = $scope.currentWpiIsValid();

			expect(mockWpi.wpiIsValid).toHaveBeenCalledWith($scope.currentWpi);
			expect(actual).toBe('freddie'); // dumb pass through to service
		});

		it ('.currentWpiHasDefaultLabel() returns true if the currentWpi has the default label.', function() {

			$scope.currentWpi.label = mockWpi.defaultWpiLabel;
			expect($scope.currentWpiHasDefaultLabel()).toEqual(true)

			$scope.currentWpi.label = mockWpi.defaultWpiLabel + ' is different';
			expect($scope.currentWpiHasDefaultLabel()).toEqual(false)
		});

		it('groupByProjectIterations() returns a string depending on iteration state.', function() {

			function getDatePlusMonths(months) {
				// I don't care about edge cases like 31st of month, leap years, etc.
				var date = new Date();
				date.setMonth(date.getMonth() + months);
				return date.toISOString();
			}

			var noIterationsLabel = $scope.groupByProjectIterations({
				iterations: { } // <-- no iterations
			});
			expect(typeof noIterationsLabel).toEqual('string');
			expect(noIterationsLabel.length).toBeGreaterThan(0);


			var olderIterationsLabel = $scope.groupByProjectIterations({
				iterations: {
					  'ref1': { startDate: getDatePlusMonths(-24) } // <-- all older
					, 'ref2': { startDate: getDatePlusMonths(-12) }
					, 'ref3': { startDate: getDatePlusMonths(-18) }
				}
			});
			expect(typeof olderIterationsLabel).toEqual('string');
			expect(olderIterationsLabel.length).toBeGreaterThan(0);
			expect(olderIterationsLabel.length).not.toEqual(noIterationsLabel);


			var recentIterationsLabel =  $scope.groupByProjectIterations({
				iterations: {
					  'ref1': { startDate: getDatePlusMonths(-24) }
					, 'ref2': { startDate: getDatePlusMonths(-12) }
					, 'ref3': { startDate: getDatePlusMonths(0) }    // <-- not old
					, 'ref4': { startDate: getDatePlusMonths(-18) }
				}
			});
			expect(typeof recentIterationsLabel).toEqual('string');
			expect(recentIterationsLabel.length).toBeGreaterThan(0);
			expect(recentIterationsLabel.length).not.toEqual(noIterationsLabel);
			expect(recentIterationsLabel.length).not.toEqual(olderIterationsLabel);
		});

		it('doneClick() navigates to /.', function() {

			// Initialize path to something
			$location.path('/something');
			expect($location.path()).toBe('/something');

			// If currentWpiIsValid() returns true, doneClick will navigate to /
			var isValid = true;
			spyOn($scope, 'currentWpiIsValid').andCallFake(function() { return isValid; });
			$scope.doneClick();
			expect($location.path()).toBe('/');

			// Re-initialize path to something
			$location.path('/something');
			expect($location.path()).toBe('/something');

			// If currentWpiIsValid() returns false, we do not navigate.
			var isValid = false;
			$scope.doneClick();
			expect($location.path()).toBe('/something');

		});

	});

});
