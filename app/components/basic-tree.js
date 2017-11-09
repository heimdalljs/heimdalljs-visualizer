import Ember from 'ember';

// Import the D3 packages we want to use
import { select, event } from 'd3-selection';
import { cluster, hierarchy } from 'd3-hierarchy';
import { zoom, zoomIdentity } from 'd3-zoom';

const { run, get, inject } = Ember;

const DURATION = 500;

// copied these functions temporarily from `broccoli-viz` here:
// https://github.com/ember-cli/broccoli-viz/blob/master/lib/node-by-id.js

export default Ember.Component.extend({
  classNames: ['basic-tree'],

  graph: inject.service(),

  init() {
    this._super(...arguments);

    this._graphData = null;
  },

  didReceiveAttrs() {
    let graphData = get(this, 'graphData');

    if (this._lastGraphData !== graphData && graphData) {
      run.schedule('render', this, this.drawTree, graphData);

      this._lastGraphData = graphData;
    }
  },

  nodeFilter(node) {
    return node.label.broccoliNode;
  },

  drawTree(graphNode) {
    let svgContainer = this.element.querySelector('.svg-container');
    svgContainer.innerHTML = '';

    let svg = select(svgContainer)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 300 300")
      .classed("svg-content", true);

    let g = svg.append("g");

    let root = hierarchy(graphNode, node => {
      let children = [];
      for (let child of node.adjacentIterator()) {
        if (this.nodeFilter && !this.nodeFilter(child)) {
          continue;
        }

        children.push(child);
      }

      return children;
    })
      .sum(d => d._stats.time.self);

    // for debugging
    self.root = root;

    let graph = cluster()
      .separation((a,b) => a.parent == b.parent ? 4 : 8)
      .nodeSize([8, 180]);

    function update(source) {
      graph(root);
      let nodes = root.descendants();
      let links = root.links();
      let node = g
        .selectAll(".node")
        .data(nodes, d => d.data.id);

      let nodeEnter = node
        .enter()
        .append("g")
        .attr("class", 'node')
        .attr("transform", d => `translate(${d.y},${d.x})`)
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

      nodeEnter
        .append("text")
        .attr("dy", '0.0em')
        .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(function(d) {
          return `${d.data.label.name} (${d.data._id})`;
        });

      nodeEnter
        .append("text")
        .attr("dy", '1.1em')
        .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(function(d) {
          return `total: ${(d.value / 1000000).toFixed(2)}`;
        });

      nodeEnter
        .append("text")
        .attr("dy", '2.1em')
        .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(function(d) {
          return `self: ${(d.data._stats.time.self / 1000000).toFixed(2)}`;
        });

      // update exiting node locations
      node
        .transition()
        .duration(DURATION)
        .attr('transform', d => `translate(${d.y},${d.x})`);

      // Transition exiting nodes to the parent's new position.
      node
        .exit()
        .transition()
        .duration(DURATION)
        .attr("transform", function () {
          return "translate(" + source.x + "," + source.y + ")";
        })
        .remove();

      let link = g
        .selectAll(".link")
        .data(links, d => d.target.data.id);

      link
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", function(d) {
          return "M" + d.target.y + "," + d.target.x
            + "C" + (d.source.y + 50) + "," + d.target.x
            + " " + (d.source.y + 50) + "," + d.source.x
            + " " + d.source.y + "," + d.source.x;
        });

      link
        .transition()
        .duration(DURATION)
        .attr("d", function(d) {
          return "M" + d.target.y + "," + d.target.x
            + "C" + (d.source.y + 50) + "," + d.target.x
            + " " + (d.source.y + 50) + "," + d.source.x
            + " " + d.source.y + "," + d.source.x;
        });

      // update exiting link locations
      link
        .exit()
        .transition()
        .duration(DURATION / 2)
        .attr("transform", function () {
          return "translate(" + source.x + "," + source.y + ")";
        })
        .remove();
    }

    update(root);

    let zoomHandler = zoom()
      .on("zoom", () => {
        g.attr("transform", event.transform);
      });

    function transform() {
      return zoomIdentity
        .translate(48, 120)
        .scale(0.10);
    }

    svg.call(zoomHandler.transform, transform());
    svg.call(zoomHandler);
  }
});
