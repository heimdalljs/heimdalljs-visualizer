import Component from "@ember/component";

export default Component.extend({
  classNames: ["drop-zone"],
  classNameBindings: ["dropping:drop-zone--dropping"],
  attributeBindings: ["draggable"],

  dropping: true,
  draggable: true,

  dragOver() {
    return false;
  },

  dragEnter() {
    this.set("dropping", true);
  },

  dragLeave() {
    this.set("dropping", false);
  },

  drop(event) {
    event.preventDefault();
    this.didDrop(event);
  },
});
