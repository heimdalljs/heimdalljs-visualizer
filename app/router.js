import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('graph', { path: '/' }, function() {
    this.route('node');
  });

  this.route('slow-nodes');
  this.route('flame');
  this.route('flame-v3');
});

export default Router;
