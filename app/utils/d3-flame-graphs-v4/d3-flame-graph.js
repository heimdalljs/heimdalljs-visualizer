import { select, event } from 'd3-selection';
// import { zoom, zoomIdentity } from 'd3-zoom';
import { scaleLinear, scaleQuantize } from 'd3-scale';
import { min, max, range } from 'd3-array';
import { transition } from 'd3-transition';
import d3Tip from 'd3-tip';
// import FlameGraphUtils from './d3-flame-graph-utils';
import { partition, hierarchy } from 'd3-hierarchy';

var logData = {};
var logIndex = 0;
let logIt = function() {
  let args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
  if (args) {
    let label = args.splice(0, 1).toString();
    // logData[logIndex++ + ' ' + label] = args;
    logData[logIndex++ + ' ' + label] = args;
    console.log(label, args[0], args[1], args[2], args[3], args[4]);
  }
  // console.log(...arguments);
};

let indexOf = [].indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; }
    return -1;
  };

let getClassAndMethodName = function(fqdn) {
  let tokens;
  if (!fqdn) {
    return "";
  }
  tokens = fqdn.split(".");
  return tokens.slice(tokens.length - 2).join(".");
};

let hash = function(name) {
  let i, j, maxHash, mod, ref, ref1, result, weight;
  ref = [0, 0, 1, 10], result = ref[0], maxHash = ref[1], weight = ref[2], mod = ref[3];
  name = getClassAndMethodName(name).slice(0, 6);
  for (i = j = 0, ref1 = name.length - 1; 0 <= ref1 ? j <= ref1 : j >= ref1; i = 0 <= ref1 ? ++j : --j) {
    result += weight * (name.charCodeAt(i) % mod);
    maxHash += weight * (mod - 1);
    weight *= 0.7;
  }
  if (maxHash > 0) {
    return result / maxHash;
  } else {
    return result;
  }
};

