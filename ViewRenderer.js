define(function(require) {
var Backbone = require('backbone'),
    Mustache = require('mustache');

var Renderer = Backbone.Model.extend({

  compiled: null,

  initialize: function (template, opts) {
    this.opts = opts || {};
    if (typeof template == 'function') {
      this.compiled = template;
    }
    if (typeof template == 'string') {
      this.compiled = Mustache.compile(template);
    }
  },

  normalize: function (data) {
    if (data.authorId.match(/twitter\.com$/)) {
      data.author.twitterUserId = data.author.id.split(/@/).shift();
      if (data.author.avatar) {
        data.author.avatar = data.author.avatar.replace(/_normal\./, '_bigger.');
      }
      data.tweetId = data.id.match(/\d+/).pop();
      data.twitterUser = data.author.profileUrl.split(/\/#!\//).pop();
      data.author.screenName = decodeURIComponent(data.twitterUser);
      data.itemClass = "item-twitter";
    }
    else if (data.authorId.match(/instagram\.com$/)) {
      data.itemClass = "item-instagram";
      if (data.attachments) {
        delete data.bodyHtml;
      }
    }
    return data;
  },

  html: function(data) {
    this.normalize(data);
    return this.compiled(data);
  },

  template: function() {
    var self = this;
    return function(data) {
      return self.html(data);
    }
  },

  resize: function(html, w) {
    var width = html.match(/width=(['"]\d+['"])/i);
    var height = html.match(/height=(['"]\d+['"])/i);
    if (width && height) {
      width = width.pop();
      height = height.pop();
      width = width.replace(/\d+/, w + '');
      html = html.replace(/width=['"]\d+['"]/i, 'width=' + width);
    }
  }

});

return Renderer;
});
