'use strict';

// When you hover over this element, another element gets a hint.
// Use case: hover over TC in the left side nav area, the label above the nav area gets the title of the TC.
angular.module('qa-rally')
  .directive('hoverHint', [function() {
    return {
      link: function(scope, element, attr) {

        // <div hover-hint="{
        //    '#targetDiv': model.HintText
        // }"

        // rules key: query (#myDiv) to the element that gets the hint
        // rules value: the text ('My Model Name') that goes into the text of that target element

        var rules = scope.$eval(attr.hoverHint);
        if (!rules)
        {
          return;
        }

        // remember the original value here
        // (it is expected to be a static label at this point)
        var originalValue = {};
        for(var query in rules) {
          originalValue[query] = angular.element(query).text();
        }

        // When we hover enter <div hover-hint> we set the text to #myDiv
        element.mouseenter(function() {
          for(var query in rules) {
            angular.element(query).text(rules[query]);
          }
        });

        // restore the original text on leave
        element.mouseleave(function() {
          for(var query in rules) {
            angular.element(query).text(originalValue[query]);
          }
        });
      }
    };
  }]);
