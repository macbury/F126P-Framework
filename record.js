Record.ExistingRecord = 0;
Record.NewRecord = 1;
Record.UpdatedRecord = 2;
Record.DeletedRecord = 3;

function Record(new_attributes, relations, name) {
  var self = this;
  self._relations = relations || {};
  self._attrs = [];
  self._record_name = name;
  self._error_count = 0;
  self.dirty_changes = {};
  var mixin = window[Record.sexyName(self._record_name + "_record")];
  if (mixin != undefined) {
    $.extend(this, mixin);
  }
  
  $.each(new_attributes, function (key, value) {
    self._attrs.push(key);
    
    self.build_setters(key, value);
    
    self[key] = value;
    if (relations[key] != undefined) {
      self[key] = self.BuildRelation(key,value);
    }
  });
  
  this._type = Record.ExistingRecord;
}

Record.prototype.build_setters = function (key, value) {
  var methods = {};
  var self = this;
  methods["get"+Record.sexyName(key)] = function () {
    return self[key];
  }
    
  methods["set"+Record.sexyName(key)] = function (new_value) {
    if (self[key] != new_value) {
      self.ChangeTypeTo(Record.UpdatedRecord);
      if (self.dirty_changes[key] == null) {
        self.dirty_changes[key] = [];
      }
      self.dirty_changes[key].push(self[key]);
      self.dirty_changes[key].push(new_value);
      self[key] = new_value;
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

Record.prototype.Changes = function () {
  return this.dirty_changes;
}

Record.prototype.RelationsRecords = function () {
  var out = [];
  var self = this;
  
  for( key in self._relations ) {
    if (self[key] != null) {
      for (var i=0; i < self[key].length; i++) {
        var record = self[key][i];
        out.push({ _relation_key: [key, record] });
      }
    }
  }
  
  
  return out;
}

Record.prototype.BuildRelation = function (relation_key, raw_records) {
  var relation = this._relations[relation_key];
  var self = this;
  var records = [];
  $.each(raw_records, function (key, atributes) {
    var record = new Record(atributes, {}, self._record_name);
    record._record_name = relation["name"];
    record[self._record_name] = self;
    records.push(record);
  });
  
  self["new"+Record.sexyName(relation["name"])] = function (attributes) {
    var record = new Record(attributes, {}, relation["name"]);
    record._record_name = relation["name"];
    record.ChangeTypeTo(RestDataSource.NewRecord);
    record[self._record_name] = self;
    records.push(record);
  }
  
  return records;
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

Record.prototype.UpdateAttributes = function (attributes) {
  var record = this;
  var modified = false;
  
  $.each(attributes, function (key, value) {
    if (record[key] != value) {
      modified = true;
    }
    record.build_setters(key, value);
    record[key] = value;
  });
  
  if (modified) {
    this._type = Record.UpdatedRecord;
  }
}

Record.prototype.attributes = function () {
  var out = {};
  var self = this;
  $.each(this._attrs, function (index, key) {
    out[key] = self[key];
  });
  
  return out;
}

Record.prototype.to_param = function () {
  return this._build_param_from_object(this.attributes(), this._record_name);
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