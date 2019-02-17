import { helper as buildHelper } from '@ember/component/helper';

export function nsToMs([time]) {
  return (time / 1000000).toFixed(2);
}

export default buildHelper(nsToMs);
