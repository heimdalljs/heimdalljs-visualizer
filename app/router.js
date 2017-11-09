import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('graph', { path: '/' }, function() {
    this.route('node');
  });

  this.route('slow-nodes');
  this.route('flame');
});

export default Router;
