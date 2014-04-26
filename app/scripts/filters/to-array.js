'use strict';

// angularjs's orderBy filter does not work on objects (only arrays).
// This filter converts an object to an array, to be chained with orderBy.

angular.module('qa-rally').filter('toArray', function(){
  return function(obj) {
    // If it's already an array, return it.
    // http://stackoverflow.com/questions/4775722/check-if-object-is-array
    if( Object.prototype.toString.call( obj ) === '[object Array]' ) {
      return obj;
    }

    // Mainly looking for null, undefined
    if (!obj) {
      return [];
    }

    // There are edge cases. I don't care.
    return window._.map(obj, function(item){ return item; });
  };
});
