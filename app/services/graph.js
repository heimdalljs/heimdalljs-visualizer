import config from '../config/environment';
import heimdallGraph from 'heimdalljs-graph';
import { getOwner } from '@ember/application';
import Service from '@ember/service';

const DATA_STORAGE_KEY = `${config.storageVersion}_graph-data`;
const SELECTED_NODE_STORAGE_KEY = `${config.storageVersion}_selected-node-id`;

export default Service.extend({
  init() {
    this._super(...arguments);

    let data = sessionStorage.getItem(DATA_STORAGE_KEY);
    if (data) {
      this.setGraph(JSON.parse(data));
    }

    let selectedNodeId = sessionStorage.getItem(SELECTED_NODE_STORAGE_KEY);
    if (selectedNodeId && data) {
      let graph = this.get('graph');
      for (let node of graph.dfsIterator()) {
        if (node.id === selectedNodeId) {
          this.set('selectedNode', node);
          break;
        }
      }
    }
  },

  setGraph(data) {
    let graph = heimdallGraph.loadFromJSON(data);

    try {
      sessionStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore errors from sessionStorage
    }

    this.set('data', data);
    this.set('graph', graph);
  },

  clearGraph() {
    this.set('data', null);
    this.set('graph', null);

    sessionStorage.removeItem(DATA_STORAGE_KEY);
    sessionStorage.removeItem(SELECTED_NODE_STORAGE_KEY);
  },

  selectNode(node) {
    sessionStorage.setItem(SELECTED_NODE_STORAGE_KEY, node.id);

    this.set('selectedNode', node);
    getOwner(this).lookup('router:main').transitionTo('graph.node');
  }
});
