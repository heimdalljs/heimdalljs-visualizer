import Ember from 'ember';

export function nsToMs([time]) {
  return (time / 1000000).toFixed(2);
}

export default Ember.Helper.helper(nsToMs);