const FlameGraphUtils = {
  augment(node, location) {
    // logIt('Augment:', ...arguments);
    let childSum;
    let children;
    children = node.children;
    if (node.augmented) {
      return node;
    }
    node.originalValue = node.value;
    node.level = node.children ? 1 : 0;
    node.hidden = [];
    node.location = location;
    if (!(children != null ? children.length : void 0)) {
      node.augmented = true;
      // logIt('Augment result no children:', node);
      return node;
    }
    childSum = children.reduce((function(sum, child) {
      return sum + child.value;
    }), 0);
    if (childSum < node.value) {
      logIt('Filler created with value:', node.value - childSum);
      children.push({
        value: node.value - childSum,
        filler: true
      });
    }
    children.forEach((child, idx) => FlameGraphUtils.augment(child, location + "." + idx));
    node.level += children.reduce(((max, child) => Math.max(child.level, max)), 0);
    node.augmented = true;
    // logIt('Augment result:', node);
    return node;
  },
  partition(data) {
    logIt('Partition:', ...arguments);
    let d3partition = partition();
    // .size([360, radius])
    // .padding(0)
    //.round(true);

    let root = hierarchy(data)
    // .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
      .sum(d => d.data ? d.data.value : d.value)
      .sort((a, b) => {
        if (a.filler) {
          return 1;
        }
        if (b.filler) {
          return -1;
        }
        return a.data.name.localeCompare(b.data.name);
      });
    // function(a, b) { return b.height - a.height || b.value - a.value; }
    // return d3partition(root).descendants();
    let res = d3partition(root).descendants();
    logIt('Partition result:', res);
    return res;

    // let sortFunc =;
    // let root = partition(data);
    // return root.sort(sortFunc);
    //return partition().nodes(data);
    // return partition().sort((a, b) => {
    //   if (a.filler) {
    //     return 1;
    //   }
    //   if (b.filler) {
    //     return -1;
    //   }
    //   return a.name.localeCompare(b.name);
    // }).nodes(data);
  },
  hide(nodes, unhide) {
    logIt('Utils::Hide:', ...arguments);
    let process;
    let processChildren;
    let processParents;
    let remove;
    let sum;
    if (unhide === null) {
      unhide = false;
    }
    sum = arr => arr.reduce(((acc, val) => acc + val), 0);
    remove = (arr, val) => {
      let pos;
      pos = arr.indexOf(val);
      if (pos >= 0) {
        return arr.splice(pos, 1);
      }
    };
    process = (node, val) => {
      if (unhide) {
        remove(node.hidden, val);
      } else {
        node.hidden.push(val);
      }
      return node.value = Math.max(node.originalValue - sum(node.hidden), 0);
    };
    processChildren = (node, val) => {
      if (!node.children) {
        return;
      }
      return node.children.forEach(child => {
        process(child, val);
        return processChildren(child, val);
      });
    };
    processParents = (node, val) => {
      let results;
      results = [];
      while (node.parent) {
        process(node.parent, val);
        results.push(node = node.parent);
      }
      // while (node.data.parent) {
      //   process(node.data.parent, val);
      //   results.push(node = node.data.parent);
      // }
      return results;
    };
    return nodes.forEach(node => {
      let val;
      val = node.originalValue;
      processParents(node, val);
      process(node, val);
      return processChildren(node, val);
    });
  }
};
class FlameGraph {
  constructor(selector, root, debug) {
    logIt('Constructor:', ...arguments);
    this._selector = selector;
    this._generateAccessors(['margin', 'cellHeight', 'zoomEnabled', 'zoomAction', 'tooltip', 'tooltipPlugin', 'color']);
    this._ancestors = [];
    if (debug == null) {
      debug = false;
    }
    if (debug) {
      this.console = window.console;
    } else {
      this.console = {
        log() {},
        time() {},
        timeEnd() {}
      };
    }
    this._size = [1200, 800];
    this._cellHeight = 20;
    this._margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
    this._color = d => {
      let val = hash(d.data.name);
      let r = 200 + Math.round(55 * val);
      let g = 0 + Math.round(230 * (1 - val));
      let b = 0 + Math.round(55 * (1 - val));
      return "rgb(" + r + ", " + g + ", " + b + ")";
    };
    this._tooltipEnabled = true;
    this._zoomEnabled = true;
    if (this._tooltipEnabled && d3Tip) {
      this._tooltipPlugin = d3Tip();
    }
    this.console.time('augment');
    this.original = FlameGraphUtils.augment(root, '0');
    this.console.timeEnd('augment');
    this.root(this.original);
  }

  size(size) {
    if (size) {
      this._size = size;
      select(this._selector).select('.flame-graph').attr('width', this._size[0]).attr('height', this._size[1]);
      return this;
    }
    return this._size;
  }

  root(root) {
    logIt('Root:', ...arguments);
    if (!root) {
      return this._root;
    }
    this.console.time('partition');
    this._root = root;
    this._data = FlameGraphUtils.partition(this._root);
    this._rootNode = this._data[0];
    this.console.timeEnd('partition');
    return this;
  }

  hide(predicate, unhide) {
    logIt('Hide:', ...arguments);
    let matches;
    if (unhide == null) {
      unhide = false;
    }
    matches = this.select(predicate, false);
    if (!matches.length) {
      return;
    }
    FlameGraphUtils.hide(matches, unhide);
    this._data = FlameGraphUtils.partition(this._root);
    return this.render();
  }

  zoom(node, event) {
    logIt('Zoom:', ...arguments);
    if (!this.zoomEnabled()) {
      throw new Error("Zoom is disabled!");
    }
    if (this.tip) {
      this.tip.hide();
    }
    if (indexOf.call(this._ancestors, node) >= 0) {
      this._ancestors = this._ancestors.slice(0, this._ancestors.indexOf(node));
    } else {
      // this._ancestors.push(node);
      this._ancestors.push(this._root);
    }
    this.root(node.data ? node.data : node).render();
    // this.root(node).render();
    if (typeof this._zoomAction === "function") {
      this._zoomAction(node, event);
    }
    return this;
  }

