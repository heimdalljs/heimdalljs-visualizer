import Ember from 'ember';
import heimdallGraph from 'heimdalljs-graph';

const {
  computed
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
  nodes: computed('data', 'filter', 'pluginNameFilter', 'groupByPluginName', function() {
    let data = this.get('data');
    if (!data) { return []; }

    let nodes = [];
    let graph = heimdallGraph.loadFromJSON(data);

    for (let node of graph.dfsIterator()) {
      if (node.label.broccoliNode) {
        nodes.push({
          label: node.label,
          time: nodeTime(node)
        })
      }
    }

    //let groupByPluginName = this.get('groupByPluginName');
    //let pluginName = this.get('pluginNameFilter');
    // nodes = data.nodes.filter((node) => {
    //   if (!node.label.broccoliNode) { return false; }
    //   if (pluginName && node.label.broccoliPluginName !== pluginName) { return false; }

    //   return true;
    // })

    // if (groupByPluginName) {
    //   let pluginNameMap = nodes.reduce((memo, node) => {
    //     let pluginName = node.label.broccoliPluginName;
    //     memo[pluginName] = memo[pluginName] || { count: 0, time: 0 };
    //     memo[pluginName].time += node.stats.time.self;
    //     memo[pluginName].count++;
    //     return memo;
    //   }, {})

    //   nodes = [];
    //   for (let pluginName in pluginNameMap) {
    //     nodes.push({
    //       label: { name: pluginName, broccoliPluginName: pluginNameMap[pluginName].count },
    //       stats: {
    //         time: { self: pluginNameMap[pluginName].time}
    //       }
    //     });
    //   }
    // }

    let sortedNodes = nodes
        .sort((a, b) => {
          return b.time - a.time;
        });

    return sortedNodes;
  }),

  totalTime: computed('nodes', function() {
    let nodes = this.get('nodes');

    return nodes.reduce(function(previousValue, node){
      return previousValue + node.time;
    }, 0);
  }),

  actions: {
  }
});
