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

    let graph = tree()
        .separation((a,b) => {
          return a.parent == b.parent ? 4 : 8;
        })
        .nodeSize([6, 180]);
    graph(root);

    function update(source) {
      let link = g.selectAll(".link")
          .data(root.descendants().slice(1));

      link.enter()
        .append("path")
        .attr("class", "link")
        .attr("d", function(d) {
          return "M" + d.y + "," + d.x
            + "C" + (d.parent.y + 50) + "," + d.x
            + " " + (d.parent.y + 50) + "," + d.parent.x
            + " " + d.parent.y + "," + d.parent.x;
        });

      let node = g.selectAll(".node")
          .data(root.descendants());

      let nodeEnter = node
          .enter()
          .append("g")
          .attr("class", 'node')
          .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
          })
          .on('click', (d) => {
            // Toggle children on click.
            if (d.children) {
              d._children = d.children;
              d.children = null;
            } else {
              d.children = d._children;
              d._children = null;
            }
            update(d);
          });

      // we want to wrap the next few text lines in a rect
      // but alignment is annoying, punting for now...
      //
      // nodeEnter.append("rect")
      //   .attr('x', '-75')
      //   .attr('y', '-1.5em')
      //   .attr('width', '75px')
      //   .attr('height', "3em")
      //   .attr('stroke', "black")
      //   .attr('stroke-width', 1)
      //   .style('fill', "#fff");

      nodeEnter.append('text')
        .attr('dy', '-1.1em')
        .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(d => d.data._id);

      nodeEnter.append("text")
        .attr("dy", '0.1em')
        .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(function(d) {
          return d.data.id.name;
        });

      nodeEnter.append("text")
        .attr("dy", '1.1em')
        .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(function(d) {
          return `total: ${(d.value / 1000000).toFixed(2)}`;
        });

      nodeEnter.append("text")
        .attr("dy", '2.1em')
        .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(function(d) {
          return `self: ${(d.data.stats.time.self / 1000000).toFixed(2)}`;
        });

      // Transition exiting nodes to the parent's new position.
      node.exit()
        .transition()
        .duration(50)
        .attr("transform", function () {
          return "translate(" + source.x + "," + source.y + ")";
        })
        .remove();

      link.exit()
        .transition()
        .duration(50)
        .attr("transform", function () {
          return "translate(" + source.x + "," + source.y + ")";
        })
        .remove();
    }

    update(root);

    let zoomHandler = zoom()
      .scaleExtent([0.05, 3])
      .on("zoom", () => {
        g.attr("transform", event.transform);
      });

    function transform() {
      return zoomIdentity
        .translate(30, 150)
        .scale(0.30);
    }

    svg.call(zoomHandler.transform, transform());
    svg.call(zoomHandler);
  }
});
