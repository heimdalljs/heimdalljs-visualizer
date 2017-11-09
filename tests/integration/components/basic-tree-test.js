import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('basic-tree', 'Integration | Component | basic tree', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{basic-tree}}`);

  assert.equal(this._element.textContent.trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#basic-tree}}
      template block text
    {{/basic-tree}}
  `);

  assert.equal(this._element.textContent.trim(), '');
});
