define(function(require) {
  var Utils = {
    ContentQueue: require('streamhub-utils/ContentQueue'),
    CircularBuffer: require('streamhub-utils/CircularBuffer'),
    GridView: require('streamhub-utils/GridView'),
    QueueProcessor: require('streamhub-utils/QueueProcessor'),
    ViewRenderer: require('streamhub-utils/ViewRenderer'),
    ContentQueue: require('streamhub-utils/ContentQueue'),
    ListView: require('streamhub-utils/ListView'),
    StreamController: require('streamhub-utils/StreamController'),

    pad0: function(num, length) {
      num = '' + num;
      for (var i = num.length; i < length; i++) {
        num = '0' + num;
      }
      return num;
    },

    idToString: function(_id) {
      _id = _id || this._id;
      if (!_id || typeof _id == 'string') return _id;
      var hex = '';
      $.each(_id ? _id.bytes : this._id.bytes, function(idx, value) {
        hex += Utils.pad0(value.toString(16), 2);
      });
      return hex;
    },

    extendMoment: function(moment) {
      moment.fn.fromNowDetailed = function (a) {
        var diff = Math.abs(moment().diff(this));
        if (diff < 45000) { // 60s
            return Math.round(diff/1000) + ' seconds ago';
        }
        return this.fromNow(a);
      }
    }
  };
  
  return Utils;
});
