/*jshint node:true*/
/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var MergeTrees = require('broccoli-merge-trees');
var path = require('path');
var Funnel = require('broccoli-funnel');

module.exports = function(defaults) {
  var flameTree = new Funnel(path.dirname(require.resolve('d3-flame-graphs/dist/d3-flame-graph.js')), {
    files: ['d3-flame-graph.js', 'd3-flame-graph.css'],
    destDir: 'd3-flame-graphs'
  });

  var tipTree = new Funnel(path.dirname(require.resolve('d3-tip/index.js')), {
    files: ['index.js'],
    destDir: 'd3-tip'
  });

  var app = new EmberApp(defaults, {
    // Add options here
    vendorFiles: {
      'jquery.js': null
    },
    trees: {
      vendor: new MergeTrees([
        'node_modules/heimdalljs-graph',
        'node_modules/bulma',
        'vendor/shims',
        tipTree,
        flameTree,
      ], { overwrite: true })
    }
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  app.import('vendor/dist/amd/heimdalljs-graph.js');

  app.import('vendor/d3-flame-graphs/d3-flame-graph.js', {
    using: [
      { transformation: 'amd', as: 'd3-flame-graph' }
    ]
  });
  app.import('vendor/d3-flame-graphs/d3-flame-graph.css');
  app.import('vendor/d3-tip/index.js', {
    using: [
      { transformation: 'amd', as: 'd3-tip' }
    ]
  });
  app.import('vendor/css/bulma.css');
  return app.toTree();
};