  width() {
    return this.size()[0] - (this.margin().left + this.margin().right);
  }

  height() {
    return this.size()[1] - (this.margin().top + this.margin().bottom);
  }

  label(d) {
    let label;
    if (!(d != null ? d.data.name : void 0)) {
      return "";
    }
    label = getClassAndMethodName(d.data.name);
    return label.substr(0, Math.round(this.x(d.x1 - d.x0) / (this.cellHeight() / 10 * 4)));
  }

  select(predicate, onlyVisible) {
    logIt('Select:', ...arguments);
    let result;
    if (onlyVisible == null) {
      onlyVisible = true;
    }
    if (onlyVisible) {
      return this.container.selectAll('.node').filter(predicate);
    } else {
      result = FlameGraphUtils.partition(this.original).filter(predicate);
      return result;
    }
  }

  render() {
    logIt('Render:', ...arguments);
    logIt('_data: ', this._data);
    let data;
    let existingContainers;
    let maxLevels;
    let newContainers;
    let ref;
    let renderNode;
    let visibleCells;
    if (!this._selector) {
      throw new Error("No DOM element provided");
    }
    this.console.time('render');
    if (!this.container) {
      this._createContainer();
    }
    this.fontSize = (this.cellHeight() / 10) * 0.4;

    console.log(this._data.map(d => d.data.name + ': ' + d.x0));
    logIt('sL min x0: ', min(this._data, d => d.x0), 'max: ', max(this._data, d => d.x1));
    let minX = this._rootNode.x0;
    let maxX = this._rootNode.x1;
    // this.x = scaleLinear().domain([
    //   0, max(this._data, function(d) {
    //     // min(this._data, d => d.x0), max(this._data, function(d) {
    //     logIt('..scaleLinear max d:', d.data.name, d.x0, d.x1, d);
    //     // return d.x0 + (d.x1 - d.x0)
    //     return d.x1;
    //   })
    // ]).range([0, this.width()]);

    this.x = scaleLinear().domain([
      0, max(this._data, function(d) {
        logIt('..scaleLinear max d:', d.data.name, d.x0, d.x1, d);
        return d.x1;
      })
    ]).range([0, this.width()]);

    logIt('minX:', minX, 'maxX:', maxX, this.x(minX), this.x(maxX), this._rootNode);
    logIt('root: ', this._root);

    visibleCells = Math.floor(this.height() / this.cellHeight());
    maxLevels = this._root.level;
    // maxLevels = max(this._data, d => d.depth);
    // console.log('before sQ this._data: ', this._data);
    console.log('maxLevels: ', maxLevels, 'min y0: ', min(this._data, d => d.y0), 'max: ', max(this._data, d => d.y0), 'range: ', range(maxLevels));

    this.y = scaleQuantize().domain([
      // 0, max(this._data, function(d) {
      min(this._data, d => d.y0), max(this._data, function(d) {
        // logIt('..scaleQuantize max d:', d.data.name, d.y0, d.y1, d);
        return d.y0;
      })
    ]).range(range(maxLevels).map((function(_this) {
      return function(cell) {
        logIt('..scaleQuantize range:', cell, (visibleCells - 1 - cell - (_this._ancestors.length)) * _this.cellHeight());
        // return ((cell + visibleCells) - (_this._ancestors.length + maxLevels)) * _this.cellHeight();
        return (visibleCells - 1 - cell - (_this._ancestors.length)) * _this.cellHeight();
        // return (visibleCells - cell - 1 - (_this._ancestors.length ? _this._ancestors.length - 1 : 0)) * _this.cellHeight();
      };
    })(this)));

    // console.log('after sQ this._data: ', this._data);
    data = this._data.filter((function(_this) {
      return function(d) {
        return _this.x(d.x1 - d.x0) > 0.4 && _this.y(d.y0) >= 0 && !d.data.filler;
      };
    })(this));
    logIt('after filter this._data: ', data);
    renderNode = {
      x: (function(_this) {
        return function(d) {
          let res = _this.x(d.x0);
          logIt('.. renderNode x:', d.data.name, d.x0, d.x1, res, d);
          return res;
          // return _this.x(d.x0);
          // return _this.x(d);
        };
      })(this),
      y: (function(_this) {
        return function(d) {
          let res = _this.y(d.y0);
          // logIt('.. renderNode y:', d.data.name, d.y0, res, d);
          return res;
          // return _this.y(d);
        };
      })(this),
      width: (function(_this) {
        return function(d) {
          let res = _this.x(d.x1 - d.x0);
          logIt('.. renderNode width:', d.data.name, d.x0, d.x1, d.x1 - d.x0, res, d);
          return res;
        };
      })(this),
      height: (function(_this) {
        return function(d) {
          return _this.cellHeight();
        };
      })(this),
      text: (function(_this) {
        return function(d) {
          if (d.data.name && _this.x(d.x1 - d.x0) > 40) {
            return _this.label(d);
          }
        };
      })(this)
    };
    logIt('container:', this.container);
    let nodes = this.container.selectAll('.node');
    let ndata = nodes.data(data, d => d.data.location);
    logIt('selectAll nodes, data:', nodes, ndata);
    existingContainers = this.container.selectAll('.node').data(data, d => d.data.location)
      .attr('class', 'node existing')
      .attr('zx0', d => d.x0)
      .attr('zx1', d => d.x1)
      .attr('zy0', d => d.y0)
      .attr('zy1', d => d.y1)
      .attr('zwidth', renderNode.width)
      .attr('zheight', this.cellHeight())
      .attr('zx', renderNode.x)
      .attr('zy', renderNode.y);

    logIt('existingContainers:', existingContainers);
    this._renderNodes(existingContainers, renderNode);
    newContainers = existingContainers.enter().append('g').attr('class', 'node');
    logIt('newContainers:', newContainers);
    this._renderNodes(newContainers, renderNode, true);
    existingContainers.exit().remove();
    if (this.zoomEnabled()) {
      this._renderAncestors()._enableNavigation();
    }
    if (this.tooltip()) {
      this._renderTooltip();
    }
    this.console.timeEnd('render');
    this.console.log(`Processed ${this._data.length} items`);
    // this.console.log(`Rendered ${(ref = this.container.selectAll('.node')[0]) != null ? ref.length : void 0} elements`);
    this.console.log("Rendered " + ((ref = this.container.selectAll('.node')[0]) != null ? ref.length : void 0) + " elements");
    console.log('LogData: ', logData);
    // console.log(JSON.stringify(logData));
    return this;
  }

