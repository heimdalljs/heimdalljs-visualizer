import Ember from 'ember';

const {
  computed,
  getOwner,
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

  nodes: computed('data', 'filter', 'pluginNameFilter', 'groupByPluginName', function() {
    let data = this.get('data');
    if (!data) { return []; }

    let nodes = [];

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

    let sortedNodes = nodes
        .sort((a, b) => {
          return b._stats.time.plugin - a._stats.time.plugin;
        });

    return sortedNodes;
  }),

  totalTime: computed('nodes', function() {
    let nodes = this.get('nodes');

    return nodes.reduce(function(previousValue, node){
      return previousValue + node._stats.time.plugin;
    }, 0);
  }),

  actions: {
    'focus-node'(node) {
      if (node.groupedByPluginName) {
        this.set('groupByPluginName', false);
        this.set('pluginNameFilter', node.label.name);
      } else {
        this.get('graph').selectNode(node);
      }
    }
  }
});
