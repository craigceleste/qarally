'use strict';

describe('Controller RunTestCases', function() {

  // Unit under test
  var ctrl;

  // Dependency Injections
  var $controller, $q, $location, $rootScope, $scope, $timeout, $sce, settingsSvc, wpiSvc, rallySvc;

  // Fakes
  var rallyFakes;
  var wpiFakes;
  var fakeSettings, fakeWpiIsValid, doScopeApply;

  // experiment:
  //    be aggressive about not using real service methods (force using mocks).
  //    Option 1 (rejected):
  //        manually create a mock that looks like the real service.
  //        this is hard to keep the mock accurate and up to date.
  //        if the real service changes and the mock doesn't, none of these tests will fail.
  //    Option 2 (experiment)
  //        use the real service, but replace all the methods with a function that throws.
  //        if any of this code under test call these methods, it's a bug in the test not to mock the method.
  //        code will use spyOn('method'). if the real service lacks that method, it will again throw.
  function cleanService(service) {
    angular.forEach(Object.keys(service), function(key) {
      if (typeof service[key] === 'function') {
        service[key] = function() { throw key + ' was called without mock.'; }
      }
    });
    return service;
  }

  beforeEach(function(){

    // Load app

    module('QaRally');

    // Get a reference to services

    inject(function(_$controller_, _$q_, _$location_, _$rootScope_, _$timeout_, _$sce_, Settings, Wpi, Rally) {
      $q = _$q_;
      $location = _$location_;
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      $sce = _$sce_;
      $controller = _$controller_;
      settingsSvc = cleanService(Settings);
      wpiSvc = cleanService(Wpi);
      rallySvc = cleanService(Rally);
    });

  });

  beforeEach(function() {

    // Initialize fake data

    rallyFakes = window.rallyServiceFakes.create();
    wpiFakes = window.wpiServiceFakes.create();
    fakeSettings = {};
    fakeWpiIsValid = true;
    doScopeApply = false;

  })

  // allow manipulation of the fake/mock data inside the test before ctrl is created

  function createController() {

      spyOn(settingsSvc, 'get').andReturn(fakeSettings);
      spyOn(settingsSvc, 'set');

      spyOn(wpiSvc, 'getList')              .andReturn(wpiFakes.getList);
      spyOn(wpiSvc, 'setList');
      spyOn(wpiSvc, 'getCurrentId')         .andReturn(wpiFakes.getCurrentId);
      spyOn(wpiSvc, 'setCurrentId');
      spyOn(wpiSvc, 'wpiIsValid')           .andReturn(fakeWpiIsValid);
      spyOn(wpiSvc, 'refreshTestSets')      .andReturn($q.when(wpiFakes.refreshTestSets));
      spyOn(wpiSvc, 'clearFilter');

      spyOn(rallySvc, 'initTestSetDetails') .andReturn($q.when(rallyFakes.initTestSetDetails));

      spyOn($location, 'url');

      $scope = $rootScope.$new();

      ctrl = $controller('RunTestCases', { $scope: $scope });

      if (doScopeApply) {
        $rootScope.$apply(); // cause async's to finish during initialization
      }
  }

  // Tests in this 'describe' sub-section will create the controller manually
  describe('initialization', function() {

    it('adds the settings to the scope.', function() {
      fakeSettings = 'Gordon';
      
      createController();
      
      expect($scope.preferences).toEqual('Gordon');
    });

    it('adds the wpiList to the scope.', function() {
      
      createController();

      expect($scope.wpiList).toEqual(wpiFakes.getList);
    });

    it('adds the current wpi to the scope.', function() {
      
      createController();

      expect($scope.wpiCurrentId).toEqual(wpiFakes.getCurrentId);
      expect($scope.currentWpi).toEqual($scope.wpiList[wpiFakes.getCurrentId]);
    });

    it('loads the test set details asynchronously.', function() {
      
      createController();

      expect($scope.testSetDetails)         .not.toBeDefined();          // ...initially undefined
      $rootScope.$apply();                                               // promises resolve
      expect($scope.testSetDetails).toBe(rallyFakes.initTestSetDetails); // ...then it's set
    });

    it('safely ignores loading test set details if there aren\'t any.', function() {

      delete wpiFakes.getList[wpiFakes.getCurrentId].testSetRef; // <--- no test set this time

      createController();

      expect($scope.testSetDetails)         .not.toBeDefined();      // ...initially
      $rootScope.$apply();                                           // promises resolve
      expect($scope.testSetDetails)         .not.toBeDefined();      // ...still undefined (and no crashes)
    });

    it('redirects to Manage WPI if the current wpi is not valid.', function() {

      // IMPORTANT: all code in this ctrl (past this initialization) may assume the WPI is well formed and defined.
      wpiFakes.getList = {};
      wpiFakes.getCurrentId = undefined;
      fakeWpiIsValid = false;

      createController();

      expect($location.url)               .toHaveBeenCalledWith('/manage-wpi');
    });
    
    it('does not redirect for the happy path.', function() {

      createController();

      expect($location.url)               .not.toHaveBeenCalledWith('/manage-wpi');
    });
    
  });
  
  // the rest of the tests share some initialization
  describe('', function() {

    beforeEach(function() {
      doScopeApply = true;
    });

    describe('getLength', function() {

      it('returns the number of keys on an object.', function() {

        createController();

        expect( $scope.getLength(undefined))          .toEqual(0);
        expect( $scope.getLength({}))                 .toEqual(0);
        expect( $scope.getLength({ a: 'A', b: 'B' })) .toEqual(2);

      });

    });


    describe('openManageWpiForm', function() {

      it('to navigate to the Manage WPI page.', function() {

        createController();

        $scope.openManageWpiForm();

        expect($location.url).toHaveBeenCalledWith('/manage-wpi');

      });

    });


    describe('wpiIsValid', function() {

      it('is a dumb callthrough.', function() {

        // Arrange

        createController();

        wpiSvc.wpiIsValid = function() {}; // hack: blow away the existing spy
        spyOn(wpiSvc, 'wpiIsValid').andReturn('something nonsensical');

        // Act

        var actualResult = $scope.wpiIsValid();

        // Assert

        expect(actualResult).toEqual('something nonsensical');

      });

    });


    describe('setCurrentWpi', function() {

      it('persists the choice and updates the scope.', function() {

        // Arrange

        createController();
        spyOn(ctrl.helpers, 'updateScope');

        // Act

        $scope.setCurrentWpi('0.987654');

        // Assert

        expect(wpiSvc.setCurrentId).wasCalledWith('0.987654');
        expect(ctrl.helpers.updateScope).toHaveBeenCalled();

      });

    });


    describe('refreshTestSets', function() {

      it('asynchronously loads the test set details.', function() {

        // Arrange

        createController();
        expect($scope.currentWpi.testSetRef).toBeDefined(); // sanity check. it's set

        spyOn(ctrl.helpers, 'updateScope');

        // Act

        $scope.refreshTestSets();

        // Assert

        expect($scope.currentWpi.testSetRef).not.toBeDefined();    // it's cleared while we wait for the async to finish
        expect(ctrl.helpers.updateScope.calls.length).toEqual(1);  // and the scope is updated to reflect it
        expect(wpiSvc.refreshTestSets).toHaveBeenCalled();

        $rootScope.$apply(); // async finishes

        expect(ctrl.helpers.updateScope.calls.length).toEqual(2);  // it updates the scope after the async finishes

      });

    });


    describe('setCurrentTestSet', function() {

      it('changes the currently focused test set.', function() {

        // Arrange

        createController();
        spyOn(ctrl.helpers, 'updateScope');

        // Act

        $scope.setCurrentTestSet('the best test');

        // Arrange

        expect($scope.currentWpi.testSetRef).toEqual('the best test');  // ... it updtes the wpi
        expect(ctrl.helpers.updateScope).toHaveBeenCalled();            // ... updates the scope because of it
      });

      it('does nothing if it\'s already set.', function() {

        // Arrange

        createController();
        spyOn(ctrl.helpers, 'updateScope');

        // Act

        $scope.setCurrentTestSet($scope.currentWpi.testSetRef); // the existing value

        // Arrange

        expect($scope.currentWpi.testSetRef).toEqual($scope.currentWpi.testSetRef);  // no change
        expect(ctrl.helpers.updateScope).not.toHaveBeenCalled();                     // no point to update since it may have a network/performance hit
      });
    });



  });

});