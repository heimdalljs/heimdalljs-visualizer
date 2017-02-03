import Ember from 'ember';

export default Ember.Controller.extend({
  init() {
    this._super(...arguments);
    this.data = null;
  },

  actions: {
    parseFile(event) {
      let reader = new FileReader();
      reader.onload = (e) => {
        var contents = e.target.result;
        this.set('data', JSON.parse(contents));
      };

      reader.readAsText(event.target.files[0]);
    }
  }
})
