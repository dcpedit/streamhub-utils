define(function(require) {
var Backbone = require('backbone'),
    Mustache = require('mustache'),
    isotope = require('isotope'),
    ContentView = require('streamhub-backbone/views/ContentView'),
    sources = require('streamhub-backbone/const/sources'),
    QueueProcessor = require('QueueProcessor'),
    StreamController = require('StreamController');

var IsotopeView = Backbone.View.extend({

    initialize: function (opts) {
        var self = this;
        this._contentViewOpts = opts.contentViewOptions || {};
        this._sourceOpts = opts.sources || {};
        this._isotopeOpts = opts.isotope || {};
        this._collectionList = [];
        this.maxLoads = opts.maxLoads;
        this.skipInsert = opts.skipInsert || false;
        this.init = $.Deferred();
        this.$el.addClass(this.className);

        this.addQueue = new QueueProcessor(this.processItems, this);
        this.streamCtrl = new StreamController();

        // Handle single collection mode
        if (this.collection) {
          this.collection._isotope = this;
          this.collection.on('add', this._addItem);
        }

        var isotopeOptions = _.extend(this._isotopeOpts, {
            itemSelector: '.hub-item',
            transformsEnabled: true,
            getSortData : {
                index : function( $item ) {
                    return 0 - $item.attr('data-hub-createdAt');
                }
            },
            sortBy : 'index'
        });

        // Initialize the jQuery-Isotope plugin
        this.$el.isotope(isotopeOptions);
        this.init.resolve();
        return this;
    },

    tagName: "div",

    className: "hub-IsotopeView",

    relayout: function (callback) {
        this.$el.isotope('reLayout', callback);
    },

    clear: function(callback) {
      this.$el.isotope('remove', $(this._isotopeOpts.itemSelector), callback);
    },

    _addItem: function (item) {
      var collection = this // points to collection
      var iso = collection._isotope;
      var opts = collection._sdkCollection.opts;
      item.set('articleId', opts.articleId);
      item.set('siteId', opts.siteId);
      item.set('collection', collection); // points back to orig collection
      iso.addQueue.push(item);
    },

    addCollection: function(opts) {
      var collection = this.streamCtrl.addCollection(opts);
      collection._isotope = this;
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
      var el, self = this, items = $(), item;
      for (var i = 0; i < list.length; i++) {
        item = list[i];
        if (el = this._insertItem(item)) {
          items = items.add(el);
        }
        // TODO: Test memory usage
        // item.get('collection').remove(item);
      }

      this.init.done(function() {
        items.imagesLoaded(function() {
          var err = $('img.error').closest('.hub-content');
          if (err.length) {
            // reLayout automatic when removing
            self.$el.isotope('remove', err);
          }
          else {
            self.relayout();
          }
          self.$el.trigger('allImagesLoaded', [items]);
        });
        if (!self.skipInsert) {
          self.$el.isotope('insert', items);
        }
        self.$el.trigger('allDataLoaded', [items]);
      });
    },

    filter: function(css) {
      var self = this;
      this.init.done(function() {
        self.$el.isotope({filter: css});
      });
    }
});

IsotopeView.prototype.getElementByContentId = function (contentId) {
    var $elements = this.$el.find('*[data-hub-contentid="'+contentId+'"]');
    if ($elements.length===0) {
        return false;
    }
    return $elements;
};

IsotopeView.prototype._insertItem = function (item) {
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

$.extend( $.Isotope.prototype, {
  filteredAtoms : function(callback) {
    callback(this.$filteredAtoms);
  },

  fakeInsert: function () {
    var atoms = this.$filteredAtoms;
    var first = parseInt(atoms.eq(0).attr('data-hub-createdAt'));
    var last = atoms.eq(atoms.length - 1).attr('data-hub-createdAt', first + 1);
    this.updateSortData(last);
    this._sort();
    this.reLayout();
  }
});

return IsotopeView;
});
