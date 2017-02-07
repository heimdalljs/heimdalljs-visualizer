import Ember from 'ember';

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
      };

      reader.readAsText(event.target.files[0]);
    }
  }
})
