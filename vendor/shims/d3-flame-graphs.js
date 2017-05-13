(function() {
  function vendorModule() {
    'use strict';

    return { 'default': self['d3-flame-graphs'] };
  }

  define('d3-flame-graphs', [], vendorModule);
})();
