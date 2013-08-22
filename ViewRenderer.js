define(function(require) {
var Backbone = require('backbone'),
    Mustache = require('mustache');

var Renderer = Backbone.Model.extend({

  initialize: function (template, opts) {
    this.opts = opts || {};
    this.compiled = Mustache.compile(template);
  },

  html: function(data) {
    var opts = this.opts;

    if (data.authorId.match(/twitter\.com$/)) {
      data.author.twitterUserId = data.author.id.split(/@/).shift();
      data.tweetId = data.id.match(/\d+/).pop();
      data.twitterUser = data.author.profileUrl.split(/\/#!\//).pop();
      data.itemClass = "item-twitter";
      //if (opts.width && data.attachments && data.attachments.html) {
      //  data.attachments.html = this.resize(data.attachments.html, opts.width);
      //}
    }
    else if (data.authorId.match(/instagram\.com$/)) {
      data.itemClass = "item-instagram";
      if (data.attachments) {
        delete data.bodyHtml;
      }
    }
   
    if (data.twitterUser) {
      if (data.twitterUser.match(/^iyanlavanzant$/i)) {
          data.itemUserClass = "item-user-iyanla";
      } else if (data.twitterUser.match(/^oprah$/i)) {
          data.itemUserClass = "item-user-oprah";
      }
    }
     
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
