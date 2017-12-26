import Ember from 'ember';

// Import the D3 packages we want to use
import { select, event } from 'd3-selection';
import { cluster, hierarchy } from 'd3-hierarchy';
import { zoom, zoomIdentity } from 'd3-zoom';

const { run, get, inject } = Ember;

const DURATION = 500;

// The offset amount (in px) from the left or right side of a node
// box to offset lines between nodes, so the lines don't come right
// up to the edge of the box.
const NODE_OFFSET_SIZE = 50; 

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

    // Compute the width of a line of text. For now we'll fake it
    // by assuming a constant char width. Add 20 for 'padding'.
    // TODO: convert to the real line size based on the real characters.
    function computeLineWidth(str) {
      const CHAR_WIDTH = 5;
      let val = str.length * CHAR_WIDTH + 20;
      return val;
    }

    // Given a node, compute the width of the box needed to hold
    // the text of the element, by computing the max of the widths
    // of all the text lines.
    function computeNodeWidth(d) {
      return Math.max(computeLineWidth(d.data.label.name),
                      computeLineWidth(`total: ${(d.value / 1000000).toFixed(2)}`),
                      computeLineWidth(`self: ${(d.data._stats.time.self / 1000000).toFixed(2)}`),
                      computeLineWidth(`node id: ${d.data._id}`));
    }

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
    .sum(d => d._stats.time.self)
    .each(d => d.computedWidth = computeNodeWidth(d));

    // For each node height (distance above leaves, which are height = 0)
    // keep track of the maximum cell width at that height and then use that
    // to compute the desired X position for all the nodes at that height.
    let nodeHeightData = [];

    root.each((d) => {
      let heightData = nodeHeightData[d.height];
      if (heightData === undefined) {
        heightData = {maxWidth: d.computedWidth, x: 0 }
        nodeHeightData[d.height] = heightData;
      } else if (heightData.maxWidth < d.computedWidth) {
        heightData.maxWidth = d.computedWidth;
      }
    });

    // Now that we have the maxWidth data for all the heights, compute
    // the X position for all the cells at each height.
    // Each height except the root will have NODE_OFFSET_SIZE on the front.
    // Each height except the leaves (height=0) will have NODE_OFFSET_SIZE after it.
    // We have to iterate through the list in reverse, since height 0
    // has its X value calculated last.
    let currX = 0;

    for (let i = nodeHeightData.length - 1; i >= 0; i--) {
      let item = nodeHeightData[i];
      item.x = currX;
      currX = currX + item.maxWidth + (2 * NODE_OFFSET_SIZE);
    }

    // for debugging
    self.root = root;

    // Create the graph. The nodeSize() is [8,280] (width, height) because we 
    // want to change the orientation of the graph from top-down to left-right.
    // To do that we reverse X and Y for calculations and translations.
    let graph = cluster()
      .separation(() => 8)
      .nodeSize([9, 280]);

    function update(source) {
      graph(root);
      let nodes = root.descendants();
      let links = root.links();
      let node = g
        .selectAll(".node")
        .data(nodes, d => d.data.id);

      // The graph is laid out by graph() as vertically oriented
      // (the root is at the top). We want to show it as horizontally
      // oriented (the root is at the left). In addition, we want
      // each 'row' of nodes to show up as a column with the cells
      // aligned on their left edge at the cell's 0 point.
      // To do all this, we'll flip the d.x and d.y values when translating
      // the node to its position.
      root.each(d => d.y = nodeHeightData[d.height].x);

      // For the 'enter' set, create a node for each entry.
      // Move the node to the computed node point (remembering
      // that X and Y are reversed so we get a horizontal graph).
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

      // Draw the node in a box
      nodeEnter.append("rect")
         .attr('x', 0)
         .attr('y', '-2em')
         .attr('width', function(d) {
            return d.computedWidth;
         })
         .attr('height', "4em")
         .attr('stroke', "black")
         .attr('stroke-width', 1)
         .style('fill', "#fff");

      // Draw a box in a separate color for the first line as
      // a 'title'. 
      nodeEnter.append("rect")
         .attr('x', 0)
         .attr('y', '-2em')
         .attr('width', function(d) {
            return d.computedWidth;
         })
         .attr('height', "1em")
         .attr('stroke', "black")
         .attr('stroke-width', 1)
         .style('fill', "#000000");

      nodeEnter
        .append("text")
        .attr('text-anchor', 'middle')
        .attr("x", d => d.computedWidth/2)
        .attr("y", '-1.7em')
        .attr("class", "nodetitle")
        .attr("font-weight", "bold")
        .text(function(d) {
          return `${d.data.label.name}`;
        });

      nodeEnter
        .append("text")
        .attr('text-anchor', 'middle')
        .attr("x", d => d.computedWidth/2)
        .attr("y", '-0.4em')
        .text(function(d) {
          return `total: ${(d.value / 1000000).toFixed(2)}`;
        });

      nodeEnter
        .append("text")
        .attr('text-anchor', 'middle')
        .attr("x", d => d.computedWidth/2)
        .attr("y", '0.8em')
        .text(function(d) {
          return `self: ${(d.data._stats.time.self / 1000000).toFixed(2)}`;
        });

      nodeEnter
        .append("text")
        .attr('text-anchor', 'middle')
        .attr("x", d => d.computedWidth/2)
        .attr("y", '2.0em')
        .text(function(d) {
          return `node id: ${d.data._id}`;
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

      // Create all the links between the various nodes. Each node
      // will have the link from an earlier node (higher height)
      // come into the 0 point for the node, and the links to lower
      // height nodes start at the right edge of the node (+ NODE_OFFSET_SIZE).
      let link = g
        .selectAll(".link")
        .data(links, d => d.target.data.id);

      link
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", function(d) {
          let sourceExitY = d.source.y + d.source.computedWidth + NODE_OFFSET_SIZE;
          let targetEntranceY = d.target.y - NODE_OFFSET_SIZE;
          
          return "M" + d.target.y + "," + d.target.x
            + "L" + targetEntranceY + "," + d.target.x
            + " " + sourceExitY + "," + d.target.x
            + " " + sourceExitY + "," + d.source.x
            + " " + (sourceExitY - NODE_OFFSET_SIZE) + "," + d.source.x;
        });

      link
        .transition()
        .duration(DURATION)
        .attr("d", function(d) {
          let sourceExitY = d.source.y + d.source.computedWidth + NODE_OFFSET_SIZE;
          let targetEntranceY = d.target.y - NODE_OFFSET_SIZE;
          
          return "M" + d.target.y + "," + d.target.x
            + "L" + targetEntranceY + "," + d.target.x
            + " " + sourceExitY + "," + d.target.x
            + " " + sourceExitY + "," + d.source.x
            + " " + (sourceExitY - NODE_OFFSET_SIZE) + "," + d.source.x;
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