  _createContainer() {
    logIt('_createContainer:', ...arguments);
    let offset;
    let svg;
    select(this._selector).select('svg').remove();
    svg = select(this._selector).append('svg').attr('class', 'flame-graph').attr('width', this._size[0]).attr('height', this._size[1]);
    offset = `translate(${this.margin().left}, ${this.margin().top})`;
    this.container = svg.append('g').attr('transform', offset);
    return svg.append('rect').attr('width', this._size[0] - (this._margin.left + this._margin.right)).attr('height', this._size[1] - (this._margin.top + this._margin.bottom)).attr('transform', offset).attr('class', 'border-rect');
  }

  _renderNodes(containers, attrs, enter) {
    logIt('_renderNodes:', ...arguments);
    let targetLabels;
    let targetRects;
    if (enter == null) {
      enter = false;
    }
    if (!enter) {
      targetRects = containers.selectAll('rect');
    }
    if (enter) {
      targetRects = containers.append('rect');
    }

    let renderFromParent = {
      x: (function(_this) {
        return function(d) {
          if (d.parentNode) {
            return d.parentNode.attr('zx0');
          }
          return attrs.x(d);
        };
      })(this),
      y: (function(_this) {
        return function(d) {
          if (d.parentNode) {
            return d.parentNode.attr('zy0');
          }
          return attrs.y(d);

        };
      })(this),
      width: (function(_this) {
        return function(d) {
          if (d.parentNode) {
            return d.parentNode.attr('zwidth')
          }
          // return attrs.width ? attrs.width(d) : _this.width();
          return _this.x(d.x1 - d.x0);
        };
      })(this),
      height: (function(_this) {
        return function(d) {
          return _this.cellHeight();
        };
      })(this),
      text: (function(_this) {
        return function(d) {
          if (d.data.name && _this.x(d.x1 - d.x0) > 40) {
            return _this.label(d);
          }
        };
      })(this)
    };

    logIt('targetRects before: ', targetRects);
    // let t = targetRects.attr('fill', (function(_this) {
    //   return function(d) {
    //     return _this._color(d);
    //   };
    // })(this));
    // logIt('t before transition: ', t, attrs);
    // t.transition().attr('width', attrs.width).attr('height', this.cellHeight()).attr('x', attrs.x).attr('y', attrs.y);
    // logIt('t after transition: ', t, attrs);
    targetRects.attr('fill', (function(_this) {
      return function(d) {
        return _this._color(d);
      };
      // })(this)).transition().attr('width', attrs.width).attr('height', this.cellHeight()).attr('x', attrs.x).attr('y',
      // attrs.y).attr('class', 'wtf');
      // })(this)).attr('width', attrs.width).attr('height', this.cellHeight()).attr('x', attrs.x).attr('y', attrs.y).attr('class', 'wtf');
    })(this)).attr('width', renderFromParent.width)
      .attr('height', this.cellHeight())
      .attr('x', renderFromParent.x)
      .attr('y', renderFromParent.y);
    logIt('targetRects after: ', targetRects);
    if (!enter) {
      targetLabels = containers.selectAll('text');
    }
    if (enter) {
      targetLabels = containers.append('text');
    }
    containers.selectAll('text').attr('class', 'label').style('font-size', this.fontSize + "em").transition().attr('dy', (this.fontSize / 2) + "em").attr('x', (function(_this) {
      return function(d) {
        return attrs.x(d) + 2;
      };
    })(this)).attr('y', (function(_this) {
      return function(d, idx) {
        return attrs.y(d, idx) + _this.cellHeight() / 2;
      };
    })(this)).text(attrs.text);
    return this;
  }

