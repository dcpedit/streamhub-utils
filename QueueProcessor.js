define(function() {

var QueueProcessor = function(processor, ctx) {
  // Private
  var _Q = [], _timer = null;
  var _pause = false;

  function processQ() {
    if (_timer) {
      clearTimeout(_timer);
    }
    _timer = setTimeout(expired, 10);
  }

  function expired() {
    if (!_pause) {
      _timer = null;
      processor.call(ctx, _Q);
      //_Q.reset();
    }
    else {
      processor.call(ctx, _Q.length);
    }
  }

  // Public
  this.push = function(item) {
    _Q.push(item);
    processQ();
  };

  this.pause = function() {
    _pause = true;
  };

  this.resume = function() {
    _pause = false;
    expired();
  };
};

return QueueProcessor;

});
