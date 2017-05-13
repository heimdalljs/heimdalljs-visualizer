import Ember from 'ember';
import FlameGraph from '../utils/d3-flame-graphs-v4/d3-flame-graph';

const { run, get, inject } = Ember;

export default Ember.Component.extend({
  classNames: ['flame-graph'],
  graph: inject.service(),
  flameGraph: null,
  totalTime: Ember.computed.alias('graph.data.summary.totalTime'),

  init() {
    this._super(...arguments);

    this._graphData = null;
  },

  didReceiveAttrs() {
    this._scheduleDraw();
  },

  _scheduleDraw() {
    let graphData = get(this, 'graph.graph');

    if (this._lastGraphData !== graphData && graphData) {
      run.schedule('render', this, this.drawFlame, graphData);

      this._lastGraphData = graphData;
    }
  },

  formatTime(ms) {
    if (ms > 1000000000) {
      return (Math.round(ms / 1000000000 * 100) / 100).toFixed(1) + 's';
    } else if (ms > 1000000) {
      return (Math.round(ms / 1000000 * 100) / 100).toFixed(0) + 'ms';
    } else {
      return (Math.round(ms / 1000000 * 100) / 100).toFixed(1) + 'ms';
    }
  },

  convert(rawData) {
    let child, node, subTree, _i, _len, _ref;

    node = {
      value: rawData._stats.time.self,
      treeValue: rawData._stats.time.self,
      name: rawData._label.name + (rawData._label.broccoliPluginName ? ' (' + rawData._label.broccoliPluginName + ')' : ''),
      stats: rawData._stats,
      children: []
    };
    if (!rawData._children) {
      return node;
    }

    let treeValue = node.treeValue;
    _ref = rawData._children;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      subTree = this.convert(child);
      if (subTree) {
        node.children.push(subTree);
      }
      treeValue += subTree.treeValue;
    }
    node.treeValue = treeValue;
    node.time = this.formatTime(node.treeValue);
    node.percent = ((node.treeValue / this.get('totalTime')) * 100).toFixed(1) + "%";
    return node;
  },

  drawFlame(data) {
    let _this = this;
    let profile = this.convert(data);

    let indent = -1;
    let objToString = function(obj) {
      indent++;
      let str = '';
      let pad = "&nbsp;";
      for (let p in obj) {
        if (obj.hasOwnProperty(p) && p !== 'own') {
          if (typeof obj[p] === 'object') {
            if (p !== 'time') {
              let padded = p + pad.repeat(13).substring(0, pad.length * 13 - p.length * 6);
              str += '&nbsp;'.repeat(indent) + padded + (indent <= 0 ? '<br/>' : '') + objToString(obj[p]);
            }
          } else {
            if (p === 'count') {
              let padded = pad.repeat(5).substring(0, pad.length * 5 - obj[p].toString().length * 6) + obj[p];
              str += padded;
            } else if (p === 'time') {
              let time = _this.formatTime(obj[p]);
              let padded = ' ' + pad.repeat(8).substring(0, pad.length * 8 - time.length * 6) + time + '<br/>';
              str += padded;
            }
          }
        }
      }
      indent--;
      return str;
    };

    let tooltip = function(d) {
      let time = _this.formatTime(d.data.treeValue);
      let percent = " [" + (((d.data.treeValue / _this.get('totalTime')) * 100).toFixed(1)) + "%]";
      let self = " (self: " + _this.formatTime(d.data.stats.time.self) + ")";
      let res = d.data.name + "<br/>" + time + percent + self + "<br/>" + objToString(d.data.stats);
      return res;
    };

    let clientHeight = document.getElementsByClassName('flame-graph')[0].clientHeight;
    clientHeight -= clientHeight % 20;
    let clientWidth = document.getElementsByClassName('flame-graph')[0].clientWidth;

    this.flameGraph = new FlameGraph('#d3-flame-graph', profile, true)
      .size([clientWidth, clientHeight])
      .cellHeight(20)
      .zoomEnabled(true)
      .zoomAction((node, event) => console.log('Zoom: ', node, event))
      .labelFunction(d => d.data.name + ' [' + d.data.time + ' / ' + d.data.percent + ']')
      .tooltip(tooltip).render();
  }
});
