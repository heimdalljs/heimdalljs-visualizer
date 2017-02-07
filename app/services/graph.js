import Ember from 'ember';
import heimdallGraph from 'heimdalljs-graph';

const {
  getOwner
} = Ember;

export default Ember.Service.extend({
  setGraph(data) {
    let graph = heimdallGraph.loadFromJSON(data);

    this.set('data', data);
    this.set('graph', graph);
  },

  selectNode(node) {
    this.set('selectedNode', node);
    getOwner(this).lookup('router:main').transitionTo('selected-node');
  }
});
