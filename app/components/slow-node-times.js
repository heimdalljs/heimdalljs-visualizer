import Ember from 'ember';

const {
  computed
} = Ember;

function filterForAddonInitializationNodes(node) {
  return node.label.addonInitializationNode;
}

function filterForAddonDiscoveryNodes(node) {
  return node.label.addonDiscoveryNode;
}

function filterForBroccoliNodes(node) {
  return node.label.broccoliNode;
}

export default Ember.Component.extend({
  filter: filterForAddonInitializationNodes,

  nodes: computed('data', 'filter', function() {
    let data = this.get('data');
    let filter = this.get('filter');
    if (!data) { return []; }

    let nodes = data.nodes;

    if (filter) {
      nodes = nodes.filter(filter);
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

      switch(event.target.value) {
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
    }
  }
});
