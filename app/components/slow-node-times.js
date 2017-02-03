import Ember from 'ember';

const {
  computed
} = Ember;

function filterForAddonInitializationNodes(nodes) {
  return nodes.filter((node) => node.label.addonInitializationNode);
}

function filterForAddonDiscoveryNodes(nodes) {
  return nodes.filter((node) => node.label.addonDiscoveryNode);
}

function filterForBroccoliNodes(nodes, instance) {
  let pluginName = instance.get('pluginNameFilter');

  return nodes.filter((node) => {
    if (!node.label.broccoliNode) { return false; }
    if (pluginName && node.label.broccoliPluginName !== pluginName) { return false; }

    return true;
  })
}

export default Ember.Component.extend({
  init() {
    this._super(...arguments);
    this.filterType = 'broccoli-node';
  },

  filter: filterForBroccoliNodes,

  nodes: computed('data', 'filter', 'pluginNameFilter', function() {
    let data = this.get('data');
    let filter = this.get('filter');
    if (!data) { return []; }

    let nodes = data.nodes;

    if (filter) {
      nodes = filter(nodes, this);
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
    updateFilter(event) {
      let filter;
      let filterType = event.target.value;

      switch(filterType) {
      case 'addon-discovery':
        filter = filterForAddonDiscoveryNodes;
        break;
      case 'addon-initialization':
        filter = filterForAddonInitializationNodes;
        break;
      case 'broccoli-node':
        filter = filterForBroccoliNodes;
        break;
      }

      this.set('filter', filter);
      this.set('filterType', filterType);
    }
  }
});
