import { helper as buildHelper } from '@ember/component/helper';

export default buildHelper(function([haystack, needle]) {
  return haystack && haystack.includes && haystack.includes(needle);
});
