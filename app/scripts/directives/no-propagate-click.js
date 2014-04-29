'use strict';

// Meant to work like ng-click, but to stopPropagation first.

angular.module('qa-rally')
  .directive('psNopropClick', ['$parse', function($parse) {
    return {
      link: function(scope, element, attr) {
        var fn = $parse(attr.psNopropClick);
        element.on('click', function(event) {
          event.stopPropagation();
          scope.$apply(function() {
            fn(scope, {$event:event});
          });
        });
      }
    };
  }]);
