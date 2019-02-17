import Ember from 'ember';
import { get, set } from '@ember/object';
import { computed } from '@ember/object';
import Component from '@ember/component';

const {
  inject
} = Ember;

function selfTime(node) {
  for (let [statName, value] of node.statsIterator()) {
    if (statName === 'time.self') {
      return value;
    }
  }
  return 0;
}

// Given a node, compute the total time taken by the node
// and its children (by summing the total time of the children
// and adding the self time of the node). Return that value,
// and assign it to the _stats.time.plugin attribute of the node.
// Note: we skip the non-broccoliNodes except at the beginning
// (the root of the tree is not a broccoliNode, but we want to
// proceed to its children
function computeNodeTimes(root, totalMap=new WeakMap()) {
  for (let node of root.dfsIterator({order: 'post'})) {
    let total = selfTime(node);
    for (let child of node.childIterator()) {
      total += totalMap.get(child);
    }
    totalMap.set(node, total);

    if (node.label.broccoliNode) {
      set(node._stats.time, 'plugin', total);
    }
  }

  return totalMap.get(root);
}


export default Component.extend({
  graph: inject.service(),

  init() {
    this._super(...arguments);
    this.sortDescending = true;
  },

  nodes: computed('data', 'filter', 'pluginNameFilter', 'groupByPluginName', function() {
    let data = this.get('data');

    let nodes = [];

    if (!data) {
      return nodes;
    }

    computeNodeTimes(data);  // start at root node of tree (which is not a broccoliNode)

    for (let node of data.dfsIterator()) {
      if (node.label.broccoliNode) {
        nodes.push(node);
      }
    }

    let pluginNameFilter = this.get('pluginNameFilter');
    if (pluginNameFilter) {
      nodes = nodes.filter((node) => {
        return (node.label.broccoliNode &&
                (pluginNameFilter === node.label.broccoliPluginName ||
                 pluginNameFilter === 'undefined' && node.label.broccoliPluginName === undefined));
      });
    }

    // Note: the following is also gathering stats for the items that
    // have no broccoliPluginName (the 'name' is undefined).
    let groupByPluginName = this.get('groupByPluginName');
    if (groupByPluginName) {
      let pluginNameMap = nodes.reduce((memo, node) => {
        let pluginName = node.label.broccoliPluginName;
        memo[pluginName] = memo[pluginName] || { count: 0, time: 0 };
        memo[pluginName].time += node._stats.time.plugin;
        memo[pluginName].count++;
        return memo;
      }, {});

      nodes = [];

      for (let pluginName in pluginNameMap) {
        nodes.push({
          groupedByPluginName: true,
          label: { name: pluginName, broccoliPluginName: pluginNameMap[pluginName].count },
          _stats: {
            time: { plugin: pluginNameMap[pluginName].time }
          }
        });
      }
    }

    return nodes;
  }).readOnly(),

  pluginNames: computed('nodes', function() {
    let nodes = this.get('nodes');

    if (!nodes || nodes.length === 0) {
      return [];
    }

    // If the first item in the list is an object with
    // 'groupedByPluginName' = true, we just need to pull
    // off the label as the plugin name. If not, we need
    // to create a map of the plugin names and return that.
    let pluginNames = [];

    if (nodes[0].groupedByPluginName === true) {
      pluginNames = nodes.map(node => node.label.name);
    } else {
      let pluginNameMap = nodes.reduce((memo, node) => {
        let pluginName = node.label.broccoliPluginName;
        memo[pluginName] = pluginName;
        return memo;
      }, {});

      pluginNames = Object.keys(pluginNameMap);
    }

    pluginNames.sort();

    return pluginNames;
  }).readOnly(),

  sortedNodes: computed('nodes', 'sortDescending', function() {
    let sortDescending = this.get('sortDescending');
    return this.get('nodes').sort((a, b) => {
      if (sortDescending) {
        return b._stats.time.plugin - a._stats.time.plugin;
      } else {
        return a._stats.time.plugin - b._stats.time.plugin;
      }
    });
  }).readOnly(),

  totalTime: computed('nodes', function() {
    let nodes = this.get('nodes');

    return nodes.reduce(function(previousValue, node){
      return previousValue + node._stats.time.plugin;
    }, 0);
  }).readOnly(),

  actions: {
    'focus-node'(node) {
      this.get('graph').selectNode(node);
    },

    toggleDetailsForNode(node) {
      if (node.groupedByPluginName) {
        this.set('groupByPluginName', false);
        this.set('pluginNameFilter', node.label.name);
      } else {
        let shown = get(node, 'showDetails');
        set(node, 'showDetails', !shown);
      }
    },

    toggleTime() {
      this.toggleProperty('sortDescending');
    },

    selectFilter(value) {
      this.set('pluginNameFilter', (value === 'clearFilter' ? undefined : value));
    }
  }
});
