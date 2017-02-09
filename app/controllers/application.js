import Ember from 'ember';
import fetch from "ember-network/fetch";

const {
  inject
} = Ember;

export default Ember.Controller.extend({
  graph: inject.service(),

  actions: {
    parseFile(event) {
      let reader = new FileReader();
      reader.onload = (e) => {
        var contents = e.target.result;
        this.get('graph').setGraph(JSON.parse(contents));
        this.set('showUploadModal', false);
      };

      reader.readAsText(event.target.files[0]);
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
})
