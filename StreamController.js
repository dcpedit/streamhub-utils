define(function(require) {
  var Backbone = require('backbone');
  var Hub = require('streamhub-backbone');
  var StreamController = Backbone.Model.extend({

    activeId: null,

    initialize: function(opts) {
      var self = this;
    },

    addCollection: function(opts) {
      var self = this;
      var coll = new Hub.Collection();
      self.set(opts.articleId, {
        opts: opts,
        collection: coll,
        loadCount: 0
      });
      return coll;
    },

    switchTo: function(id) {
      var self = this;
      var active; 
      if (id === self.activeId) return;

      if (self.activeId) {
        active = self.get(self.activeId);
        if (active.collection._sdkCollection) {
          active.collection.stop();
        }
      }
      self.activeId = id;
      active = self.get(id)

      if (active.collection._sdkCollection) {
        // Start previous stream
        active.collection.start();
      }
      else {
        // Create new stream
        active.collection.setRemote(active.opts);
      }
      return active;
    },

    loadMore: function(id, max) {
      var self = this;
      id = id || self.activeId;
      if (!id) return;

      var active = self.get(id);
      if (max && active.loadCount == max) return;

      active.collection.loadMore();
      active.loadCount++;
      return active.loadCount;
    }

  });

  return StreamController;
});
