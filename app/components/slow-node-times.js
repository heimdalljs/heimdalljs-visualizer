import Ember from 'ember';

const {
  computed
} = Ember;

export default Ember.Component.extend({
  nodes: computed('data', 'filter', 'pluginNameFilter', 'groupByPluginName', function() {
    let data = this.get('data');
    let groupByPluginName = this.get('groupByPluginName');
    let pluginName = this.get('pluginNameFilter');
    if (!data) { return []; }

    let nodes = data.nodes.filter((node) => {
      if (!node.label.broccoliNode) { return false; }
      if (pluginName && node.label.broccoliPluginName !== pluginName) { return false; }

      return true;
    })

    if (groupByPluginName) {
      let pluginNameMap = nodes.reduce((memo, node) => {
        let pluginName = node.label.broccoliPluginName;
        memo[pluginName] = memo[pluginName] || { count: 0, time: 0 };
        memo[pluginName].time += node.stats.time.self;
        memo[pluginName].count++;
        return memo;
      }, {})

      nodes = [];
      for (let pluginName in pluginNameMap) {
        nodes.push({
          label: { name: pluginName, broccoliPluginName: pluginNameMap[pluginName].count },
          stats: {
            time: { self: pluginNameMap[pluginName].time}
          }
        });
      }
    }

    let addonNodes = nodes
        .sort((a, b) => {
          return b.stats.time.self - a.stats.time.self;
        });

    return addonNodes;
  }),

  totalTime: computed('nodes', function() {
    let nodes = this.get('nodes');

    return nodes.reduce(function(previousValue, node){
      return previousValue + node.stats.time.self;
    }, 0);
  }),

  actions: {
  }
});
