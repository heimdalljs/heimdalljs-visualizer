import Ember from 'ember';
// import require from 'require';
// Import the D3 packages we want to use
// import gFlameGraph from '../../vendor/shims/d3-flame-graphs';
// import gFlameGraph from 'npm:d3-flame-graphs';
// const gFlameGraph = require('d3-flame-graphs/dist/d3-flame-graph');
// import d3 from 'd3';
// import FlameGraph from '../utils/d3-flame-graphs-v4/d3-flame-graph';

const { run, get, inject } = Ember;

export default Ember.Component.extend({
  classNames: ['flame-graph1'],
  graph: inject.service(),
  flameGraph: null,

  init() {
    this._super(...arguments);

    this._graphData = null;
  },

  didReceiveAttrs() {
    this._scheduleDraw();
  },

  // didInsertElement() {
  //   this._scheduleDraw();
  // },

  _scheduleDraw() {
    // let graphData = get(this, 'graphData');
    let graphData = get(this, 'graph.graph');

    if (this._lastGraphData !== graphData && graphData) {
      run.schedule('render', this, this.drawFlame, graphData);

      this._lastGraphData = graphData;
    }
  },

  convert(rawData) {
    let child, node, subTree, _i, _len, _ref;

    node = {
      value: rawData._stats.time.self,
      name: `${rawData._label.name} (${rawData._label.broccoliPluginName})`,
      stats: rawData._stats,
      children: []
    };
    if (!rawData._children) {
      return node;
    }
    _ref = rawData._children;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      subTree = this.convert(child);
      if (subTree) {
        node.children.push(subTree);
      }
    }
    return node;
  },

  drawFlame(data) {
    let profile = this.convert(data);
    console.log('profile: ', profile);
    let indent = 0;
    let objToString = function(obj) {
      indent++;
      let str = '';
      for (let p in obj) {
        if (obj.hasOwnProperty(p) && p !== 'own') {
          if (typeof obj[p] === 'object') {
            str += '&nbsp;'.repeat(indent) + p + ': ' + (indent <= 1 ? '<br/>' : '') + objToString(obj[p]);
          } else {
            str += '&nbsp;'.repeat(indent) + p + ': ' + ((p === 'time' || p === 'self') ? Math.ceil(obj[p] / 1000000) + 'ms' : obj[p]);
            str += p !== 'count' ? '<br/>' : '';
          }
        }
      }
      indent--;
      return str;
    };

    let tooltip = function(d) {
      return "" + d.name + " <br/><br/>" + (d.value / 1000000000).toFixed(3) + "s (" + (((d.value / profile.value) * 100).toFixed(2)) + "% of total)<br/>" +
        objToString(d.stats);
    };

    this.flameGraph = new d3.flameGraph('#d3-flame-graph-v3', profile, true)
      .size([1343, 640])
      .cellHeight(20)
      .zoomEnabled(true)
      .zoomAction(function(node, event) {
        return console.log(node, event);
      }).tooltip(tooltip).render();
  }
});
