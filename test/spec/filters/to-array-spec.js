'use strict';

describe('Filter psToArray', function(){

  // Unit under test
  var filter;

  beforeEach(function(){
    module('QaRally');

    inject(function($injector){
      filter = $injector.get('$filter')('psToArray');
    });
  });

  it('echos back the same instance of an array.', function(){

    var myArray = [1,2,3]; // input is already an array

    expect(filter(myArray)).toBe(myArray);

  });

  it('is cool with empty arrays.', function(){

    var myArray = [];

    expect(filter(myArray)).toBe(myArray);
    
  });

  it('returns an empty array if given null or undefined.', function(){

    expect(filter(undefined)).toEqual([]);
    expect(filter(null     )).toEqual([]);

    // Technically anything falsey will get this. I don't care for now.
    expect(filter(0    )).toEqual([]);
    expect(filter(''   )).toEqual([]);
    expect(filter(false)).toEqual([]);
  });

  it ('returns properties on an object as an array, in an indeterminate order.', function() {

    var myObject = {
      a: 'something',
      b: 'different'
    };

    var result = filter(myObject);

    expect(result.length).toEqual(2);
    expect(result[0] === 'something' || result[0] === 'different').toEqual(true); // one of the 2 itmes is in the first spot
    expect(result[1] === 'something' || result[1] === 'different').toEqual(true); // one of the 2 itmes is in the second spot
  });

});
