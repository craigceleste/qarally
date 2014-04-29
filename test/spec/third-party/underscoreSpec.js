'use strict';

// I'm not so much unit testing third party stuff,
// as asserting my understanding of it.

// This is just a place to make sure I understand how different functions work and try them in different browsers.

describe('Underscore', function(){

  // TODO how to inject it?
  var _ = window._;

  describe('extend', function(){

    it('is a deep copy, not a deep clone.', function() {

      var a = {
        test: { property: 'value' }
      };

      var b = _.extend({}, a);          // should copy .test to b
      a.test.property = 'different';    // but does it copy a reference to 'test' or clone 'test'?

      expect(b.test.property).toEqual('different');
      expect(a.test.property).toEqual('different'); // it is a reference. I can't use this for deep cloning stuff. :(

    });
  });
});

