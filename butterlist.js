(function($) {

    function ButterList(options) {
      this.$el = $(options.el);
      this.$topPadding = null;
      this.$bottomPadding = null;

      this.items = options.items || [];
      this.itemHeights = {};
      this.itemRenderer = options.renderer || null;
      this.ignoreScroll = false;

      this.averageHeight = null;

      this.topItemIndex = null;
      this.$topItem = null;
      this.bottomItemIndex = null;
      this.$bottomItem = null;

      this.prevScrollTop = 0;

      this.$el.on('scroll', this.onScroll.bind(this));
      // If items were passed in, render
      if (this.items) {
        this.render();
      }
    };

    ButterList.prototype.appendItem = function(item) {
      throw new Error('Not implemented yet.');
    };

    ButterList.prototype.prependItem = function(item) {
      throw new Error('Not implemented yet.');
    };

    ButterList.prototype.bindItemRenderer = function(renderer) {
      this.itemRenderer = renderer;
    };

    ButterList.prototype.getAverageItemHeight = function() {
      if (this.averageHeight) {
        return this.averageHeight;
      }
      var heights = [];
      var iterator = 0;
      for (var key in this.itemHeights) {
        heights.push(this.itemHeights[key]);
        // Stop after 100. If this turns out terrible, make it better.
        if (++iterator === 100) {
          this.averageHeight = average(heights);
          break;
        }
      }
      return average(heights);
    };

    ButterList.prototype.getBottomPadHeight = function() {
      var itemsBelowCount = this.items.length - this.bottomItemIndex;
      return itemsBelowCount * this.getAverageItemHeight();
    };

    ButterList.prototype.getTopPadHeight = function() {
      return this.topItemIndex * this.getAverageItemHeight();
    };

    ButterList.prototype.getPaddingFromType = function(type) {
      return type === 'top' ? this.$topPadding : this.$bottomPadding;
    };

    ButterList.prototype.onScroll = function() {
      var delta = this.prevScrollTop - this.$el.scrollTop();
      this.prevScrollTop = this.$el.scrollTop();
      this.update(delta);
    };

    ButterList.prototype.removeItems = function() {
      this.$topPadding.nextUntil('.butterlist-padding-bottom').remove();
    };

    ButterList.prototype.removeItemsAbove = function() {
      var itemsToRemove = [];
      for (var i = this.topItemIndex; i < this.bottomItemIndex && i < this.items.length; i++) {
        var $nextItem = this.$topItem.next();
        if ($nextItem === this.$bottomPadding || this.$topItem.position().top >= -5) {
          break;
        }
        else {
          itemsToRemove.push(this.$topItem);
        }
        this.topItemIndex = i + 1;
        this.$topItem = $nextItem;
      }
      itemsToRemove.forEach(function(item) { item.remove(); });
    };

    ButterList.prototype.render = function() {
      this.$topPadding = $('<div class="butterlist-padding-top"></div>').appendTo(this.$el);
      this.$bottomPadding = $('<div class="butterlist-padding-bottom"></div>').appendTo(this.$el);
      this.topItemIndex = 0;
      this.bottomItemIndex = -1;
      this.renderItemsBelow();
      this.updatePaddingBottom();
    };

    ButterList.prototype.renderItems = function() {
      var $rendered = null;
      for (var i = this.topItemIndex; i <= this.bottomItemIndex && i < this.items.length; i++) {
        $rendered = $(this.itemRenderer(this.items[i])).insertBefore(this.$bottomPadding).data('index', i);
        if (i === this.topItemIndex) {
          this.$topItem = $rendered;
        }
      }
      this.$bottomItem = $rendered;
    };

    ButterList.prototype.renderItemsAbove = function() {
      if (this.topItemIndex <= 0 || this.$topItem.position().top < 0) {
        return;
      }

      var $renderedItem = null;
      for (var i = this.topItemIndex - 1; i >= 0; i--) {
        $renderedItem = $(this.itemRenderer(this.items[i])).insertAfter(this.$topPadding).data('index', i);
        this.resizePadding('top', -$renderedItem.height());
        this.itemHeights[i] = $renderedItem.height();
        this.$topItem = $renderedItem;
        if ($renderedItem.position().top < 0) {
          break;
        }
      }

      this.topItemIndex = i;
    };

    ButterList.prototype.removeItemsBelow = function() {
      var itemsToRemove = [];
      var averageHeight = this.getAverageItemHeight();
      for (var i = this.bottomItemIndex; i > this.topItemIndex && i >= 0; i--) {
        var $prevItem = this.$bottomItem.prev();
        if ($prevItem === this.$topPadding || (this.$bottomItem.position().top - averageHeight) < this.$el.height()) {
          break;
        } else {          
          itemsToRemove.push(this.$bottomItem);
        }
        this.bottomItemIndex = i - 1;
        this.$bottomItem = $prevItem;
      }
      itemsToRemove.forEach(function(item) { item.remove(); });
    };

    ButterList.prototype.renderItemsBelow = function() {
      if (this.bottomItemIndex + 1 === this.items.length 
        || (this.$bottomItem && this.$bottomItem.position().top > this.$el.height())) {
        return;
      }

      var $renderedItem = null;
      for (var i = this.bottomItemIndex + 1; i < this.items.length; i++) {
        $renderedItem = $(this.itemRenderer(this.items[i])).insertBefore(this.$bottomPadding).data('index', i);
        if (i === 0 || !this.$topItem) {
          this.$topItem = $renderedItem;
        }        
        this.resizePadding('bottom', -$renderedItem.height());
        this.itemHeights[i] = $renderedItem.height();
        this.$bottomItem = $renderedItem;
        if ($renderedItem.position().top > this.$el.height()) {
          break;
        }
      }

      this.bottomItemIndex = i;
    };

    ButterList.prototype.resizePadding = function(type, pixels) {
      var $padding = this.getPaddingFromType(type);
      $padding.height($padding.height() + pixels);
    };

    ButterList.prototype.scrollbarUpdate = function() {      
      this.removeItems();
      this.topItemIndex = Math.round(this.$el.percentScrolledTop() * this.items.length);
      this.bottomItemIndex = Math.round(this.$el.percentScrolledBottom() * this.items.length);
      this.renderItems();
      this.updatePaddingTop();
      this.updatePaddingBottom();
      this.ignoreScroll = true;
      this.$el.scrollTop(this.getTopPadHeight());
    };

    ButterList.prototype.setItems = function(items) {
      this.items = items;
      this.$el.empty();
      this.render();
    };

    ButterList.prototype.update = function(delta) {
      if (this.ignoreScroll) {
        this.ignoreScroll = false;
        return;
      }
      // Scrolling with scrollbar
      if (Math.abs(delta) > 200) {
        this.scrollbarUpdate();
      }       
      // Scrolling down
      else if (delta < 0) {
        this.renderItemsBelow();
        this.removeItemsAbove();
        this.updatePaddingTop();
      } 
      // Scrolling up
      else {
        this.renderItemsAbove();
        this.removeItemsBelow();
        this.updatePaddingBottom();
      }
    };

    ButterList.prototype.updatePaddingBottom = function() {
      this.$bottomPadding.height(this.getBottomPadHeight());
    };

    ButterList.prototype.updatePaddingTop = function() {
      this.$topPadding.height(this.getTopPadHeight());
    };

    /*** jQuery methods ***/
  
    $.fn.butterlist = function(options) {
      var butterlists = [];
      options = options || {};
      this.each(function() {
        var $this = $(this);
        var data = $this.data('list');
        if (!data) {
          $this.data('list', (data = new ButterList({
            el: this,
            items: options.items,
            renderer: options.renderer
          })));
        }
        butterlists.push(data);
      });
      return butterlists.length === 1 ? butterlists[0] : butterlists;
    };

    $.fn.percentScrolledTop = function() {
      var vals = [];
      this.each(function() {
        vals.push(+($(this).scrollTop() / this.scrollHeight));
      });
      return vals.length === 1 ? vals[0] : vals;
    };
     
    $.fn.percentScrolledBottom = function() {
      var vals = [];
      this.each(function() {
        var $this = $(this);
        vals.push(($this.scrollTop() + $this.height())  / this.scrollHeight);
      });
      return vals.length === 1 ? vals[0] : vals;
    };

    function average(array) {
      var sum = 0;
      for (var i = 0; i < array.length; i++) {
        sum += array[i];
      }
      return sum / array.length;
    }

}).call(this, window.jQuery);