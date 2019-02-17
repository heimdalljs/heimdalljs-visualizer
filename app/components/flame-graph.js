import Ember from 'ember';
import FlameGraph from '../utils/d3-flame-graphs-v4/d3-flame-graph';

import { run } from '@ember/runloop';
import { get } from '@ember/object';
import Component from '@ember/component';
import { readOnly } from '@ember/object/computed';

const { inject } = Ember;

export default Component.extend({
  classNames: ['flame-graph'],
  graph: inject.service(),
  flameGraph: null,
  totalTime: readOnly('graph.data.summary.totalTime'),

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
    let node = {
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
    let _ref = rawData._children;
    for (let _i = 0, _len = _ref.length; _i < _len; _i++) {
      let child = _ref[_i];
      let subTree = this.convert(child);
      if (subTree) {
        node.children.push(subTree);
        treeValue += subTree.treeValue;
      }
    }
    node.treeValue = treeValue;
    node.time = this.formatTime(node.treeValue);
    node.percent = ((node.treeValue / this.get('totalTime')) * 100).toFixed(1) + "%";
    return node;
  },

  drawFlame(data) {
    let profile = this.convert(data);
    let indent = -1;

    let objToString = obj => {
      indent++;
      let str = '';
      let pad = "&nbsp;";
      for (let p in obj) {
        if (obj.hasOwnProperty(p) && p !== 'own') {
          if (typeof obj[p] === 'object') {
            if (p !== 'time' || (p === 'time' && Object.keys(obj[p]).length > 1)) {
              let padded = p + pad.repeat(13).substring(0, pad.length * 13 - p.length * 6);
              str += '&nbsp;'.repeat(indent) + padded + (indent <= 0 ? '<br/>' : '') + objToString(obj[p]);
            }
          } else {
            if (p === 'count') {
              let padded = pad.repeat(5).substring(0, pad.length * 5 - obj[p].toString().length * 6) + obj[p];
              str += padded;
            } else if (p === 'time') {
              let time = this.formatTime(obj[p]);
              let padded = ' ' + pad.repeat(8).substring(0, pad.length * 8 - time.length * 6) + time + '<br/>';
              str += padded;
            }
          }
        }
      }
      indent--;
      return str;
    };

    let tooltip = d => {
      let time = this.formatTime(d.data.treeValue);
      let percent = " [" + (((d.data.treeValue / this.get('totalTime')) * 100).toFixed(1)) + "%]";
      let self = " (self: " + this.formatTime(d.data.stats.time.self) + ")";
      return d.data.name + "<br/>" + time + percent + self + "<br/>" + objToString(d.data.stats);
    };

    let clientHeight = document.getElementsByClassName('flame-graph')[0].clientHeight;
    clientHeight -= clientHeight % 20;
    let clientWidth = document.getElementsByClassName('flame-graph')[0].clientWidth;

    this.flameGraph = new FlameGraph('#d3-flame-graph', profile, true)
      .size([clientWidth, clientHeight])
      .cellHeight(20)
      .zoomEnabled(true)
      .zoomAction((node, event) => self.console.log('Zoom: ', node, event))
      .labelFunction(d => d.data.name + ' [' + d.data.time + ' / ' + d.data.percent + ']')
      .tooltip(tooltip).render();
  }
});
