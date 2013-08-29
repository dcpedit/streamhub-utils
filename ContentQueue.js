define([
  'backbone',
  'underscore',
  'streamhub-backbone/models/Content'
],
function ( Backbone, _, Content) {
  var QueueCollection = Backbone.Collection.extend({
    model: Content,
    comparator: function (item) {
      return item.get('createdAt');
    }
  });

  var Queue = Backbone.Model.extend({
    oldestTime: 9999999999999,
    timer: 0,
    loadCount: 0,
    types: ['newer', 'older', 'all'],

    initialize: function() {
      var self = this;
      _.each(self.types, function(type) {
        self[type] = new QueueCollection();
      });
    },

    add: function(item) {
      var self = this;
      self.all.add(item);
      if (item.get('createdAt') > self.oldestTime) {
        self.newer.add(item);
      }
      else {
        self.older.add(item);
      }
      self.itemAdded();
    },

    itemAdded: function() {
      var self = this;
      if (self.timer) {
        clearTimeout(self.timer);
      }
      self.timer = setTimeout(function() {
        self.expired();
      }, self.delay || 10);
    },

    expired: function() {
      var self = this;
      var len = self.all.length;
      self.loadCount++;

      if (len) {
        var created = self.all.at(0).get('createdAt');
        if (created < self.oldestTime) {
          self.oldestTime = created;
        }
      }
      self.timer = 0;

      _.each(self.types, function(type) {
        if (type !== 'all' && self[type + 'Paused']) {
          self.trigger('count:' +type, self[type].length);
        }
        else {
          self.trigger('items:' + type, self[type], self.loadCount);
          self.trigger('count:' + type, 0);
          self[type] = new QueueCollection();
        }
      });
    },

    pause: function(type) {
      this[type + 'Paused'] = true;
    },

    resume: function(type) {
      this[type + 'Paused'] = false;
      this.expired();
    }
  });

  return Queue;
});
