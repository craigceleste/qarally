'use strict';

// Intercept responses from Rally to centralize error handling.

angular.module('QaRally')
  .factory('RallyErrorHandler', ['$q', '$log', function($q, $log){

    // TODO: IMPORTANT, this is hugely fragile. How do I hook it up just to Rally requests, without knowledge about the URL's?
    // I need to identify which requests are directly to Rally.

    var rallyUrl = 'https://rally1.rallydev.com';

    // TODO inject it
    var _ = window._;
    
    return {

      // On successful responses from Rally (status 200 with json), look for logical errors.
      'response': function(response) {

        // Skip $http requests not to the Rally service.
        if (response.config.url.indexOf(rallyUrl) !== 0) {
          return response;
        }

        $log.info(response.config.url, response);

        // Rally returns errors in the format:
        // response.data = {
        //   "someKey": { Errors: [], Warnings: [], ...real data... }
        // }

        // Look for Errors first, then Warnings...
        var wasSuccessful = _.reduce(['Errors','Warnings'], function(result, messageType) {

          if (!result)
          {
            return result;
          }

          // Look through each top level key in response.data...
          return _.reduce(Object.keys(response.data), function(result, key) {

            if (!result) {
              return result;
            }

            if (response.data[key][messageType] && response.data[key][messageType].length) {
              $log.error('Rally Error: ' + response.data[key][messageType][0]);
              return false;
            }

            return true;
          }, true);
        }, true);

        return wasSuccessful ? response : $q.reject('Request to Rally failed. See the console for more info.');
      },

      'responseError': function(rejection) {

        $log.info(rejection);
        $log.error('A request failed. See the previously logged object for details.');

        return $q.reject('Request failed. See the console for more info.');
      }
    };

  }]);

