'use strict';

// I'm not so much unit testing third party stuff,
// as asserting my understanding of it.

// This is just a place to make sure I understand how different functions work and try them in different browsers.

describe('AngularJS', function(){

  describe('$q', function(){

    // Unit under test
    var $q;

    // DI's
    var $rootScope;

    beforeEach(function() {
      inject(function(_$q_, _$rootScope_){
        $q = _$q_;
        $rootScope = _$rootScope_;
      });
    });

    it('works as I expect for a successful promise.', function() {

      // -- service: creates a deferred object and returns it's promise.

      var deferred = $q.defer();
      var returnedPromise = deferred.promise;

      // -- consumer: uses the promise by registering callbacks.

      var p1resolved;
      var p1denied;
      returnedPromise.then(
        function(data) { p1resolved = data; },
        function(data) { p1denied = data; }
        );

      // -- service: some time later, the service resolves the promise.

      deferred.resolve('GOOD');
      $rootScope.$apply();

      // expectations

      expect(p1resolved).toEqual('GOOD');
      expect(p1denied).not.toBeDefined();

    });

    it('works as I expect for a rejected promise.', function() {

      // -- service: manages a deferred.

      var deferred = $q.defer();
      var returnedPromise = deferred.promise;

      // -- consumer: uses the promise by registering callbacks.

      var p1resolved;
      var p1denied;
      returnedPromise.then(
        function(data) { p1resolved = data; },
        function(data) { p1denied = data; }
        );

      // -- service: some time later, it rejects the promise

      deferred.reject('BAD');
      $rootScope.$apply();

      // expectations

      expect(p1resolved).not.toBeDefined();
      expect(p1denied).toEqual('BAD');

    });

    it('rejections bubble up.', function() {

      // -- service: if a service creates a deferred object...

      var deferred1 = $q.defer();
      var internalPromise = deferred1.promise;

      // -- service: ...and uses that promise internally (does not return it) but returns a promise only with a success path...

      var p1resolved;
      var returnedPromise = internalPromise.then(
        function(data) { p1resolved = data; }
//        function(data) { p1denied = data; }                  <-- ...second promise has no rejection handler
        );

      // -- consumer: ...and the consumer handles the reject path as well as success...

      var p2resolved;
      var p2denied;
      returnedPromise.then(
        function(data) { p2resolved = data; },
        function(data) { p2denied = data; }
        );

      // -- service: ...and the inner promise fails...

      deferred1.reject('BAD');
      $rootScope.$apply();

      // -- consumer: ...will the failure pass through the second promise which has no reject path? Yes.

      expect(p1resolved).not.toBeDefined();
      expect(p2resolved).not.toBeDefined();
      expect(p2denied).toEqual('BAD');

      // conclusion: I can write multi-layer promise handling and don't need to pass $http failures up to the UI.
      // failures anywhere along the chain will bubble up to the top. Nice.

    });

  });
});

