'use strict';

// I'm not so much unit testing third party stuff,
// as asserting my understanding of it.

// This is just a place to make sure I understand how different functions work and try them in different browsers.

describe('Underscore', function(){

  // TODO how to inject it?
  var _ = window._;

  describe('extend', function(){

    it('is a deep copy.', function() {

      var a = { b: { c: 'a fine chanel.'}};

      var b = _.extend({}, a);

      expect(b.b.c).toEqual(a.b.c);

    });
  });
});

