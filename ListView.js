define(function(require) {
var Backbone = require('backbone'),
    Mustache = require('mustache'),
    isotope = require('isotope'),
    ContentView = require('streamhub-backbone/views/ContentView'),
    sources = require('streamhub-backbone/const/sources'),
    QueueProcessor = require('QueueProcessor'),
    StreamController = require('StreamController'),
    $ = require('jquery');

var ListView = Backbone.View.extend({

    initialize: function (opts) {
        var self = this;
        this._contentViewOpts = opts.contentViewOptions || {};
        this._sourceOpts = opts.sources || {};
        this._onAdd = opts.onAdd;
        this.maxLoads = opts.maxLoads;
        this.init = $.Deferred();
        this.$el.addClass(this.className);
        this.$count = opts.countDisplay;

        this.addQueue = new QueueProcessor(this.processItems, this);
        this.streamCtrl = new StreamController();

        if (opts.onDemand) {
          this.addQueue.pause();
        }

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
      item.set('collection', collection); // points back to orig collection
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
      //this.addQueue.pause();
      if (typeof list == "number") {
        this.displayCount.html(list);
        return;
      }
      var el, self = this, items = $(), item;
      for (var i = 0; i < list.length; i++) {
        item = list[i];
        if (el = this._insertItem(item)) {
          items = items.add(el);
        }
        // TODO: Test memory usage
        // item.get('collection').remove(item);
      }

      if (self._onAdd) {
        self._onAdd(items);
      }
      else {
        self.$el.prepend(items);
      }
    },

    filter: function(css) {
      var self = this;
      this.init.done(function() {
        self.$el.isotope({filter: css});
      });
    }
});

ListView.prototype.getElementByContentId = function (contentId) {
    var $elements = this.$el.find('*[data-hub-contentid="'+contentId+'"]');
    if ($elements.length===0) {
        return false;
    }
    return $elements;
};

ListView.prototype._insertItem = function (item) {
    var self = this,
        newItem = $('<'+self.tagName+'/>');
        json = item.toJSON();
    
    if (!json.author) {
        // TODO: These may be deletes... handle them.
        // console.log("DefaultView: No author for Content, skipping");
        return;
    }
    if (self.getElementByContentId(item.get('id'))) {
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
      .addClass('hub-item ' + item.get('articleId'))
      .attr('data-hub-createdAt', json.createdAt)
      .attr('data-hub-contentId', json.id);

    //this.$el.isotope('insert', newItem);
    return newItem;
};

return ListView;
});
