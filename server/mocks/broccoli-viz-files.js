/*jshint node:true*/
module.exports = function(app) {
  var express = require('express');

  app.use('/broccoli-viz-files', express.static(__dirname + '/broccoli-viz-files'));
};
