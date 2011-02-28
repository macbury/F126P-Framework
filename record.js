/**
 * @author Arkadiusz Buras
 */

Record.ExistingRecord = 0;
Record.NewRecord = 1;
Record.UpdatedRecord = 2;
Record.DeletedRecord = 3;

function Record(setup_callback) {
  this._attrs = [];
  this._record_name = "Record";
  this._dirty_changes = {};
  this._relations = {};
  this._type = Record.NewRecord;
  
  setup_callback.apply(this);
  var record = this;
  
  var new_record = function(attributes) {
    $.extend(this, record);
    
    this.ChangeTypeTo(Record.NewRecord);
    this.attr("id", Number);
    this.initialize(attributes);
  }
  
  $.extend(new_record, {
    all: function(options){
      var options = $.extend({
        url: "/record",
        data: { format: "JS" },
        callback: function (records) {}
      }, options);
      
      $.ajax({
        url: options["url"],
        dataType: "JSON",
        data: options["data"],
        success: function(data){
          var records = [];
          for (var i=0; i < data.length; i++) {
            var raw_record = data[i];
            var r = new new_record(raw_record);
            records.push(r);
          };
          
          options["callback"](records);
        },
        
        error: function(){
          options["callback"]([]);
        },
      })
    },
  });
  
  return new_record;
}

Record.prototype.attr = function (name, type) {
  this[name] = type();
  this._attrs.push(name);
  this.build_setters(name, type())
}

Record.sexyName = function(name) {
  var name = name[0].toUpperCase() + name.substring(1, name.length);
  var parts = name.split('_'), len = parts.length;
  if (len == 1) return parts[0];
  var camelized = name.charAt(0) == '_'
    ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1)
    : parts[0];

  for (var i = 1; i < len; i++)
    camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);

  return camelized;
}

Record.prototype.ChangeTypeTo = function (new_type) {
  if (new_type == Record.ExistingRecord) {
    this.dirty_changes = {};
  };
  this._type = new_type;
}

Record.prototype.isRecordType = function (r_type) {
  return this._type == r_type;
}

Record.prototype.build_setters = function (key, value) {
  var methods = {};
  var self = this;
  methods["get"+Record.sexyName(key)] = function () {
    return this[key];
  }
    
  methods["set"+Record.sexyName(key)] = function (new_value) {
    if (this[key] != new_value) {
      this.ChangeTypeTo(Record.UpdatedRecord);
      if (this.dirty_changes[key] == null) {
        this.dirty_changes[key] = [];
      }
      this.dirty_changes[key].push(this[key]);
      this.dirty_changes[key].push(new_value);
      this[key] = new_value;
    };
    
    return new_value;
  }
  
  methods["have"+Record.sexyName(key)] = function () {
    if (typeof(self[key]) == "object") {
      return (self[key].length > 0);
    } else {
      return self[key] != null;
    }
  }
  
  $.extend(this, methods);
}

Record.prototype.name = function (name) {
  this._record_name = name;
}

Record.prototype.to_param = function () {
  return this._build_param_from_object(this._attrs, this._record_name);
}

Record.prototype._build_param_from_object = function (attributes, prefix) {
  var param = [];
  var self = this;
  
  for (key in attributes) {
    var value = self[key];
    
    if (value != null) {
      if (key[0] != "_" || key != "id") {
        if (self._relations[key] != null) {

        } else if (typeof(value) == "object") {
          param.push(self._build_param_from_object(value, prefix+ "["+key+"]"));
        } else {
          param.push(prefix+ "["+key+"]="+value);
        }
      }
    }
  }
  
  return param.join("&");
}

Record.prototype.initialize = function (args) {
  if (args[this._record_name]) {
    args = args[this._record_name];
  }
  for(key in args) {
    this[key] = args[key];
  }
}

Record.prototype.has_many = function (options) {
  var options = $.extend({
    key: "record_id",
    name: "record",
  }, options);
  
  var relation_name = options["name"].toLowerCase().pluralize();
  
  this[relation_name] = function (callback) {
    callback([]);
  }
}