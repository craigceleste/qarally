'use strict';

describe('Controller RunTestCases', function() {

  // Unit under test
  var ctrl;

  // Dependency Injections
  var $controller, $q, $location, $rootScope, $scope, $timeout, $sce, settingsSvc, wpiSvc, rallySvc;

  // Fakes
  var rallyFakes; // inputs
  var wpiFakes;   // inputs

  // experiment: be aggressive about not using real service methods (force mocks), but spyOn will throw if we try to mock a method that doesn't exist.
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

    // Create fake factories

    rallyFakes = window.rallyServiceFakes.create();
    wpiFakes = window.wpiServiceFakes.create();

  });


  // Tests in this 'describe' sub-section will create the controller manually
  describe('initialization', function() {

    describe('', function() {

      // where I need to set up bad inputs per test
    });
    
    describe('', function() {
      beforeEach(function() {

        spyOn(settingsSvc, 'get')            .andReturn('the settings');

        spyOn(wpiSvc, 'getList')             .andReturn(wpiFakes.getList);
        spyOn(wpiSvc, 'getCurrentId')        .andReturn(wpiFakes.getCurrentId);
        spyOn(wpiSvc, 'wpiIsValid')          .andReturn(true);

        spyOn(rallySvc, 'initTestSetDetails').andReturn($q.when(rallyFakes.initTestSetDetails));

        $scope = $rootScope.$new();
        ctrl = $controller('RunTestCases', { $scope: $scope });

      });

      it('loads the wpi list.', function() {
        expect($scope.wpiList).toEqual(wpiFakes.getList);
      });

      it('loads the user settings.', function() {
        expect($scope.preferences).toEqual('the settings');
      });

      it('loads the currentWpi.', function() {
        expect($scope.wpiCurrentId).toEqual(wpiFakes.getCurrentId);
        expect($scope.currentWpi)  .toEqual($scope.wpiList[wpiFakes.getCurrentId]);
      });

    });




  });

});