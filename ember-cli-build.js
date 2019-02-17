'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const MergeTrees = require('broccoli-merge-trees');
const path = require('path');
const Funnel = require('broccoli-funnel');

function resolveDirname(file) {
  return path.dirname(require.resolve(file));
}

function npm(file, options) {
  return new Funnel(resolveDirname(file), options);
}

module.exports = function(defaults) {
  const flame= npm('d3-flame-graphs/dist/d3-flame-graph.js', {
    files: ['d3-flame-graph.js', 'd3-flame-graph.css'],
    destDir: 'd3-flame-graphs'
  });

  const tip= npm('d3-tip/index.js', {
    files: ['index.js'],
    destDir: 'd3-tip'
  });

  const d3 = new Funnel(__dirname + '/vendor/d3/', {
    files: ['d3.v5.js'],
    destDir: 'd3'
  });

  const app = new EmberApp(defaults, {
    trees: {
      vendor: new MergeTrees([
        resolveDirname('bulma'),
        tip,
        flame,
        d3
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

  app.import('vendor/d3/d3.v5.js');
  app.import('vendor/d3-flame-graphs/d3-flame-graph.js', { using: [{ transformation: 'amd', as: 'd3-flame-graph' }] });
  app.import('vendor/d3-flame-graphs/d3-flame-graph.css');
  app.import('vendor/css/bulma.css');

  return app.toTree();
};
