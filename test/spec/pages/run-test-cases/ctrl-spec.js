'use strict';

describe('Controller RunTestCases', function() {

  // Unit under test
  var ctrl;

  // Dependency Injections
  var $controller, $q, $window, $location, $rootScope, $scope, $timeout, $sce, settingsSvc, wpiSvc, rallySvc;

  // Fakes
  var rallyFakes;
  var wpiFakes;
  var fakeSettings, fakeWpiIsValid;

  // experiment:
  //    be aggressive about not using real service methods (force using mocks).
  //    by replacing all methods on a service with a 'throw' statement, we ensure that:
  //      a) if tests forget to spyOn the method, they don't accidentally use a service method.
  //      b) if a service drops a method, our spyOn calls will fail because the method doesn't exist
  //          (as opposed to us making a mock with a similar interface and a bunch of empty methods)
  function cleanService(service) {
    angular.forEach(Object.keys(service), function(key) {
      if (typeof service[key] === 'function') {
        service[key] = function() { throw key + ' was called without mock.'; };
      }
    });
    return service;
  }


  beforeEach(function(){

    // Load app

    module('QaRally');

    // Get a reference to the services. clean our private ones (use third party services)

    inject(function(_$controller_, _$window_, _$q_, _$location_, _$rootScope_, _$timeout_, _$sce_, Settings, Wpi, Rally) {

      $window = _$window_;
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

    // Initialize DEFAULT fake data: tests will overwrite this happy-path per test.

    rallyFakes = window.rallyServiceFakes.create();
    wpiFakes = window.wpiServiceFakes.create();
    fakeSettings = {};
    fakeWpiIsValid = true;

  });

  // REVIEW (deviates from angular's best practices, I guess)
  // In order to adjust the fake data INSIDE EACH TEST, before injection into the ctrl,
  // the ctrl needs to be created in each test (not beforeEach test).
  // This is the helper that sets up the mocks.

  function createController() {

    // Initialize mocks

    spyOn(settingsSvc, 'get')             .andReturn(fakeSettings);
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

    // Create unit under test

    $scope = $rootScope.$new();
    ctrl = $controller('RunTestCases', { $scope: $scope });

    // Initialization has some async steps. Resolve them here.

    $rootScope.$apply();
  }

  describe('initialization', function() {

    describe('of the happy path', function() {

      // The "happy path" is the baseline test with no additional changes to fake inputs.

      beforeEach(function(){
        createController();
      });

      it('adds the settings to the scope.', function() {
        expect($scope.settings).toEqual(fakeSettings);
      });

      it('adds the wpiList to the scope.', function() {
        expect($scope.wpiList).toEqual(wpiFakes.getList);
      });

      it('adds the current wpi to the scope.', function() {
        expect($scope.wpiCurrentId).toEqual(wpiFakes.getCurrentId);
        expect($scope.currentWpi).toEqual(wpiFakes.getList[wpiFakes.getCurrentId]);
      });

      it('adds the test set details to the scope.', function() {
        expect($scope.testSetDetails).toEqual(rallyFakes.initTestSetDetails);
      });

      it('does not redirect away from the page.', function() {
        expect($location.url).not.toHaveBeenCalled();
      });

    });

    it('with invalid WPI, redirects to Manage WPI form.', function() {

      // Arrange
      wpiFakes.getList = {};
      wpiFakes.getCurrentId = undefined;
      fakeWpiIsValid = false;

      // Act
      createController();

      // Assert
      expect($location.url).toHaveBeenCalledWith('/manage-wpi');
    });

    it('with valid WPI that has no test sets, leaves the testSetDetails unset.', function() {

      // Arrange
      delete wpiFakes.getList[wpiFakes.getCurrentId].testSetRef;

      // Act
      createController();

      // Assert
      expect($scope.testSetDetails).not.toBeDefined();
    });

    it('adds watch to save changes to settings.', function() {

      // Arrange
      createController();

      // Act
      $scope.settings.something = 'whatever';
      $rootScope.$apply();

      // Assert
      expect(settingsSvc.set).toHaveBeenCalledWith($scope.settings);
    });

    it('adds watch to save changes to wpiList.', function() {

      // Arrange
      createController();

      // Act
      $scope.wpiList[wpiFakes.getCurrentId].something = 'whatever';
      $rootScope.$apply();

      // Assert
      expect(wpiSvc.setList).toHaveBeenCalledWith($scope.wpiList);
    });

    it('adds watch to save changes to filter textbox.', function() {

      // Arrange
      createController();
      spyOn(ctrl.helpers, 'updateFilters');

      // Act
      $scope.currentWpi.filter.nameContains = 'something new';
      $rootScope.$apply();

      // Assert
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();
    });

    it('adds the build number in dev environment', function() {
      $window.qarallyBuildNumber = undefined; // we don't set it in dev
      createController();
      expect($scope.build).toEqual('unbuilt');
    });

    it('adds the build number in production', function() {
      $window.qarallyBuildNumber = 44; // the build process appends to the bundle: var qarallyBuildNumber = 44;
      createController();
      expect($scope.build).toEqual('build 44');
    });
  });

  describe('updateFilters', function() {

    var filter;
    var tcNormal, tcWithoutTestFolder, tcWithoutWorkProduct, tcAltTestFolder, tcAltWorkProduct;

    beforeEach(function() {

      // Fake data gets 5 TC's with different filterable properties

      tcNormal             = rallyFakes.initTestSetDetails.testCases[0]; // the default fake data

      tcWithoutTestFolder  = angular.fromJson(angular.toJson(tcNormal)); // cloned and altered
      tcWithoutTestFolder.id = '1';
      delete tcWithoutTestFolder.TestFolderRef;
      rallyFakes.initTestSetDetails.testCases.push(tcWithoutTestFolder);

      tcWithoutWorkProduct = angular.fromJson(angular.toJson(tcNormal));
      tcWithoutWorkProduct.id = '2';
      delete tcWithoutWorkProduct.WorkProductRef;
      rallyFakes.initTestSetDetails.testCases.push(tcWithoutWorkProduct);

      tcAltTestFolder      = angular.fromJson(angular.toJson(tcNormal));
      tcAltTestFolder.id = '3';
      tcAltTestFolder.TestFolderRef = 'alternate value';
      rallyFakes.initTestSetDetails.testCases.push(tcAltTestFolder);

      tcAltWorkProduct      = angular.fromJson(angular.toJson(tcNormal));
      tcAltWorkProduct.id = '4';
      tcAltWorkProduct.WorkProductRef = 'alternate value';
      rallyFakes.initTestSetDetails.testCases.push(tcAltWorkProduct);

      tcNormal.WorkProductRef = 'filter wp';
      tcNormal.TestFolderRef = 'filter tf';
      tcNormal.Name = 'Contains TEST PHRASE in the name';

      createController();

      filter = $scope.wpiList[wpiFakes.getCurrentId].filter;
      expect(filter).toBeDefined(); // sanity check
    });

    it('accepts everything with default filter.', function() {
      // Arrange

      // Act
      ctrl.helpers.updateFilters();

      // Assert
      expect(tcNormal            ._isFiltered).toEqual(false);
      expect(tcWithoutTestFolder ._isFiltered).toEqual(false);
      expect(tcWithoutWorkProduct._isFiltered).toEqual(false);
      expect(tcAltTestFolder     ._isFiltered).toEqual(false);
      expect(tcAltWorkProduct    ._isFiltered).toEqual(false);

      expect($scope.filteredCount).toEqual(0);
      expect($scope.filterColor).not.toBeDefined();
    });

    it('can filter withoutWorkProducts.', function() {
      // Arrange
      filter.withoutWorkProduct = true;

      // Act
      ctrl.helpers.updateFilters();

      // Assert
      expect(tcNormal            ._isFiltered).toEqual(false);
      expect(tcWithoutTestFolder ._isFiltered).toEqual(false);
      expect(tcWithoutWorkProduct._isFiltered).toEqual(true);
      expect(tcAltTestFolder     ._isFiltered).toEqual(false);
      expect(tcAltWorkProduct    ._isFiltered).toEqual(false);

      expect($scope.filteredCount).toEqual(1);
      expect($scope.filterColor).toEqual('green');
    });

    it('can filter withoutTestFolder.', function() {
      // Arrange
      filter.withoutTestFolder = true;

      // Act
      ctrl.helpers.updateFilters();

      // Assert
      expect(tcNormal            ._isFiltered).toEqual(false);
      expect(tcWithoutTestFolder ._isFiltered).toEqual(true);
      expect(tcWithoutWorkProduct._isFiltered).toEqual(false);
      expect(tcAltTestFolder     ._isFiltered).toEqual(false);
      expect(tcAltWorkProduct    ._isFiltered).toEqual(false);

      expect($scope.filteredCount).toEqual(1);
      expect($scope.filterColor).toEqual('green');
    });

    it('can filter by work product.', function() {
      // Arrange
      filter.workProducts['filter wp'] = true;

      // Act
      ctrl.helpers.updateFilters();

      // Assert
      expect(tcNormal            ._isFiltered).toEqual(true);
      expect(tcWithoutTestFolder ._isFiltered).toEqual(false);
      expect(tcWithoutWorkProduct._isFiltered).toEqual(false);
      expect(tcAltTestFolder     ._isFiltered).toEqual(false);
      expect(tcAltWorkProduct    ._isFiltered).toEqual(false);

      expect($scope.filteredCount).toEqual(1);
      expect($scope.filterColor).toEqual('green');
    });

    it('can filter by test folder.', function() {
      // Arrange
      filter.testFolders['filter tf'] = true;

      // Act
      ctrl.helpers.updateFilters();

      // Assert
      expect(tcNormal            ._isFiltered).toEqual(true);
      expect(tcWithoutTestFolder ._isFiltered).toEqual(false);
      expect(tcWithoutWorkProduct._isFiltered).toEqual(false);
      expect(tcAltTestFolder     ._isFiltered).toEqual(false);
      expect(tcAltWorkProduct    ._isFiltered).toEqual(false);

      expect($scope.filteredCount).toEqual(1);
      expect($scope.filterColor).toEqual('green');
    });

    it('can filter by name.', function() {
      // Arrange
      filter.nameContains = 'test phrase';

      // Act
      ctrl.helpers.updateFilters();

      // Assert
      expect(tcNormal            ._isFiltered).toEqual(false);
      expect(tcWithoutTestFolder ._isFiltered).toEqual(true);
      expect(tcWithoutWorkProduct._isFiltered).toEqual(true);
      expect(tcAltTestFolder     ._isFiltered).toEqual(true);
      expect(tcAltWorkProduct    ._isFiltered).toEqual(true);

      expect($scope.filteredCount).toEqual(4);
      expect($scope.filterColor).toEqual('green');
    });

    it('can filter by name gracefully ignores null name.', function() {
      // Arrange
      filter.nameContains = 'test phrase';
      delete tcWithoutTestFolder.Name;

      // Act
      ctrl.helpers.updateFilters();

      // Assert
      expect(tcNormal            ._isFiltered).toEqual(false);
      expect(tcWithoutTestFolder ._isFiltered).toEqual(true);
      expect(tcWithoutWorkProduct._isFiltered).toEqual(true);
      expect(tcAltTestFolder     ._isFiltered).toEqual(true);
      expect(tcAltWorkProduct    ._isFiltered).toEqual(true);

      expect($scope.filteredCount).toEqual(4);
      expect($scope.filterColor).toEqual('green');
    });

    it('will set filterColor to red if all TCs are filtered.', function() {
      // Arrange
      filter.nameContains = 'NONE OF THEM MATCH IT';

      // Act
      ctrl.helpers.updateFilters();

      // Assert
      expect(tcNormal            ._isFiltered).toEqual(true);
      expect(tcWithoutTestFolder ._isFiltered).toEqual(true);
      expect(tcWithoutWorkProduct._isFiltered).toEqual(true);
      expect(tcAltTestFolder     ._isFiltered).toEqual(true);
      expect(tcAltWorkProduct    ._isFiltered).toEqual(true);

      expect($scope.filteredCount).toEqual(5);
      expect($scope.filterColor).toEqual('red');
    });

  });


  describe('getLength', function() {

    beforeEach(function(){
      createController();
    });

    it('of undefined equals 0.',                   function() { expect( $scope.getLength(undefined))          .toEqual(0); });
    it('of empty object equals 0.',                function() { expect( $scope.getLength({}))                 .toEqual(0); });
    it('of an array, returns the length.',         function() { expect( $scope.getLength([1,2,3]))            .toEqual(3); });
    it('of actual object returns number of keys.', function() { expect( $scope.getLength({ a: 'A', b: 'B' })) .toEqual(2); });

  });


  describe('openManageWpiForm', function() {

    it('to navigate to the Manage WPI page.', function() {

      createController();

      $scope.openManageWpiForm();

      expect($location.url).toHaveBeenCalledWith('/manage-wpi');

    });

  });


  describe('wpiIsValid', function() {

    it('is a dumb passthrough.', function() {

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

      $scope.wpiCurrentId = 'something';      // blank 'em out. They should get reset
      $scope.currentWpi = undefined;
      spyOn(ctrl.helpers, 'refreshTestSetDetails');

      // Act

      $scope.setCurrentWpi('0.987654');

      // Assert

      expect(wpiSvc.setCurrentId).wasCalledWith('0.987654');      // it should push it to the service
      expect($scope.wpiCurrentId).toEqual(wpiFakes.getCurrentId); // but it should update wit a get to the service (in case the service rejected it or tranformed it)
      expect($scope.currentWpi).toEqual($scope.wpiList[$scope.wpiCurrentId]);
      expect(ctrl.helpers.refreshTestSetDetails).toHaveBeenCalled();
    });

  });


  describe('refreshTestSets', function() {

    it('asynchronously loads the test set details.', function() {

      // Arrange

      createController();
      spyOn(ctrl.helpers, 'refreshTestSetDetails');

      // Act

      $scope.refreshTestSets();

      // Assert

      expect($scope.testSetDetails).not.toBeDefined(); // it should clear the test case list
      expect(wpiSvc.refreshTestSets).toHaveBeenCalledWith($scope.currentWpi);

      $rootScope.$apply(); // resolve $q promises

      expect(ctrl.helpers.refreshTestSetDetails).toHaveBeenCalled();
    });

  });


  describe('setCurrentTestSet', function() {

    var clone;
    beforeEach(function() {

      // Add a second test set to the list
      var wpi = wpiFakes.getList[wpiFakes.getCurrentId];
      var ts1 = wpi.testSets[wpi.testSetRef];
      clone = angular.fromJson(angular.toJson(ts1));
      clone._ref = 'clone';
      wpi.testSets[clone._ref] = clone;

      createController();
    });

    it('changes the currently focused test set.', function() {

      // Arrange
      $scope.testSetDetails = undefined;
      spyOn(ctrl.helpers, 'refreshTestSetDetails');

      // Act
      $scope.setCurrentTestSet(clone._ref);

      // Assert

      expect($scope.currentWpi.testSetRef).toEqual(clone._ref);
      expect(wpiSvc.clearFilter).toHaveBeenCalledWith($scope.currentWpi);
      expect(ctrl.helpers.refreshTestSetDetails).toHaveBeenCalled();
    });

    it('does nothing if it\'s already set.', function() {

      // Arrange
      spyOn(ctrl.helpers, 'refreshTestSetDetails');

      // Act
      $scope.setCurrentTestSet($scope.currentWpi.testSetRef); // already current

      // Assert

      expect(ctrl.helpers.refreshTestSetDetails).not.toHaveBeenCalled();
    });
  });


  describe('toggleTestFolderFilter', function() {

    beforeEach(function() {
      createController();
      spyOn(ctrl.helpers, 'updateFilters');
    });

    it('does nothing if there is no filter.', function() {
      // Arrange
      delete $scope.currentWpi.filter;

      // Act
      $scope.toggleTestFolderFilter('tfRef');

      // Assert
      expect(ctrl.helpers.updateFilters).not.toHaveBeenCalled();
    });

    it('toggles it on.', function() {

      // Arrange
      delete $scope.currentWpi.filter.testFolders.tfRef; // redundant, but it's not set

      // Act
      $scope.toggleTestFolderFilter('tfRef');

      // Assert
      expect($scope.currentWpi.filter.testFolders.tfRef).toEqual(true);
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();
    });

    it('toggles it off.', function() {

      // Arrange
      $scope.currentWpi.filter.testFolders.tfRef = true;

      // Act
      $scope.toggleTestFolderFilter('tfRef');

      // Assert
      expect($scope.currentWpi.filter.testFolders.tfRef).not.toBeDefined();
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();
    });

  });

  describe('toggleWorkProductFilter', function() {

    beforeEach(function() {
      createController();
      spyOn(ctrl.helpers, 'updateFilters');
    });

    it('does nothing if there is no filter.', function() {
      // Arrange
      delete $scope.currentWpi.filter;

      // Act
      $scope.toggleWorkProductFilter('tfRef');

      // Assert
      expect(ctrl.helpers.updateFilters).not.toHaveBeenCalled();
    });

    it('toggles it on.', function() {

      // Arrange
      delete $scope.currentWpi.filter.workProducts.tfRef; // redundant, but it's not set

      // Act
      $scope.toggleWorkProductFilter('tfRef');

      // Assert
      expect($scope.currentWpi.filter.workProducts.tfRef).toEqual(true);
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();
    });

    it('toggles it off.', function() {

      // Arrange
      $scope.currentWpi.filter.workProducts.tfRef = true;

      // Act
      $scope.toggleWorkProductFilter('tfRef');

      // Assert
      expect($scope.currentWpi.filter.workProducts.tfRef).not.toBeDefined();
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();
    });

  });


  describe('toggleFilterTestCasesWithoutTestFolder', function() {

    var filter;

    beforeEach(function() {

      createController();
      filter = $scope.wpiList[wpiFakes.getCurrentId].filter;
      spyOn(ctrl.helpers, 'updateFilters');

    });

    it('toggles it on.', function() {

      // Arrange
      filter.withoutTestFolder = false;

      // Act

      $scope.toggleFilterTestCasesWithoutTestFolder();

      // Assert
      expect(filter.withoutTestFolder).toEqual(true);
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();

    });

    it('toggles it off.', function() {

      // Arrange
      filter.withoutTestFolder = true;

      // Act

      $scope.toggleFilterTestCasesWithoutTestFolder();

      // Assert
      expect(filter.withoutTestFolder).toEqual(false);
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();

    });

    it('do nothing if there is no filter.', function() {

      // Arrange
      delete $scope.wpiList[wpiFakes.getCurrentId].filter;

      // Act

      $scope.toggleFilterTestCasesWithoutTestFolder();

      // Assert
      expect(ctrl.helpers.updateFilters).not.toHaveBeenCalled();

    });

  });


  describe('toggleFilterTestCasesWithoutWorkProduct', function() {

    var filter;

    beforeEach(function() {

      createController();
      filter = $scope.wpiList[wpiFakes.getCurrentId].filter;
      spyOn(ctrl.helpers, 'updateFilters');

    });

    it('toggles it on.', function() {

      // Arrange
      filter.withoutWorkProduct = false;

      // Act

      $scope.toggleFilterTestCasesWithoutWorkProduct();

      // Assert
      expect(filter.withoutWorkProduct).toEqual(true);
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();

    });

    it('toggles it off.', function() {

      // Arrange
      filter.withoutWorkProduct = true;

      // Act

      $scope.toggleFilterTestCasesWithoutWorkProduct();

      // Assert
      expect(filter.withoutWorkProduct).toEqual(false);
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();

    });

    it('do nothing if there is no filter.', function() {

      // Arrange
      delete $scope.wpiList[wpiFakes.getCurrentId].filter;

      // Act

      $scope.toggleFilterTestCasesWithoutWorkProduct();

      // Assert
      expect(ctrl.helpers.updateFilters).not.toHaveBeenCalled();

    });

  });


  describe('toggleAllTestFolderFilters', function() {

    var filter;
    var folder1, folder2;

    beforeEach(function() {
      createController();

      // 2 test sets in the testSetDetails

      folder1 = { _ref: 'tf1', Name: 'Wilma' };
      folder2 = { _ref: 'tf2', Name: 'Betty' };

      $scope.testSetDetails.testFolders = { };
      $scope.testSetDetails.testFolders[folder1._ref] = folder1;
      $scope.testSetDetails.testFolders[folder2._ref] = folder2;

      // One of them is already filtered. the other is not

      filter = $scope.wpiList[wpiFakes.getCurrentId].filter;
      filter.withoutTestFolder = true;
      filter.testFolders[folder1._ref] = true; // folder2 is not filtered

      spyOn(ctrl.helpers, 'updateFilters');
    });

    it('toggles it on.', function() {

      // Arrange
      filter.withoutTestFolder = false;

      // Act
      $scope.toggleAllTestFolderFilters(true);

      // Assert
      expect(filter.withoutTestFolder).toEqual(true);
      expect(filter.testFolders[folder2._ref]).toEqual(true);
      expect(filter.testFolders[folder1._ref]).toEqual(true);
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();

    });

    it('toggles it off.', function() {

      // Arrange
      filter.withoutTestFolder = true;

      // Act
      $scope.toggleAllTestFolderFilters(false);

      // Assert
      expect(filter.withoutTestFolder).toEqual(false);
      expect(filter.testFolders[folder2._ref]).not.toBeDefined();
      expect(filter.testFolders[folder1._ref]).not.toBeDefined();
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();
    });

    it('ignores it if there is no filter.', function() {

      // Arrange
      delete $scope.wpiList[wpiFakes.getCurrentId].filter;

      // Act
      $scope.toggleAllTestFolderFilters(true);

      // Assert
      expect(ctrl.helpers.updateFilters).not.toHaveBeenCalled();

    });

    it('ignores it if there is no testSetDetails.', function() {

      // Arrange
      delete $scope.testSetDetails;

      // Act
      $scope.toggleAllTestFolderFilters(true);

      // Assert
      expect(ctrl.helpers.updateFilters).not.toHaveBeenCalled();

    });

  });


  describe('toggleAllWorkProductFilter', function() {

    var filter;
    var product1, product2;

    beforeEach(function() {
      createController();

      // 2 test sets in the testSetDetails

      product1 = { _ref: 'tf1', Name: 'Wilma' };
      product2 = { _ref: 'tf2', Name: 'Betty' };

      $scope.testSetDetails.workProducts = { };
      $scope.testSetDetails.workProducts[product1._ref] = product1;
      $scope.testSetDetails.workProducts[product2._ref] = product2;

      // One of them is already filtered. the other is not

      filter = $scope.wpiList[wpiFakes.getCurrentId].filter;
      filter.withoutWorkProduct = true;
      filter.workProducts[product1._ref] = true; // product2 is not filtered

      spyOn(ctrl.helpers, 'updateFilters');
    });

    it('toggles it on.', function() {

      // Arrange
      filter.withoutWorkProduct = false;

      // Act
      $scope.toggleAllWorkProductFilters(true);

      // Assert
      expect(filter.withoutWorkProduct).toEqual(true);
      expect(filter.workProducts[product1._ref]).toEqual(true);
      expect(filter.workProducts[product2._ref]).toEqual(true);
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();

    });

    it('toggles it off.', function() {

      // Arrange
      filter.withoutWorkProduct = true;

      // Act
      $scope.toggleAllWorkProductFilters(false);

      // Assert
      expect(filter.withoutWorkProduct).toEqual(false);
      expect(filter.workProducts[product1._ref]).not.toBeDefined();
      expect(filter.workProducts[product2._ref]).not.toBeDefined();
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();

    });

    it('ignores it if there is no filter.', function() {

      // Arrange
      delete $scope.wpiList[wpiFakes.getCurrentId].filter;

      // Act
      $scope.toggleAllWorkProductFilters(true);

      // Assert
      expect(ctrl.helpers.updateFilters).not.toHaveBeenCalled();

    });

    it('ignores it if there is no testSetDetails.', function() {

      // Arrange
      delete $scope.testSetDetails;

      // Act
      $scope.toggleAllWorkProductFilters(true);

      // Assert
      expect(ctrl.helpers.updateFilters).not.toHaveBeenCalled();

    });

  });


  describe('clearFilters', function() {
    it('uses wpiSvc and updates filters.', function() {
      // Arrange
      createController();
      spyOn(ctrl.helpers, 'updateFilters');

      // Act
      $scope.clearFilters();

      // Assert
      expect(wpiSvc.clearFilter).toHaveBeenCalledWith($scope.currentWpi);
      expect(ctrl.helpers.updateFilters).toHaveBeenCalled();
    });
  });

});