'use strict';

describe('Controller ManageWpi', function() {

  // Unit under test
  var manageWpiCtrl;

  // Dependency Injections
  var $q, $location, $rootScope, $scope, rallySvc, wpiSvc;

  // Fakes
  var rallyFakes; // inputs
  var wpiFakes;   // inputs

  beforeEach(function(){

    // Load app

    module('QaRally');

    // Get a reference to services

    inject(function(_$q_, _$location_, _$rootScope_, Wpi, Rally) {
      $q = _$q_;
      $location = _$location_;
      $rootScope = _$rootScope_;
      wpiSvc = Wpi;
      rallySvc = Rally;
    });

    // Create fake factories

    rallyFakes = window.rallyServiceFakes.create();
    wpiFakes = window.wpiServiceFakes.create();
  });


  // Tests in this 'describe' sub-section will create the controller manually

  describe('initialization', function() {

    var $controller;

    beforeEach(inject(function(_$controller_){
      $scope = $rootScope.$new();
      $controller = _$controller_;
    }));

    it('starts with a fresh environment.', function() {

      // Arrange

      var deferred = $q.defer();

      spyOn(wpiSvc,   'getList')              .andReturn({});               // no WPI's are cached.
      spyOn(wpiSvc,   'getCurrentId')         .andReturn(undefined);
      spyOn(rallySvc, 'initSubscriptionData') .andReturn(deferred.promise); // and subscriptionData will load later.

      // Act

      manageWpiCtrl = $controller('ManageWpi', { $scope: $scope });

      // Assert
    
      expect($scope.isLoading)              .toEqual(true);                 // State while loading
      expect($scope.wpiList)                .toEqual({});
      expect($scope.wpiCurrentId)           .not.toBeDefined();
      expect($scope.currentWpi)             .not.toBeDefined();
      expect($scope.focusCurrentWpiHack)    .not.toBeDefined();
      expect($scope.subscriptionData)       .not.toBeDefined();

      deferred.resolve(rallyFakes.initSubscriptionData);                    // the load finishes
      $rootScope.$apply();

      expect($scope.isLoading)              .toEqual(false);                // state after loading completes
      expect($scope.subscriptionData).toEqual(rallyFakes.initSubscriptionData);
    });

    it('returns to a cached environment.', function() {

      // Arrange

      spyOn(wpiSvc,   'getList')              .andReturn(wpiFakes.getList);       // the data is cached.
      spyOn(wpiSvc,   'getCurrentId')         .andReturn(wpiFakes.getCurrentId);
      spyOn(rallySvc, 'initSubscriptionData') .andReturn($q.when(rallyFakes.initSubscriptionData));

      // Act

      manageWpiCtrl = $controller('ManageWpi', { $scope: $scope });

      // Assert
    
      expect($scope.isLoading)              .toEqual(true);                 // State while loading
      expect($scope.wpiList)                .toEqual(wpiFakes.getList);
      expect($scope.wpiCurrentId)           .toEqual(wpiFakes.getCurrentId);
      expect($scope.currentWpi)             .toEqual(wpiFakes.getList[wpiFakes.getCurrentId]);
      expect($scope.focusCurrentWpiHack)    .toEqual(1);
      expect($scope.subscriptionData)       .not.toBeDefined();

      $rootScope.$apply();

      expect($scope.isLoading)              .toEqual(false);                // state after loading completes
      expect($scope.subscriptionData).toEqual(rallyFakes.initSubscriptionData);
    });

  });


  // Tests in this section share a beforeEach to create the controller.
  describe('', function() {

    beforeEach(inject(function($controller){

      spyOn(wpiSvc,   'getList')              .andReturn(wpiFakes.getList);
      spyOn(wpiSvc,   'getCurrentId')         .andReturn(wpiFakes.getCurrentId);
      spyOn(rallySvc, 'initSubscriptionData') .andReturn($q.when(rallyFakes.initSubscriptionData));

      $scope = $rootScope.$new();
      manageWpiCtrl = $controller('ManageWpi', { $scope: $scope });

      $rootScope.$apply();

    }));


    describe('getWpiCount', function() {
  
      it('returns the right number.', function(){

        $scope.wpiList = {};
        expect($scope.getWpiCount()).toEqual(0);

        $scope.wpiList = { a: 'x', b: 'y'};
        expect($scope.getWpiCount()).toEqual(2);

      });

    });


    describe('createWpi', function() {
  
      it('calls the Wpi service.', function(){

        // Arrange

        $scope.wpiList = {};

        spyOn(wpiSvc, 'createWpi').andReturn(wpiFakes.createWpi);

        // Act

        $scope.createWpi();

        // Expect: it should create a new WPI and add it to the list.

        expect($scope.wpiList[wpiFakes.createWpi.id]).toBe(wpiFakes.createWpi);

      });

    });


    describe('setCurrentWpi', function() {
  
      it('saves the current value.', function() {

        // Arrange

        spyOn(wpiSvc, 'setCurrentId');

        wpiSvc.getCurrentId = function() {}; // hack to remove old spy
        spyOn(wpiSvc, 'getCurrentId').andReturn('the value from getter');

        $scope.focusCurrentWpiHack = undefined;
        
        // Act

        $scope.setCurrentWpi('fake');

        // Assert

        expect(wpiSvc.setCurrentId).toHaveBeenCalledWith('fake');

        // after saving it should not assume the value it saved was good.
        // it should read it back from the getter, in case the service rejects or transforms it.

        expect($scope.wpiCurrentId).toEqual('the value from getter');

        expect($scope.focusCurrentWpiHack).toBeGreaterThan(0);
      });

    });


    describe('removeCurrentWpi', function() {
  
      it('removes and sets the new current wpi.', function() {

        // Arrange

        spyOn($scope, 'setCurrentWpi');

        $scope.wpiList = {
          // make key orders different than labels
          '1': { id:'1', label: 'B' },
          '2': { id:'2', label: 'D' },
          '3': { id:'3', label: 'F' },
          '4': { id:'4', label: 'H' },
          '5': { id:'5', label: 'G' },
          '6': { id:'6', label: 'E' },
          '7': { id:'7', label: 'C' },
          '8': { id:'8', label: 'A' },
          '9': { id:'9'             } // no label
        };

        // Test 1: remove the last in the list

        $scope.wpiCurrentId = '4';                     // H (alphabetically last one)
        $scope.removeCurrentWpi();
        expect($scope.wpiList['1']).toBeDefined();
        expect($scope.wpiList['2']).toBeDefined();
        expect($scope.wpiList['3']).toBeDefined();
        expect($scope.wpiList['4']).not.toBeDefined();  // <-- H is gone
        expect($scope.wpiList['5']).toBeDefined();
        expect($scope.wpiList['6']).toBeDefined();
        expect($scope.wpiList['7']).toBeDefined();
        expect($scope.wpiList['8']).toBeDefined();
        expect($scope.wpiList['9']).toBeDefined();
        expect($scope.setCurrentWpi)
          .toHaveBeenCalledWith('5');                   // <-- G (new last one - previously before victim) is new current

        // Test 2: remove middle one

        $scope.wpiCurrentId = '2';                     // D (not the last one)
        $scope.removeCurrentWpi();
        expect($scope.wpiList['1']).toBeDefined();
        expect($scope.wpiList['2']).not.toBeDefined(); // <-- D is gone
        expect($scope.wpiList['3']).toBeDefined();
        expect($scope.wpiList['5']).toBeDefined();
        expect($scope.wpiList['6']).toBeDefined();
        expect($scope.wpiList['7']).toBeDefined();
        expect($scope.wpiList['8']).toBeDefined();
        expect($scope.wpiList['9']).toBeDefined();
        expect($scope.setCurrentWpi)
          .toHaveBeenCalledWith('6');                   // <-- E (next alphabetically) is new current

        // Test 3: remove the one with no label

        $scope.wpiCurrentId = '9';
        $scope.removeCurrentWpi();
        expect($scope.wpiList['9']).not.toBeDefined(); // <-- is gone
        expect($scope.setCurrentWpi)
          .toHaveBeenCalledWith('8');                 // <-- A (null label is alphabetically first, 'A' is after it) is new current
  
        // Test 4: no current wpi

        delete $scope.wpiCurrentId; // <-- no current
        $scope.removeCurrentWpi();  // <-- no problem

      });

    });


    describe('currentWpiIsValid', function() {
  
      it('passes through to service.', function() {

        spyOn(wpiSvc, 'wpiIsValid').andReturn('sandwiches');

        // it is a dumb passthrough
        expect($scope.currentWpiIsValid()).toEqual('sandwiches');

      });

    });


    describe('currentWpiHasDefaultLabel', function() {
  
      it('compares the label.', function() {

        wpiSvc.defaultWpiLabel = 'sandwiches';

        $scope.currentWpi = { label: 'sandwiches' };
        expect($scope.currentWpiHasDefaultLabel()).toEqual(true);

        $scope.currentWpi = { label: 'XX' };
        expect($scope.currentWpiHasDefaultLabel()).toEqual(false);

        $scope.currentWpi = undefined;
        expect($scope.currentWpiHasDefaultLabel()).toEqual(false);

      });

    });


    describe('orderByProjectIterations', function() {
    
      it('returns 2 for wpi with no iteration.', function() {

        expect($scope.orderByProjectIterations(undefined))      .toEqual(2);
        expect($scope.orderByProjectIterations({}))             .toEqual(2);
        expect($scope.orderByProjectIterations({iterations:{}})).toEqual(2);

      });

      it('returns 1 for a project with old iterations', function() {

        expect($scope.orderByProjectIterations({iterations:{
          'it1': {startDate: '2010-01-01T00:00:00'},
          'it2': {startDate: '2010-02-01T00:00:00'},
          'it3': {startDate: '2010-03-01T00:00:00'}
        }})).toEqual(1);

      });

      it('returns 0 for a project with active iterations', function() {

        expect($scope.orderByProjectIterations({iterations:{
          'it1': {startDate: '2010-01-01T00:00:00'},
          'it2': {startDate: new Date()}, // recent
          'it3': {startDate: '2010-03-01T00:00:00'}
        }})).toEqual(0);

      });

    });


    describe('groupByProjectIterations', function() {
  
      it('produces a label based on the orderByProjectIterations.', function() {

        // Arrange

        var rank;
        spyOn($scope, 'orderByProjectIterations').andCallFake(function() { return rank; });

        var labels = {};

        angular.forEach([0,1,2], function(r) {

          // Act
          rank = r;
          labels[r] = $scope.groupByProjectIterations('this input project is passed to mock which ignores it');
        });

        // Assert: do not code knowledge of the labels into the test. it's fragile. They must each different and defined.

        expect(typeof labels[0]).toEqual('string');
        expect(typeof labels[1]).toEqual('string');
        expect(typeof labels[2]).toEqual('string');

        expect(labels[0]).not.toEqual(labels[1]);
        expect(labels[1]).not.toEqual(labels[2]);
        expect(labels[2]).not.toEqual(labels[0]);
      });

    });


    describe('getTestSetCount', function() {
  
      it('returns the count.', function() {

        $scope.currentWpi = { testSets: { 1: 'X', 2: 'Y'}};
        expect($scope.getTestSetCount()).toEqual(2);

      });

      it('returns 0 if there isn\'t a wpi.', function() {

        $scope.currentWpi = undefined;
        expect($scope.getTestSetCount()).toEqual(0);

      });

    });


    describe('doneClick', function() {
  
      it('navigates to root of site if wpi is valid.', function() {

        // Arrange

        spyOn($scope, 'currentWpiIsValid').andReturn(true);
        spyOn($location, 'url');

        // Act

        $scope.doneClick();

        // Assert

        expect($location.url).toHaveBeenCalledWith('/');

      });

      it('does nothing if wpi is invalid', function() {

        // Arrange

        spyOn($scope, 'currentWpiIsValid').andReturn(false);
        spyOn($location, 'url');

        // Act

        $scope.doneClick();

        // Assert

        expect($location.url).not.toHaveBeenCalled();

      });

    });


    describe('watchCurrentWpi', function() {

      beforeEach(function() {

        // Arrange

        spyOn(wpiSvc,   'refreshTestSets'   ).andReturn($q.when('cheese'));
        spyOn(wpiSvc,   'clearFilter'       ).andReturn();
        spyOn(rallySvc, 'initTestSetDetails').andReturn($q.when('curds'));

        $scope.currentWpi = {
          label: 'my wpi',
          id: '1',

          // redundant, but documents my expectation
          workspaceRef: 'w1',
          projectRef:   'p1',
          iterationRef: 'i1',
          testSetRef:   'ts1',
        };

        // Act

        $scope.$digest(); // digest will process watches, so these changes don't count during the tests

        // Assert

        // just make sure $digest didn't molest anything

        expect($scope.currentWpi.label)        .toEqual('my wpi');
        expect($scope.currentWpi.id)           .toEqual('1');
        expect($scope.currentWpi.workspaceRef) .toEqual('w1');
        expect($scope.currentWpi.projectRef)   .toEqual('p1');
        expect($scope.currentWpi.iterationRef) .toEqual('i1');
        expect($scope.currentWpi.testSetRef)   .toEqual('ts1');
        expect(wpiSvc.refreshTestSets)         .not.toHaveBeenCalledWith($scope.currentWpi);
        expect(wpiSvc.clearFilter)             .not.toHaveBeenCalled();
      });

      it('changing label will do nothing.', function() {

        // Arrange

        $scope.currentWpi.label = 'new';
        
        // Act

        $scope.$digest();

        // Assert
  
        expect($scope.currentWpi.label)        .toEqual('new');
        expect($scope.currentWpi.id)           .toEqual('1');
        expect($scope.currentWpi.workspaceRef) .toEqual('w1');
        expect($scope.currentWpi.projectRef)   .toEqual('p1');
        expect($scope.currentWpi.iterationRef) .toEqual('i1');
        expect($scope.currentWpi.testSetRef)   .toEqual('ts1');
        expect(wpiSvc.refreshTestSets)         .not.toHaveBeenCalledWith($scope.currentWpi);
        expect(wpiSvc.clearFilter)             .not.toHaveBeenCalled();
      });

      it('changing workspace will blank out downstream fields.', function() {

        // Arrange

        $scope.currentWpi.workspaceRef = 'w2';
        
        // Act

        $scope.$digest(); // digest will process watches

        // Assert
  
        expect($scope.currentWpi.label)        .toEqual('my wpi');
        expect($scope.currentWpi.id)           .toEqual('1');
        expect($scope.currentWpi.workspaceRef) .toEqual('w2');
        expect($scope.currentWpi.projectRef)   .not.toBeDefined();
        expect($scope.currentWpi.iterationRef) .not.toBeDefined();
        expect(wpiSvc.refreshTestSets)         .toHaveBeenCalledWith($scope.currentWpi);
        expect(wpiSvc.clearFilter)             .toHaveBeenCalled();
      });

      it('changing project will blank out downstream fields.', function() {

        // Arrange

        $scope.currentWpi.projectRef = 'p2';
        
        // Act

        $scope.$digest();

        // Assert
  
        expect($scope.currentWpi.label)        .toEqual('my wpi');
        expect($scope.currentWpi.id)           .toEqual('1');
        expect($scope.currentWpi.workspaceRef) .toEqual('w1');
        expect($scope.currentWpi.projectRef)   .toEqual('p2');
        expect($scope.currentWpi.iterationRef) .not.toBeDefined();
        expect(wpiSvc.refreshTestSets)         .toHaveBeenCalledWith($scope.currentWpi);
        expect(wpiSvc.clearFilter)             .toHaveBeenCalled();
      });

      it('changing iteration will blank out downstream fields.', function() {

        // Arrange

        $scope.currentWpi.iterationRef = 'i2';
        
        // Act

        $scope.$digest();

        // Assert
  
        expect($scope.currentWpi.label)        .toEqual('my wpi');
        expect($scope.currentWpi.id)           .toEqual('1');
        expect($scope.currentWpi.workspaceRef) .toEqual('w1');
        expect($scope.currentWpi.projectRef)   .toEqual('p1');
        expect($scope.currentWpi.iterationRef) .toEqual('i2');
        expect(wpiSvc.refreshTestSets)         .toHaveBeenCalledWith($scope.currentWpi);
        expect(wpiSvc.clearFilter)            .toHaveBeenCalled();
      });

      it('if id changes, the cascading is skipped. It figures we switched to a different wpi rather than edited the existing one.', function() {

        // Arrange

        $scope.currentWpi.id = '2';
        $scope.currentWpi.workspaceRef = 'w2';
        
        // Act

        $scope.$digest();

        // Assert
  
        expect($scope.currentWpi.label)        .toEqual('my wpi');
        expect($scope.currentWpi.id)           .toEqual('2');
        expect($scope.currentWpi.workspaceRef) .toEqual('w2');
        expect($scope.currentWpi.projectRef)   .toEqual('p1');
        expect($scope.currentWpi.iterationRef) .toEqual('i1');
        expect($scope.currentWpi.testSetRef)   .toEqual('ts1');

        expect(rallySvc.initTestSetDetails).not.toHaveBeenCalled();
      });

      describe('may default the label if project changes', function() {

        beforeEach(function() {
          $scope.subscriptionData = {
            workspaces: {
              w1: {
                projects: {
                  p2: {
                    name: 'ralph' // <-- for defaulting the label when setting project to w1.p2
                  }
                }
              }
            }
          };
        });

        it('and project is in the subscriptionData.', function() {

          // Arrange

          delete $scope.currentWpi.label;       // <-- if label is falsey
          $scope.currentWpi.projectRef = 'p2';  // <-- and p2 is defined in the subscriptionData

          // Act

          $scope.$digest();

          // Assert
    
          expect($scope.currentWpi.label).toEqual('ralph'); // <-- label is defaulted to the project name
        });

        it('but not if project is not in the subscriptionData.', function() {

          // Arrange

          delete $scope.currentWpi.label;       // <-- if label is falsey
          $scope.currentWpi.projectRef = 'p3';  // <-- and p2 is NOT defined in the subscriptionData

          // Act

          $scope.$digest();

          // Assert
    
          expect($scope.currentWpi.label).not.toBeDefined();
        });

        it('but not if workspace is not in the subscriptionData.', function() {

          // Arrange

          delete $scope.currentWpi.label;
          $scope.currentWpi.workspaceRef = 'w2';  // <-- not in subscriptionData
          $scope.currentWpi.projectRef = 'p2';

          // Act

          $scope.$digest();

          // Assert
    
          expect($scope.currentWpi.label).not.toBeDefined();
        });

        it('but not if there is no subscriptionData.', function() {

          // Arrange

          delete $scope.currentWpi.label;
          $scope.currentWpi.projectRef = 'p2';
          delete $scope.subscriptionData;

          // Act

          $scope.$digest();

          // Assert
    
          expect($scope.currentWpi.label).not.toBeDefined();
        });

      });

    });


    describe('watchWpiList', function() {

      beforeEach(function() {

        spyOn(wpiSvc, 'setList');

        $scope.wpiList = wpiFakes.getList;

        $scope.$digest(); // digest will process watches, so these changes don't count during the tests
      });

      it('will save changes.', function() {

        // Arrange

        $scope.wpiList.whatever = 'something';

        // Act

        $scope.$digest();

        // Assert

        expect(wpiSvc.setList).toHaveBeenCalledWith($scope.wpiList);

      });

      it('will not save no-changes.', function() {

        // Arrange

        // no changes to $scope.wpiList

        // Act

        $scope.$digest();

        // Assert

        expect(wpiSvc.setList).not.toHaveBeenCalled();

      });

      it('puts the storage used by the wpiList in the scope.', function() {

        // Arrange

        var jsonLength = angular.toJson($scope.wpiList).length;
        expect(jsonLength).toBeGreaterThan(0); // sanity check

        // Act

        $scope.$digest(); // digest will process watches, so these changes don't count during the tests

        // Assert

        expect($scope.wpiBytes).toEqual(jsonLength);

      });

    });

  });


});
