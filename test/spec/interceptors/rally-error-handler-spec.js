'use strict';

describe('Interceptor RallyErrorHandler', function() {

  // Unit under test
  var interceptor;

  // Dependency Injections
  var $rootScope;

  beforeEach(function(){

    module('QaRally');

    inject(function(RallyErrorHandler){
      interceptor = RallyErrorHandler;
    });

    inject(function(_$rootScope_) {
      $rootScope = _$rootScope_;
    });
  });

  it('is wired correctly.', function(){

    expect(interceptor).toBeDefined();

  });

  describe('response', function() {

    it('ignores non-rally URLs.', function() {

      // Arrange

      var responseIn = {
        config: {
          url: 'https://NOT-RALLY/whatever'
        }
      };

      // Act

      var responseOut = interceptor.response(responseIn);

      // Assert

      expect(responseOut).toBe(responseIn);
    });

    it('replaces response with a rejection promise if a logical Rally error is encountered.', function() {

      // Arrange

      var responseIn = {
        config: {
          url: 'https://rally1.rallydev.com/whatever'
        },
        data: {
          'QueryResult': {
            'Errors': ['It\'s bad man.'],

            'OtherStuff': 'Is ignored'
          },
          'And': 'Is ignored'
        }
      };

      // Act

      var data, rejection;
      interceptor.response(responseIn)
        .then(
          function(d) { data = d; },
          function(r) { rejection = r; });

      $rootScope.$apply();

      // Assert

      expect(data).not.toBeDefined();
      expect(typeof rejection).toEqual('string');
    });

    it('replaces response with a rejection promise if a logical Rally warning is encountered.', function() {

      // Arrange

      var responseIn = {
        config: {
          url: 'https://rally1.rallydev.com/whatever'
        },
        data: {
          'QueryResult': {
            'Warnings': ['It\'s bad man.']
          }
        }
      };

      // Act

      var data, rejection;
      interceptor.response(responseIn)
        .then(
          function(d) { data = d; },
          function(r) { rejection = r; });

      $rootScope.$apply();

      // Assert

      expect(data).not.toBeDefined();
      expect(typeof rejection).toEqual('string');
    });

    it('passes back the result for successful Rally requests.', function() {

      // Arrange

      var responseIn = {
        config: {
          url: 'https://rally1.rallydev.com/whatever'
        },
        data: {
          'QueryResult': {
            'No errors': 'or warnings!'
          }
        }
      };

      // Act

      var responseOut = interceptor.response(responseIn);

      // Assert

      expect(responseOut).toBe(responseIn);
    });

  });

  describe('responseError', function() {

    it('normalizes technical rejections like $http errors.', function() {
      // Arrange

      var rejectionIn = { whatever: 'happened' };

      // Act
      var data, rejectionOut;
      interceptor.responseError(rejectionIn)
        .then(
          function(d) { data = d; },
          function(r) { rejectionOut = r; });

      $rootScope.$apply();

      // Assert

      expect(data).not.toBeDefined();
      expect(typeof rejectionOut).toEqual('string'); // object passed in is replaced with an error message.

    });

  });

});
