!function() {

var CBuffer = function(size) {
  var _buffer = new Array(size);
  var _head = null;
  var _tail = null;
  var _full = false;
  var _events = {};

  var isArray = Array.isArray || function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  function push(item) {
    if (_head === null) {
      _head = 0;
      _tail = 0;
    }
    else {
      _head++;
    }

    if (_full) {
      trigger('overwrite', _buffer[_tail++]);
    }

    _head %= size;
    _tail %= size;

    if (!_full && (_head+1) == size) {
      _full = true;
      trigger('full', item);
    }

    _buffer[_head] = item;
  }

  function trigger(evName, data) {
    var events = _events[evName] || [];
    var length = events.length;
    for (var i = 0; i < length; i++) {
      events[i](data);
    }
  }

  this.size = function() {
    return _full ? size : _head === null ? 0 : _head + 1;
  };

  this.add = function() {
    var length = arguments.length;
    for (var i = 0; i < length; i++) {
      var item = arguments[i];

      if (isArray(item)) {
        this.add.apply(this, item);
      }
      else {
        push(item);
        trigger('add', item);
      }
    }
  };

  this.remove = function(item) {
    var idx = _buffer.indexOf(item);
    if (idx >= 0) {
      trigger('remove', _buffer[idx]);
      _buffer.splice(idx, 1);      
      _buffer.splice(_head, 0, null)
      _full = false;
      _head--;
    }
  }

  this.empty = function() {
    _head = _tail = null;
    _full = false;
  }

  this.get = function() {
    var count = 0;
    var i = _tail;
    var rt = [];
    var sz = this.size();

    while (count++ < sz) {
      rt.push(_buffer[i++]);
      i %= size;
    }

    return rt;
  };

  this.isFull = function() {
    return _full;
  };

  this.indexOf = function(item) {
    var arr = this.get();
    var found = -1;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === item) {
        found = i;
      }
    }
    return found;
  };

  this.on = function(evName, fn) {
    if (!_events[evName]) _events[evName] = [];
    _events[evName].push(fn);
  };

  this.off = function(evName, fn) {
    var events = _events[evName] || [];
    var idx = events.indexOf(fn);
    if (idx >= 0) events.splice(idx, 1);
  };
}

if (typeof define == 'function') {
  define(function() {return CBuffer});
}
else if (typeof module == 'object') {
  return module.exports = CBuffer;
}
else if (typeof window == 'object') {
  window.CircularBuffer = CBuffer;
}

}();
