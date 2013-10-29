define(function(require) {
var Backbone = require('backbone'),
    Mustache = require('mustache'),
    _ = require('underscore'),
    ContentView = require('streamhub-backbone/views/ContentView'),
    sources = require('streamhub-backbone/const/sources'),
    QueueProcessor = require('streamhub-utils/QueueProcessor'),
    ContentQueue = require('streamhub-utils/ContentQueue'),
    StreamController = require('streamhub-utils/StreamController'),
    $ = require('jquery');

var ListView = Backbone.View.extend({
  initialize: function (opts) {
    var self = this;
    self.opts = opts || {};
    this._contentViewOpts = opts.contentViewOptions || {};
    this._sourceOpts = opts.sources || {};
    this.maxLoads = opts.maxLoads;
    if (this.$el) {
      this.$el.addClass(this.className);
    }
    this.$count = opts.countDisplay;

    this.addQueue = new QueueProcessor(this.processItems, this, opts.delay);
    this.contentQueue = new ContentQueue(),
    this.streamCtrl = new StreamController();

    // Handle single collection mode
    var queue = this.contentQueue;
    if (this.collection) {
      this.collection._lib = this;
      if (opts.v == 2) {
        this.collection.on('add', queue.add, queue);
      }
      else {
        this.collection.on('add', this._addItem);
      }
    }

    queue.on('items:newer', function(list, loadCount) {
      var items = self.renderList(list);
      self.trigger('items:newer', items, loadCount);
    });
    queue.on('items:older', function(list, loadCount) {
      var items = self.renderList(list);
      self.trigger('items:older', items, loadCount);
    });
    queue.on('count:newer', function(num) {
      self.trigger('count:newer', num);
    });

    return this;
  },

  tagName: "div",

  className: "hub",

  _addItem: function (item, arg1, arg2, arg3, arg4) {
    var collection = this // points to collection
    var lib = collection._lib;
    var opts = collection._sdkCollection.opts;
    item.set('articleId', opts.articleId);
    item.set('siteId', opts.siteId);
    // TODO: change to event to prevent json recursion
    item.on('remove:item', function() {collection.remove(item)}); // points back to orig collection
    lib.addQueue.push(item);
    lib.contentQueue.add(item);
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

  renderList: function(list) {
    var self = this,
        items = [],
        el;

    list.each(function(item) {
      self.options.reverse;
      if (el = self._insertItem(item)) {
        items.unshift(el);
      }
    });

    return items;
  },

  processItems: function(list) {
    var el, self = this, items = [], item;

    if (typeof list == "number") {
      self.trigger('dataChanged', list);
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
      //item.trigger('remove:item');
    }

    if (self.$el) {
      self.$el.prepend(items);
    }
    self.trigger('dataChanged', 0, list.length);
    self.trigger('allDataLoaded', items);
  },

  pause: function() {
    this.addQueue.pause();
    this.contentQueue.pause('newer');
  },

  resume: function() {
    this.addQueue.resume();
    this.contentQueue.resume('newer');
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

  // Update when model has changed
  item.on('change', function() {
    var prev = newItem.data('json');
    newItem.data('json', _.extend(prev, item.toJSON()));
  });

  return newItem;
};

return ListView;
});
