import Ember from 'ember';
import Controller from '@ember/controller';

const {
  inject
} = Ember;

export default Controller.extend({
  graph: inject.service()
})