  _renderTooltip() {
    logIt('RenderTooltip:', ...arguments);
    if (!this._tooltipPlugin || !this._tooltipEnabled) {
      return this;
    }
    this.tip = this._tooltipPlugin.attr('class', 'd3-tip').html(this.tooltip()).direction(((_this => d => {
      if (_this.x(d.x0) + _this.x(d.x1 - d.x0) / 2 > _this.width() - 100) {
        return 'w';
      }
      if (_this.x(d.x0) + _this.x(d.x1 - d.x0) / 2 < 100) {
        return 'e';
      }
      return 's';
    }))(this)).offset(((_this => d => {
      let x;
      let xOffset;
      let yOffset;
      x = _this.x(d.x0) + _this.x(d.x1 - d.x0) / 2;
      xOffset = Math.max(Math.ceil(_this.x(d.x1 - d.x0) / 2), 5);
      yOffset = Math.ceil(_this.cellHeight() / 2);
      if (_this.width() - 100 < x) {
        return [0, -xOffset];
      }
      if (x < 100) {
        return [0, xOffset];
      }
      return [yOffset, 0];
    }))(this));
    this.container.call(this.tip);
    this.container.selectAll('.node').on('mouseover', (function(_this) {
      return function(d) {
        return _this.tip.show(d, event.currentTarget);
      };
    })(this)).on('mouseout', this.tip.hide).selectAll('.label').on('mouseover', (function(_this) {
      return function(d) {
        return _this.tip.show(d, event.currentTarget.parentNode);
      };
    })(this)).on('mouseout', this.tip.hide);
    return this;
  }

