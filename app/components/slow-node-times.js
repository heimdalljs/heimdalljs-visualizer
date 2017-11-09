import Ember from 'ember';

const {
  get,
  set,
  computed,
  inject
} = Ember;

function selfTime(node) {
  for (let [statName, value] of node.statsIterator()) {
    if (statName === 'time.self') {
      return value;
    }
  }
}

function nodeTime(node) {
  let nodeTotal = 0;
  for (let childNode of node.dfsIterator((n) => n.label.broccoliNode)) {
    nodeTotal += selfTime(childNode);
  }

  return nodeTotal;
}

export default Ember.Component.extend({
  graph: inject.service(),

  init() {
    this._super(...arguments);
    this.sortDescending = true;
  },

  nodes: computed('data', 'filter', 'pluginNameFilter', 'groupByPluginName', function() {
    let data = this.get('data');
    let nodes = [];

    if (!data) { return nodes; }

    for (let node of data.dfsIterator()) {
      if (node.label.broccoliNode) {
        nodes.push(node);
        if (!node._stats.time.plugin) {
          node._stats.time.plugin = nodeTime(node);
        }
      }
    }

    let pluginNameFilter = this.get('pluginNameFilter');
    if (pluginNameFilter) {
      nodes = nodes.filter((node) => {
        if (!node.label.broccoliNode) { return false; }
        if (node.label.broccoliPluginName !== pluginNameFilter) { return false; }

        return true;
      });
    }

    let groupByPluginName = this.get('groupByPluginName');
    if (groupByPluginName) {
      let pluginNameMap = nodes.reduce((memo, node) => {
        let pluginName = node.label.broccoliPluginName;
        memo[pluginName] = memo[pluginName] || { count: 0, time: 0 };
        memo[pluginName].time += node._stats.time.plugin;
        memo[pluginName].count++;
        return memo;
      }, {})

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
    }
  }
});
