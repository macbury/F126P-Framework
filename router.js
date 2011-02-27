/**
 * @author Arkadiusz Buras
 */
var params = {};

function Router () {
  this._timer = null;
}

$.extend(Router.prototype, {
  _timer: null,
  last_url: null,
  routes: {},
  PATH_REPLACER: /([^\/]+)/,
  PATH_NAME_MATCHER: /:([\w\d]+)/g,
  QUERY_STRING_MATCHER: /\?([^#]*)$/,
})

Router.prototype.run = function () {
  var self = this;
  if (self._timer) {
    clearInterval(self._timer);
    self._timer = null;
  };
  this._timer = setInterval(function () {
    self.update();
  }, 100);
}

Router.prototype.root = function (callback) {
  this.match("#!/", {
    as: "root",
    callback: callback
  });
}

Router.prototype.match = function (path, options) {
  var options = $.extend({
    callback: function () {},
    as: null,
  }, options);
  
  var self = this;
  
  if (options['as']) {
    window[options['as']+"_path"] = function (p) {
      var url = path;
      var url_vals = url.match(self.PATH_NAME_MATCHER);
      
      if (url_vals) {
        $.each(url_vals, function(){
          var var_name = this.replace(":", "");
          var value = p[var_name];
          url = url.replace(this, escape(value));
          delete p[var_name];
        });
        
        var ap = $.param(p);
        if (ap.length > 0) {
          url = [url, ap].join("?");
        }
        
      }
      
      return url;
    }
  };
  
  self.routes[path] = options['callback'];
}

Router.prototype.redirect_to = function (url) {
  window.location.hash = url;
}

Router.prototype.refresh = function () {
  var self = this;
  var url = window.location.hash;
  var query = url.match(self.QUERY_STRING_MATCHER);
  params = {};
  
  if (query) {
    url = url.replace(self.QUERY_STRING_MATCHER, "");
    query = query[1];

    $.each(query.split("&"), function() {
      var k = this.split("=")[0];
      var v = this.split("=")[1];
      params[k] = unescape(v.replace(/\+/g, " "));
    });
  }
  
  var callback = null;
  for(path in self.routes) {
    var route = new RegExp("^" + path.replace(self.PATH_NAME_MATCHER, "([a-z0-9\+]+)") + "$", "i");
    var values = url.match(route);
    var keys = path.match(self.PATH_NAME_MATCHER);
    
    if (values) {
      if (keys) {
        for (var i=0; i < keys.length; i++) {
          var value = values[i+1];
          var key = keys[i].replace(":", "");
          params[key] = unescape(value.replace(/\+/g, " "));
        };
      }
      
      callback = self.routes[path];
      break;
    }
  }
  
  if (callback) {
    callback();
  } else {
    self.onError404();
  }
}

Router.prototype.onError404 = function () {
  this.redirect_to(root_path());
}

Router.prototype.update = function () {
  var current_url = window.location.hash;
  if (current_url != this.last_url) {
    this.last_url = current_url;
    this.refresh();
  };
}