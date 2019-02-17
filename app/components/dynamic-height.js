import Component from '@ember/component';

export default Component.extend({
  didInsertElement() {
    this._super(...arguments);

    const ensureCorrectHeight = () => {
      this.element.style.height = `${window.innerHeight - Number(this.top)}px`;
      this.element.style.display = 'block';
      this.element.style.overflow = 'scroll';
      this.raf = requestAnimationFrame(ensureCorrectHeight);
    };

    ensureCorrectHeight();
  },
  willDestroyElement() {
    this._super(...arguments);
    cancelAnimationFrame(this.raf);
  }
});
