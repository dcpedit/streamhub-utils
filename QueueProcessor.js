define(function() {

function compare(a, b) {
  return b.get('event') - a.get('event');
}

var QueueProcessor = function(processor, ctx, delay) {
  // Private
  var _Q = [], _timer = null;
  var _pause = false;

  function processQ() {
    if (_timer) {
      clearTimeout(_timer);
    }
    _timer = setTimeout(expired, delay || 50);
  }

  function expired() {
    if (!_pause) {
      _timer = null;
      _Q.sort(compare);
      processor.call(ctx, _Q);
      _Q.splice(0, _Q.length);
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