  _renderAncestors() {
    logIt('RenderAncestors:', ...arguments);
    let ancestor;
    let ancestorData;
    let ancestors;
    let idx;
    let j;
    let len;
    let newAncestors;
    let prev;
    let renderAncestor;
    if (!this._ancestors.length) {
      ancestors = this.container.selectAll('.ancestor').remove();
      return this;
    }
    ancestorData = this._ancestors.map((ancestor, idx) => ({
      name: ancestor.name,
      value: idx + 1,
      location: ancestor.location
    }));
    for (idx = j = 0, len = ancestorData.length; j < len; idx = ++j) {
      ancestor = ancestorData[idx];
      prev = ancestorData[idx - 1];
      if (prev) {
        prev.children = [ancestor];
      }
    }
    renderAncestor = {
      x: (function(_this) {
        return function(d) {
          return 0;
        };
      })(this),
      y: (function(_this) {
        return function(d) {
          return _this.height() - (d.value * _this.cellHeight());
        };
      })(this),
      width: this.width(),
      height: this.cellHeight(),
      text: (function(_this) {
        return function(d) {
          return "↩ " + (getClassAndMethodName(d.data.name));
        };
      })(this)
    };
    // ancestors = this.container.selectAll('.ancestor').data(d3.layout.partition().nodes(ancestorData[0]), function(d) {
    //   return d.location;
    // });

    ancestors = this.container.selectAll('.ancestor').data(
      // partition()(hierarchy(ancestorData[0])
      //   .sum(d => d.data ? d.data.value : d.value)
      //   .sort((a, b) => {
      //     if (a.filler) {
      //       return 1;
      //     }
      //     if (b.filler) {
      //       return -1;
      //     }
      //     return a.data.name.localeCompare(b.data.name);
      //   })).descendants(), d => d.location

      FlameGraphUtils.partition(ancestorData[0]), d => d.location
      // FlameGraphUtils.partition(this._ancestors[0]), d => d.location
      // partition().nodes(ancestorData[0]), d => d.location
    );

    // let anc = hierarchy(ancestorData[0]).sum(d => d.value);
    // ancestors = this.container.selectAll('.ancestor').data(
    //   partition(anc).descendants(), d => d.location
    // );

    this._renderNodes(ancestors, renderAncestor);
    newAncestors = ancestors.enter().append('g').attr('class', 'ancestor');
    this._renderNodes(newAncestors, renderAncestor, true);
    ancestors.exit().remove();
    return this;
  }

  _enableNavigation() {
    logIt('EnableNavigation:', ...arguments);

    let clickable;
    clickable = ((_this => d => {
      let ref;
      return Math.round(_this.width() - _this.x(d.x1 - d.x0)) > 0 && ((ref = d.children) != null ? ref.length : void 0);
    }))(this);

    this.container.selectAll('.node').classed('clickable', ((_this => d => clickable(d)))(this)).on('click', ((_this => d => {
      if (_this.tip) {
        _this.tip.hide();
      }
      if (clickable(d)) {
        return _this.zoom(d, event);
      }
    }))(this));
    this.container.selectAll('.ancestor').on('click', ((_this => (d, idx) => {
      if (_this.tip) {
        _this.tip.hide();
      }
      return _this.zoom(_this._ancestors[idx], event);
    }))(this));
    return this;
  }

  _generateAccessors(accessors) {
    logIt('GenerateAccessors:', ...arguments);
    let accessor;
    let j;
    let len;
    let results;
    results = [];
    for (j = 0, len = accessors.length; j < len; j++) {
      accessor = accessors[j];
      results.push(this[accessor] = ((accessor => function(newValue) {
        if (!arguments.length) {
          return this["_" + accessor];
        }
        this["_" + accessor] = newValue;
        return this;
      }))(accessor));
    }
    return results;
  }
}

export default FlameGraph;
