import Ember from 'ember';
import fetch from "ember-network/fetch";
import config from '../config/environment';

const SAMPLE_DATA = config.rootURL + 'broccoli-viz-files/initial-build-canary-20161220.json';

export default Ember.Controller.extend({
  init() {
    this._super(...arguments);

    this.graphData = null;
  },

  actions: {
    parseFile(event) {
      let reader = new FileReader();
      reader.onload = (e) => {
        var contents = e.target.result;
        this.set('graphData', JSON.parse(contents));
      };

      reader.readAsText(event.target.files[0]);
    },

    useSample() {
      fetch(SAMPLE_DATA)
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this.set('graphData', response);
        });
    }
  }
});
