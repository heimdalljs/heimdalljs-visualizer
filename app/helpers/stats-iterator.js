import { helper as buildHelper } from '@ember/component/helper';

export default buildHelper(function([node]) {
  let stats = {};

  for (let [name, value] of node.statsIterator()) {
    stats[name] = value;
  }

  return stats;
});
