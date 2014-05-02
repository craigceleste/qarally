'use strict';

describe('Controller ManageWpi', function() {

  var manageWpiCtrl; // unit under test

  // DI's
  var $httpBackend, $q, $location, $rootScope, $scope, mockWindow, rallySvc, wpiSvc;

  beforeEach(function() {

    module('QaRally');

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

  // Tests in this 'describe' sub-section will create the controller manually

  describe('initialization', function() {

    var $controller;

    beforeEach(inject(function(_$controller_){
      $scope = $rootScope.$new();
      $controller = _$controller_;
    }));

    it('of fresh environment initializes state correctly.', function() {

      // Arrange

      spyOn(wpiSvc, 'getList').andCallThrough();
      spyOn(wpiSvc, 'getCurrentId').andCallThrough();
      spyOn(rallySvc, 'initSubscriptionData').andCallThrough();

      // Use our boilerplate mock data access.
      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.setup($httpBackend);
    
      // Act

      manageWpiCtrl = $controller('ManageWpi', { $scope: $scope });
      
      // Assert

      // it should initialize with an empty list before $http is finished
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

    it('will focus the current wpi on start.', function() {

      // Arrange

      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.setup($httpBackend);

      spyOn(wpiSvc, 'getCurrentId').andReturn('wpi1'); // <-- if there is a current wpi

      spyOn(wpiSvc, 'getList').andReturn({
        wpi1: 'stuff'                                  // <-- that exists in the list
      });
      
      // Act

      manageWpiCtrl = $controller('ManageWpi', { $scope: $scope });
      $httpBackend.flush();

      // Assert

      expect($scope.focusCurrentWpiHack).toBeGreaterThan(0); // <-- we'll set a flag that a directive will be looking for to focus an input
      
    });

  });

  // Tests in this section share a beforeEach to create the controller.
  describe('', function() {

    var fakeBackend;

    beforeEach(inject(function($controller){

      fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.setup($httpBackend);

      $scope = $rootScope.$new();
      manageWpiCtrl = $controller('ManageWpi', { $scope: $scope });

      $httpBackend.flush();

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

        var fakeWpi = { id: 'fake', foo: 'bar'};
        spyOn(wpiSvc, 'createWpi').andReturn(fakeWpi);

        $scope.createWpi();

        expect($scope.wpiList[fakeWpi.id]).toBe(fakeWpi);
        expect($scope.currentWpi).toBe(fakeWpi);

      });

    });

    describe('setCurrentWpi', function() {
  
      it('saves the current value.', function() {

        spyOn(wpiSvc, 'setCurrentId').andCallThrough();
        spyOn(wpiSvc, 'getCurrentId').andReturn('the value from getter');
        expect($scope.focusCurrentWpiHack).not.toBeDefined();

        $scope.setCurrentWpi('fake');

        expect(wpiSvc.setCurrentId).toHaveBeenCalledWith('fake');

        // It should write the value, then re-read it in case the service rejected it for some reason.
        expect($scope.wpiCurrentId).toEqual('the value from getter');

        expect($scope.focusCurrentWpiHack).toBeGreaterThan(0);
      });

    });

    describe('removeCurrentWpi', function() {
  
      it('deals with different cases', function() {

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
        
        $scope.wpiCurrentId = '4';
        $scope.removeCurrentWpi();
        expect($scope.wpiList['1']).toBeDefined();
        expect($scope.wpiList['2']).toBeDefined();
        expect($scope.wpiList['3']).toBeDefined();
        expect($scope.wpiList['4']).not.toBeDefined(); // <-- H (last one) is gone
        expect($scope.wpiCurrentId).toEqual('5');      // <-- G (new last one - previously before victim) is new current
        expect($scope.wpiList['5']).toBeDefined();
        expect($scope.wpiList['6']).toBeDefined();
        expect($scope.wpiList['7']).toBeDefined();
        expect($scope.wpiList['8']).toBeDefined();
        expect($scope.wpiList['9']).toBeDefined();

        $scope.wpiCurrentId = '2';
        $scope.removeCurrentWpi();
        expect($scope.wpiList['1']).toBeDefined();
        expect($scope.wpiList['2']).not.toBeDefined(); // <-- D (not last one) is gone
        expect($scope.wpiCurrentId).toEqual('6');      // <-- E (next alphabetically) is new current
        expect($scope.wpiList['3']).toBeDefined();
        expect($scope.wpiList['5']).toBeDefined();
        expect($scope.wpiList['6']).toBeDefined();
        expect($scope.wpiList['7']).toBeDefined();
        expect($scope.wpiList['8']).toBeDefined();
        expect($scope.wpiList['9']).toBeDefined();

        $scope.wpiCurrentId = '9';
        $scope.removeCurrentWpi();
        expect($scope.wpiList['9']).not.toBeDefined(); // <-- is gone
        expect($scope.wpiCurrentId).toEqual('8');      // <-- A (null label is alphabetically first, 'A' is after it) is new current
        
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
  
      it('produces a number based on whether the project has recent iterations', function() {

        var rank;

        // Project with no iteration (or project is not set)

        rank = $scope.orderByProjectIterations(undefined);
        expect(rank).toEqual(2);

        rank = $scope.orderByProjectIterations({});
        expect(rank).toEqual(2);

        rank = $scope.orderByProjectIterations({iterations:{}});
        expect(rank).toEqual(2);

        // Project with old iterations

        rank = $scope.orderByProjectIterations({iterations:{
          'it1': {startDate: '2010-01-01T00:00:00'},
          'it2': {startDate: '2010-02-01T00:00:00'},
          'it3': {startDate: '2010-03-01T00:00:00'}
        }});
        expect(rank).toEqual(1);

        // Project with old iterations

        rank = $scope.orderByProjectIterations({iterations:{
          'it1': {startDate: '2010-01-01T00:00:00'},
          'it2': {startDate: new Date()}, // recent
          'it3': {startDate: '2010-03-01T00:00:00'}
        }});
        expect(rank).toEqual(0);

      });

    });

    describe('groupByProjectIterations', function() {
  
      it('produces a label based on the orderByProjectIterations.', function() {

        var rank;
        spyOn($scope, 'orderByProjectIterations').andCallFake(function() { return rank; });

        rank = 2;
        var label2 = $scope.groupByProjectIterations('ignore project');

        rank = 1;
        var label1 = $scope.groupByProjectIterations('ignore project');

        rank = 0;
        var label0 = $scope.groupByProjectIterations('ignore project');

        // We can change the labels without updating the test. But they should be different and defined.
        expect(label0).toBeDefined();
        expect(label1).toBeDefined();
        expect(label2).toBeDefined();

        expect(label0).not.toEqual(label1);
        expect(label1).not.toEqual(label2);
        expect(label2).not.toEqual(label0);
      });

    });

    describe('getTestSetCount', function() {
  
      it('returns count.', function() {

        $scope.currentWpi = { testSets: { 1: 'X', 2: 'Y'}};
        expect($scope.getTestSetCount()).toEqual(2);

        $scope.currentWpi = undefined;
        expect($scope.getTestSetCount()).toEqual(0);
      });

    });

    describe('doneClick', function() {
  
      it('navigates to root of site.', function() {

        var isValid;
        spyOn($scope, 'currentWpiIsValid').andCallFake(function() { return isValid; });
        spyOn($location, 'url').andCallThrough();

        isValid = false;
        $scope.doneClick();
        expect($location.url).not.toHaveBeenCalled();

        isValid = true;
        $scope.doneClick();
        expect($location.url).toHaveBeenCalledWith('/');

      });

    });

    describe('$watch currentWpi', function() {

      beforeEach(function() {

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

        $scope.$digest();

        // just make sure $apply didn't molest it
        expect($scope.currentWpi.label)        .toEqual('my wpi');
        expect($scope.currentWpi.id)           .toEqual('1');
        expect($scope.currentWpi.workspaceRef) .toEqual('w1');
        expect($scope.currentWpi.projectRef)   .toEqual('p1');
        expect($scope.currentWpi.iterationRef) .toEqual('i1');
        expect($scope.currentWpi.testSetRef)   .toEqual('ts1');
        expect(wpiSvc.refreshTestSets)         .not.toHaveBeenCalledWith($scope.currentWpi);
        expect(wpiSvc.clearFilter)            .not.toHaveBeenCalled();
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

        $scope.$digest();

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

  });

});
