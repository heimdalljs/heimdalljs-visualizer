"use strict";define("heimdalljs-visualizer/app",["exports","ember","heimdalljs-visualizer/resolver","ember-load-initializers","heimdalljs-visualizer/config/environment"],function(e,t,i,a,n){var r=void 0;t.default.MODEL_FACTORY_INJECTIONS=!0,r=t.default.Application.extend({modulePrefix:n.default.modulePrefix,podModulePrefix:n.default.podModulePrefix,Resolver:i.default}),(0,a.default)(r,n.default.modulePrefix),e.default=r}),define("heimdalljs-visualizer/components/basic-tree",["exports","ember","ember-network/fetch","d3-selection","d3-hierarchy","d3-zoom"],function(e,t,i,a,n,r){function l(e){var t=new Array(e.length);return e.forEach(function(e){t[e._id]=e}),t}var s=(t.default.$,t.default.run),o=t.default.get;e.default=t.default.Component.extend({classNames:["basic-tree"],init:function(){this._super.apply(this,arguments),this._lastGraphPath=null,this._graphData=null},didReceiveAttrs:function(){var e=this,t=o(this,"graphPath"),a=o(this,"graphData");if(this._lastGraphPath!==t&&t&&((0,i.default)(t).then(function(e){return e.json()}).then(function(t){return e.processRawData(t)}),this._lastGraphPath=t),this._lastGraphData!==a&&a){var n=JSON.parse(a);this.processRawData(n),this._lastGraphData=a}},processRawData:function(e){this._graphData={nodesById:l(e.nodes),nodes:e.nodes},s.schedule("render",this,this.drawTree,this._graphData)},nodeFilter:function(e){return e.id.broccoliNode},drawTree:function(e){function t(){return r.zoomIdentity.translate(60,0).scale(.14)}var i=this,l=(0,a.select)(this.element.querySelector(".svg-container")).append("svg").attr("preserveAspectRatio","xMinYMin meet").attr("viewBox","0 0 300 300").classed("svg-content",!0),s=l.append("g"),o=(0,n.hierarchy)(e.nodes[0],function(t){return t.children.map(function(t){return e.nodesById[t]}).filter(i.nodeFilter)}).sum(function(e){return e.stats.time.self}),d=this.element,u=d.clientHeight,f=d.clientWidth,c=(0,n.tree)().size([u,f]);c(o),s.selectAll(".link").data(o.descendants().slice(1)).enter().append("path").attr("class","link").attr("d",function(e){return"M"+e.y+","+e.x+"C"+(e.parent.y+100)+","+e.x+" "+(e.parent.y+100)+","+e.parent.x+" "+e.parent.y+","+e.parent.x});var p=s.selectAll(".node").data(o.descendants()).enter().append("g").attr("class",function(e){return"node"+(e.children?" node--internal":" node--leaf")}).attr("transform",function(e){return"translate("+e.y+","+e.x+")"});p.append("circle").attr("r",2.5),p.append("text").attr("dy",3).attr("x",function(e){return e.children?-8:8}).style("text-anchor",function(e){return e.children?"end":"start"}).text(function(e){return e.data.id.name});var m=(0,r.zoom)().scaleExtent([.1,3]).on("zoom",function(){s.attr("transform",a.event.transform)});l.call(m.transform,t()),l.call(m)}})}),define("heimdalljs-visualizer/components/welcome-page",["exports","ember-welcome-page/components/welcome-page"],function(e,t){Object.defineProperty(e,"default",{enumerable:!0,get:function(){return t.default}})}),define("heimdalljs-visualizer/controllers/application",["exports","ember"],function(e,t){e.default=t.default.Controller.extend({init:function(){this._super.apply(this,arguments),this.graphData=null},actions:{parseFile:function(e){var t=this,i=new FileReader;i.onload=function(e){var i=e.target.result;t.set("graphData",i)},i.readAsText(e.target.files[0])}}})}),define("heimdalljs-visualizer/helpers/app-version",["exports","ember","heimdalljs-visualizer/config/environment"],function(e,t,i){function a(){return n}e.appVersion=a;var n=i.default.APP.version;e.default=t.default.Helper.helper(a)}),define("heimdalljs-visualizer/helpers/pluralize",["exports","ember-inflector/lib/helpers/pluralize"],function(e,t){e.default=t.default}),define("heimdalljs-visualizer/helpers/singularize",["exports","ember-inflector/lib/helpers/singularize"],function(e,t){e.default=t.default}),define("heimdalljs-visualizer/initializers/app-version",["exports","ember-cli-app-version/initializer-factory","heimdalljs-visualizer/config/environment"],function(e,t,i){var a=i.default.APP,n=a.name,r=a.version;e.default={name:"App Version",initialize:(0,t.default)(n,r)}}),define("heimdalljs-visualizer/initializers/container-debug-adapter",["exports","ember-resolver/container-debug-adapter"],function(e,t){e.default={name:"container-debug-adapter",initialize:function(){var e=arguments[1]||arguments[0];e.register("container-debug-adapter:main",t.default),e.inject("container-debug-adapter:main","namespace","application:main")}}}),define("heimdalljs-visualizer/initializers/data-adapter",["exports","ember"],function(e,t){e.default={name:"data-adapter",before:"store",initialize:function(){}}}),define("heimdalljs-visualizer/initializers/ember-data",["exports","ember-data/setup-container","ember-data/-private/core"],function(e,t,i){e.default={name:"ember-data",initialize:t.default}}),define("heimdalljs-visualizer/initializers/export-application-global",["exports","ember","heimdalljs-visualizer/config/environment"],function(e,t,i){function a(){var e=arguments[1]||arguments[0];if(i.default.exportApplicationGlobal!==!1){var a;if("undefined"!=typeof window)a=window;else if("undefined"!=typeof global)a=global;else{if("undefined"==typeof self)return;a=self}var n,r=i.default.exportApplicationGlobal;n="string"==typeof r?r:t.default.String.classify(i.default.modulePrefix),a[n]||(a[n]=e,e.reopen({willDestroy:function(){this._super.apply(this,arguments),delete a[n]}}))}}e.initialize=a,e.default={name:"export-application-global",initialize:a}}),define("heimdalljs-visualizer/initializers/injectStore",["exports","ember"],function(e,t){e.default={name:"injectStore",before:"store",initialize:function(){}}}),define("heimdalljs-visualizer/initializers/store",["exports","ember"],function(e,t){e.default={name:"store",after:"ember-data",initialize:function(){}}}),define("heimdalljs-visualizer/initializers/transforms",["exports","ember"],function(e,t){e.default={name:"transforms",before:"store",initialize:function(){}}}),define("heimdalljs-visualizer/instance-initializers/ember-data",["exports","ember-data/-private/instance-initializers/initialize-store-service"],function(e,t){e.default={name:"ember-data",initialize:t.default}}),define("heimdalljs-visualizer/resolver",["exports","ember-resolver"],function(e,t){e.default=t.default}),define("heimdalljs-visualizer/router",["exports","ember","heimdalljs-visualizer/config/environment"],function(e,t,i){var a=t.default.Router.extend({location:i.default.locationType,rootURL:i.default.rootURL});a.map(function(){}),e.default=a}),define("heimdalljs-visualizer/templates/application",["exports"],function(e){e.default=Ember.HTMLBars.template({id:"lvOucR2Z",block:'{"statements":[["open-element","input",[]],["static-attr","type","file"],["dynamic-attr","onchange",["helper",["action"],[["get",[null]],"parseFile"],null],null],["flush-element"],["close-element"],["text","\\n\\n"],["text","\\n"],["append",["helper",["basic-tree"],null,[["graphPath"],["/broccoli-viz-files/initial-build-canary-20161220.json"]]],false],["text","\\n\\n"],["append",["unknown",["outlet"]],false],["text","\\n"]],"locals":[],"named":[],"yields":[],"blocks":[],"hasPartials":false}',meta:{moduleName:"heimdalljs-visualizer/templates/application.hbs"}})}),define("heimdalljs-visualizer/templates/components/basic-tree",["exports"],function(e){e.default=Ember.HTMLBars.template({id:"44pJ8rtq",block:'{"statements":[["open-element","div",[]],["static-attr","class","svg-container"],["flush-element"],["text","\\n"],["close-element"]],"locals":[],"named":[],"yields":[],"blocks":[],"hasPartials":false}',meta:{moduleName:"heimdalljs-visualizer/templates/components/basic-tree.hbs"}})}),define("heimdalljs-visualizer/config/environment",["ember"],function(e){var t="heimdalljs-visualizer";try{var i=t+"/config/environment",a=document.querySelector('meta[name="'+i+'"]').getAttribute("content"),n=JSON.parse(unescape(a)),r={default:n};return Object.defineProperty(r,"__esModule",{value:!0}),r}catch(e){throw new Error('Could not read config from meta tag with name "'+i+'".')}}),runningTests||require("heimdalljs-visualizer/app").default.create({name:"heimdalljs-visualizer",version:"0.5.0+26dbc73b"});