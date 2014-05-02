'use strict';

// Problem: in a conventional web app, if I want to focus an input, I can do it in a couple lines of code.
// How do I do it in angularjs? This seems exceedingly complicated and untuitive. Am I missing something?

// http://stackoverflow.com/questions/14833326/how-to-set-focus-in-angularjs

// <input type="text" focus-me="focusThisInput">
angular.module('QaRally')
  .directive('psFocusMe', [ '$timeout', '$parse', function($timeout, $parse) {
    return {
      link: function(scope, element, attrs) {

        // attrs.focusMe equals 'focusThisInput'
        // parsing it returns an observable object pointing to $scope['focusThisInput'] if I understand it correctly.
        var model = $parse(attrs.focusMe);

        // Watch can take a string to watch a property on scope, or an observable as we do here.
        // Here we are watching for changes of $scope['focusThisInput']
        scope.$watch(model, function(newValue) {
          if(newValue) {
            $timeout(function() {
              element[0].focus();
            });
          }
        });
      }
    };
  }]);
