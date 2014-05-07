'use strict';

// Fake Responses from Wpi Service.

// Used as expected results for testing Wpi Service.

// Used as inputs for testing consumers of Wpi Service.

// The data lines up with window.rallyServiceFakes (inputs from rallyServiceFakes yield these results).

window.wpiServiceFakes = {
  create: function() {
    return {

      createWpi: {
        id: "0.123456",
        label: 'My WPI',
        workspaceRef: undefined,
        projectRef: undefined,
        iterationRef: undefined,
        testSetRef: undefined,
        buildNumber: undefined,
        filter: {
          nameContains: '',
          withoutTestFolder: false,
          withoutWorkProduct: false,
          workProducts: {},
          testFolders: {}
        }
      },

      refreshTestSets: {
        "id": "0.123456", 
        "label": "My WPI", 
        "workspaceRef": "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab",
        "projectRef": "https://rally1.rallydev.com/slm/webservice/v3.0/project/d0e34bc7-55c0-4757-857d-6be2604a6c6c", 
        "iterationRef": "https://rally1.rallydev.com/slm/webservice/v3.0/iteration/1becc454-eca1-4b00-ae02-fcdf8cade4d5", 
        "testSetRef": "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da", 
        "testSets": {
          "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da": {
            "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da", 
            "name": "My Test Set"
          }
        }, 
        "filter": {
          "nameContains": "", 
          "testFolders": {}, 
          "withoutTestFolder": false, 
          "withoutWorkProduct": false, 
          "workProducts": {}
        } 
      },

      getList: {
        "0.123456": {
        "id": "0.123456", 
        "label": "My WPI", 
        "workspaceRef": "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab",
        "projectRef": "https://rally1.rallydev.com/slm/webservice/v3.0/project/d0e34bc7-55c0-4757-857d-6be2604a6c6c", 
        "iterationRef": "https://rally1.rallydev.com/slm/webservice/v3.0/iteration/1becc454-eca1-4b00-ae02-fcdf8cade4d5", 
        "testSetRef": "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da", 
        "testSets": {
          "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da": {
            "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da", 
            "name": "My Test Set"
          }
        }, 
        "filter": {
          "nameContains": "", 
          "testFolders": {}, 
          "withoutTestFolder": false, 
          "withoutWorkProduct": false, 
          "workProducts": {}
        } 
      }
    },

    getCurrentId: "0.123456",

    };    
  }
};
