import Ember from 'ember';

import fetch from "ember-network/fetch";

// Import the D3 packages we want to use
import { select, event } from 'd3-selection';
import { tree, cluster, hierarchy } from 'd3-hierarchy';
import { zoom, zoomIdentity } from 'd3-zoom';

const { $, run, get } = Ember;

// copied these functions temporarily from `broccoli-viz` here:
// https://github.com/ember-cli/broccoli-viz/blob/master/lib/node-by-id.js
function nodesById(nodes) {
  var result = new Array(nodes.length);
  nodes.forEach(function(node) {
    result[node._id] = node;
  });
  return result;
}

export default Ember.Component.extend({
  classNames: ['basic-tree'],

  init() {
    this._super(...arguments);

    this._lastGraphPath = null;
    this._graphData = null;
  },

  didReceiveAttrs() {
    let graphPath = get(this, 'graphPath');
    let graphData = get(this, 'graphData');

    if (this._lastGraphPath !== graphPath && graphPath) {
      fetch(graphPath)
        .then((response) => {
          return response.json();
        })
        .then((response) => this.processRawData(response));

      this._lastGraphPath = graphPath;
    }

    if (this._lastGraphData !== graphData && graphData) {
      let response = JSON.parse(graphData);

      this.processRawData(response);

      this._lastGraphData = graphData;
    }
  },

  processRawData(response) {
    this._graphData = {
      nodesById: nodesById(response.nodes),
      nodes: response.nodes
    };

    run.schedule('render', this, this.drawTree, this._graphData);
  },

  nodeFilter(node) {
    return node.id.broccoliNode;
  },

  drawTree(data) {
    let svg = select(this.element.querySelector('.svg-container'))
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 300 300")
        .classed("svg-content", true);

    let g = svg.append("g");

    let root = hierarchy(data.nodes[0], (node) => {
      return node.children
        .map((childId) => data.nodesById[childId])
        .filter(this.nodeFilter);
    }).sum(d => d.stats.time.self);

    let { clientHeight, clientWidth } = this.element;

    let graph = tree().size([clientHeight, clientWidth]);
    graph(root);

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

    function transform() {
      return zoomIdentity
        .translate(60, 0)
        .scale(0.14);
    }

    svg.call(zoomHandler.transform, transform());
    svg.call(zoomHandler);
  }
});
