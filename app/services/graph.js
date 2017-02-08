import Ember from 'ember';
import config from '../config/environment';
import heimdallGraph from 'heimdalljs-graph';

const {
  getOwner
} = Ember;

const STORAGE_KEY = `${config.storageVersion}_graph-data`;

export default Ember.Service.extend({
  init() {
    this._super(...arguments);

    let data = sessionStorage.getItem(STORAGE_KEY);
    if (data) {
      this.setGraph(JSON.parse(data));
    }
  },

  setGraph(data) {
    let graph = heimdallGraph.loadFromJSON(data);

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    this.set('data', data);
    this.set('graph', graph);
  },

  selectNode(node) {
    this.set('selectedNode', node);
    getOwner(this).lookup('router:main').transitionTo('selected-node');
  }
});
