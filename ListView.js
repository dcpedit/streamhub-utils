define(function(require) {
var Backbone = require('backbone'),
    Mustache = require('mustache'),
    ContentView = require('streamhub-backbone/views/ContentView'),
    sources = require('streamhub-backbone/const/sources'),
    QueueProcessor = require('QueueProcessor'),
    StreamController = require('StreamController'),
    $ = require('jquery');

var ListView = Backbone.View.extend({

    initialize: function (opts) {
        var self = this;
        self.opts = opts || {};
        this._contentViewOpts = opts.contentViewOptions || {};
        this._sourceOpts = opts.sources || {};
        this.maxLoads = opts.maxLoads;
        this.init = $.Deferred();
        this.$el.addClass(this.className);
        this.$count = opts.countDisplay;

        this.addQueue = new QueueProcessor(this.processItems, this);
        this.streamCtrl = new StreamController();

        // Handle single collection mode
        if (this.collection) {
          this.collection._lib = this;
          this.collection.on('add', this._addItem);
        }

        return this;
    },

    tagName: "div",

    className: "hub",

    _addItem: function (item) {
      var collection = this // points to collection
      var lib = collection._lib;
      var opts = collection._sdkCollection.opts;
      item.set('articleId', opts.articleId);
      item.set('siteId', opts.siteId);
      // TODO: change to event to prevent json recursion
      item.on('remove:item', function() {collection.remove(item)}); // points back to orig collection
      lib.addQueue.push(item);
    },

    addCollection: function(opts) {
      var collection = this.streamCtrl.addCollection(opts);
      collection._lib = this;
      collection.on('add', this._addItem)
      return collection;
    },

    switchTo: function(id) {
      return this.streamCtrl.switchTo(id);
    },

    loadMore: function(max) {
      return this.streamCtrl.loadMore(null, max || this.maxLoads);
    },

    processItems: function(list) {
      var el, self = this, items = [], item;

      if (typeof list == "number") {
        if (self.opts.onChange) {
          self.opts.onChange(list);
        }
        return;
      }
      if (self.opts.reverse) {
        list.reverse();
      }
      for (var i = 0; i < list.length; i++) {
        item = list[i];
        if (el = this._insertItem(item)) {
          items.push(el);
        }
        // TODO: Test memory usage
        item.trigger('remove:item');
      }

      if (self.opts.onAdd) {
        self.opts.onAdd(items);
      }
      else {
        self.$el.prepend(items);
      }
      if (self.opts.onChange) {
        self.opts.onChange(0, list.length);
      }
    },

    pause: function() {
      this.addQueue.pause();
    },

    resume: function() {
      this.addQueue.resume();
    }
});

ListView.prototype._insertItem = function (item) {
    var self = this,
        newItem = $('<'+self.tagName+'/>');
        json = item.toJSON();
    
    if (!json.author) {
        // TODO: These may be deletes... handle them.
        return;
    }

    function _getContentViewOpts (content) {
        var opts = {},
            configuredOpts = _(opts).extend(self._contentViewOpts),
            perSourceOpts;
        if (content.get('source')==sources.TWITTER) {
            return _(configuredOpts).extend(self._sourceOpts.twitter||{});
        }
        if (content.get('source')==sources.RSS) {
            return _(configuredOpts).extend(self._sourceOpts.rss||{});
        }
        if (content.get('source')==sources.STREAMHUB) {
            return _(configuredOpts).extend(self._sourceOpts.ugc||{});
        }
        return configuredOpts;
    }

    var cv = new ContentView(_.extend({
        model: item,
        el: newItem
    }, _getContentViewOpts(item)));

    newItem
      .data('json', json)
      .addClass('hub-item ' + item.get('articleId'))
      .attr('data-hub-createdAt', json.createdAt)
      .attr('data-hub-contentId', json.id);

    return newItem;
};

return ListView;
});
