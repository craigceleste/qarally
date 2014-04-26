'use strict';

// Problem: in a conventional web app, if I want to focus an input, I can do it in a couple lines of code.
// How do I do it in angularjs? This seems exceedingly complicated and untuitive. Am I missing something?

// http://stackoverflow.com/questions/14833326/how-to-set-focus-in-angularjs

// <input type="text" focus-me="focusThisInput">
angular.module('qa-rally').directive('focusMe', function($timeout, $parse) {
  return {
    link: function(scope, element, attrs) {
      var model = $parse(attrs.focusMe);
      scope.$watch(model, function(newValue) {
        if(newValue) {
          $timeout(function() {
            element[0].focus();
          });
        }
      });
    }
  };
});
