import Ember from 'ember';

const {
  Controller,
  getOwner,
  computed,
  inject
} = Ember;

export default Controller.extend({
  graph: inject.service(),

  route: computed.alias('router.currentPath'),

  init() {
    this.set('router', getOwner(this).lookup('router:main'));
  }
});
