dojo.provide('agsjs.layers.FilteredTiledLayer');
(function() {
  if (!window.Pixastic) {
    // only include minimal filters: invert and desaturate. If need more, include the pixastic.all.js in header before require this.
    var src = dojo.moduleUrl("agsjs", "pixastic/pixastic.min.js");
    var s = dojo.create("script", {
      type: "text/javascript",
      src: src
    });
    dojo.doc.getElementsByTagName("head")[0].appendChild(s);
  }
}());

dojo.declare("agsjs.layers.FilteredTiledLayer", esri.layers.ArcGISTiledMapServiceLayer, {

  map: null,
  action: null,
  _div: null,
  _nodes: [],
  /**
   * 
   * @param {Object} url
   * @param {Object} opts: {filter:'invert|desaturate', options:{see params for each filter}}
   */
  constructor: function(url, opts) {
    
    opts = opts || {};
    this.filter = opts.filter;
    this.params = opts.options;
  },
  // override parent method
  _setMap: function(map, layersDiv, index, a, b, c) {
    this._div = this.inherited(arguments);
    this._map = map;
    this._zoomHandle = dojo.connect(this._map, 'onZoomEnd', this, this._cleanNodes);
    this._updateHandle = dojo.connect(this, 'onUpdateEnd', this, this._applyFilter);
    return this._div;
  },
  // override parent method
  _unsetMap: function(map, layersDiv) {
    this.inherited(arguments);
    dojo.disconnect(this._zoomHandle);
    dojo.disconnect(this._updateHandle);
    this._cleanNodes();
  },
  // override parent method
  getTileUrl: function(level, row, column) {
    var url = this.inherited(arguments);
    // IE can apply filter across domain.
    if (!dojo.isIE && this.filter && this.url.indexOf('//' + document.location.host + '/') == -1) {
      if (!esri.config.defaults.io.proxyUrl) {
        throw 'cross domain service must config proxy page'
      } else {
        url = esri.config.defaults.io.proxyUrl + '?' + url;
      }
    }
    return url;
  },
  _applyFilter: function() {
    dojo.query('img[src*="' + this.url + '"]', this._div).forEach(function(node, index, arr) {
      if (Pixastic && this.filter && node._pixastic != this.filter) {
        try {
          Pixastic.process(node, this.filter, this.params, dojo.hitch(this, function(result) {
            this._nodes.push(result);
          }));
          // for IE, node is still same img.
          node._pixastic = this.filter;
        } catch (e) {
          alert(dojo.toJson(e));
          if (console) 
            console.error(e);
        }
        
      }
    }, this);
    
  },
  _cleanNodes: function() {
    dojo.forEach(this._nodes, function(n) {
      if (n && n.parentNode) {
        n.parentNode.removeChild(n);
      }
      dojo.destroy(n);
    });
    this._nodes.length = 0;
    
  }
  
  
});
