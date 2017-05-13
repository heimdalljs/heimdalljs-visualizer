import Ember from 'ember';

const {
  Controller,
  inject
} = Ember;

export default Controller.extend({
  graph: inject.service(),
});
