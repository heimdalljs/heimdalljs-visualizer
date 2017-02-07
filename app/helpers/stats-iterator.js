import Ember from 'ember';

export default Ember.Helper.helper(function([node]) {
  let stats = {};

  for (let [name, value] of node.statsIterator()) {
    stats[name] = value;
  }

  return stats;
});
