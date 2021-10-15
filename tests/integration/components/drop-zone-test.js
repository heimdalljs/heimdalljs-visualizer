import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { triggerEvent } from '@ember/test-helpers';

moduleForComponent('drop-zone', 'Integration | Component | drop zone', {
  integration: true
});

test('it renders', function (assert) {
  this.didDrop = () => {};

  this.render(hbs`
    {{#drop-zone}}
      drop-zone
    {{/drop-zone}}
  `);

  assert.ok(this._element.querySelector('.drop-zone') != null);
  assert.equal(this._element.querySelector('.drop-zone').draggable, true);
});

test('it triggers the dragging state', async function (assert) {
  this.didDrop = () => {};

  this.render(hbs`
    {{#drop-zone}}
      drop-zone
    {{/drop-zone}}
  `);

  await triggerEvent(this._element.querySelector('.drop-zone'), 'dragenter');
  assert.ok(this._element.querySelector('.drop-zone').classList.contains('drop-zone--dropping'));

  await triggerEvent(this._element.querySelector('.drop-zone'), 'dragleave');
  assert.ok(!this._element.querySelector('.drop-zone').classList.contains('drop-zone--dropping'));
});

test('dropping a file triggers the didDrop action', async function (assert) {
  this.didDrop = (event) => {
    assert.equal(event.type, 'drop');
  };

  this.render(hbs`
    {{#drop-zone didDrop=this.didDrop}}
      drop-zone
    {{/drop-zone}}
  `);

  await triggerEvent(this._element.querySelector('.drop-zone'), 'drop', {
    dataTransfer: {
      files: [new File(['{ "foo": "bar" }'], 'instrumentation.json')]
    }
  });

  assert.expect(1);
});
