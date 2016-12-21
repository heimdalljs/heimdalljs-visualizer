import Ember from 'ember';

import fetch from "ember-network/fetch";

// Import the D3 packages we want to use
import { select, event } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { extent, ascending } from 'd3-array';
import { transition } from 'd3-transition';
import { easeCubicInOut } from 'd3-ease';
import { cluster, stratify } from 'd3-hierarchy';
import { zoom, scaleExtent } from 'd3-zoom';

const { $, run, get } = Ember;

// copied these functions temporarily from `broccoli-viz` here:
// https://github.com/ember-cli/broccoli-viz/blob/master/lib/build-graph.js
// https://github.com/ember-cli/broccoli-viz/blob/master/lib/process.js
//
function nodesById(nodes) {
  var result = new Array(nodes.length);
  nodes.forEach(function(node) {
    result[node._id] = node;
  });
  return result;
}

function annotateNode(parent, graph) {
  var childTime = parent.children.reduce(function (acc, childId) {
    var node = graph.nodesById[childId];
    return acc + node.stats._broccoli_viz.totalTime;
  }, 0);

  parent.stats._broccoli_viz = {
    totalTime: childTime + parent.stats.time.self,
  };

  return parent;
}


function visitPostOrder(node, graph, cb) {
  node.children.forEach(function (id) {
    var child = graph.nodesById[id];
    child._parentId = node._id;
    visitPostOrder(child, graph, cb);
  });

  cb(node, graph);
}

function annotateNodes(graph) {
  visitPostOrder(graph.nodes[0], graph, annotateNode);

  return graph;
}

function processData(nodes) {
  let byId = nodesById(nodes);

  let graph = {
    nodesById: byId,
    nodes: nodes
  };

  return annotateNodes(graph);
}

export default Ember.Component.extend({
  tagName: 'svg',
  classNames: ['basic-tree'],

  width: 5000,
  height: 3000,

  attributeBindings: ['width', 'height'],

  init() {
    this._super(...arguments);

    this._lastGraphPath = null;
    this._graphData = null;
  },

  didReceiveAttrs() {
    let graphPath = get(this, 'graphPath');

    if (this._lastGraphPath !== graphPath) {
      fetch(graphPath)
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this._graphData = processData(response.nodes);

          run.schedule('render', this, this.drawTree, this._graphData);
        });

      this._lastGraphPath = graphPath;
    }
  },

  drawTree(data) {
    let svg = select(this.element);
    let width = +svg.attr("width");
    let height = +svg.attr("height");

    let g = svg
        .append("g")
        .attr("transform", "translate(60,0)");

    let graphStratifier = stratify()
        .id(d => d._id)
        .parentId(d => d._parentId);
    let root = graphStratifier(data.nodes);

    let tree = cluster().size([height, width - 160]);

    tree(root);

    g.selectAll(".link")
      .data(root.descendants().slice(1))
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", function(d) {
        return "M" + d.y + "," + d.x
          + "C" + (d.parent.y + 100) + "," + d.x
          + " " + (d.parent.y + 100) + "," + d.parent.x
          + " " + d.parent.y + "," + d.parent.x;
      });

    let node = g.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
        .attr("transform", function(d) {
          return "translate(" + d.y + "," + d.x + ")";
        });

    node.append("circle")
      .attr("r", 2.5);

    node.append("text")
      .attr("dy", 3)
      .attr("x", function(d) { return d.children ? -8 : 8; })
      .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
      .text(function(d) {
        return d.data.id.name;
      });

    let zoomHandler = zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", () => {
        g.attr("transform", event.transform);
      });
    svg.call(zoomHandler);
  }
});
