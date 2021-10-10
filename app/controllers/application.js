import Ember from 'ember';
import fetch from 'fetch';

const { inject } = Ember;

export default Ember.Controller.extend({
  graph: inject.service(),

  _setGraphFromFile(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      this.get('graph').setGraph(JSON.parse(e.target.result));
      this.set('showUploadModal', false);
    };

    reader.readAsText(file);
  },

  actions: {
    parseFile(event) {
      this._setGraphFromFile(event.target.files[0]);
    },

    onFileDrop(event) {
      this._setGraphFromFile(event.dataTransfer.files[0]);
    },

    useSample(url) {
      fetch(url)
        .then((response) => {
          return response.json();
        })
        .then((contents) => {
          this.get('graph').setGraph(contents);
          this.set('showUploadModal', false);
        });
    },

    clearData() {
      this.get('graph').clearGraph();
    }
  }
});
