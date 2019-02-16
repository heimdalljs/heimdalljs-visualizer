import Ember from 'ember';
import Controller from '@ember/controller';
import { getOwner } from '@ember/application';
import { computed } from '@ember/object';

const {
  inject
} = Ember;

export default Controller.extend({
  graph: inject.service(),

  route: computed.alias('router.currentPath'),

  init() {
    this._super(...arguments);
    this.set('router', getOwner(this).lookup('router:main'));
  }
});
