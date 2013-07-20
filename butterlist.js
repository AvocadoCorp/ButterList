/**
 * @preserve
 *
 * ButterList version 0.1.0
 * http://github.com/AvocadoCorp/butterlist
 *
 * (c) 2013 Avocado Software, Inc.
 * ButterList is freely distributable under the MIT license.
 */

(function($) {

    /**
     *  @param {Object}       options
     *  @param {HTMLElement}  options.el
     *  @param {Array=}       options.items
     *  @param {Function=}    options.renderer
     */
    function ButterList(options) {
      this.$el = $(options.el);
      this.$topPadding = null;
      this.$bottomPadding = null;

      this.items = options.items || [];
      this.itemRenderer = options.renderer || null;
      this.ignoreScroll = false;

      this.rendered = false;

      this.$el.on('scroll', this.onScroll.bind(this));
      // If items were passed in, render
      if (this.items && this.items.length) {
        this.render();
      }
    };

    /**
     *  @description Add items to the end of the list
     *  @param {} item
     */
    ButterList.prototype.appendItem = function(item) {
      if (isArray(item)) {
        this.items.push.apply(this.items, item);
      } else {
        this.items.append(item);  
      }      
      if (this.rendered) {
        this.fullUpdate();
      }
      this.render();
    };

    /**
     *  @description Add items to the beginning of the list
     *  @param {} item
     */
    ButterList.prototype.prependItem = function(item) {
      if (isArray(item)) {
        this.items.unshift.apply(this.items, item);
      } else {
        this.items.unshift(item); 
      }
      if (this.rendered) {
        this.fullUpdate();
      }
      this.render();
    };

    /**
     *  @description Bind the rendering callback to the list
     *  @param {function(): HTMLElement} renderer
     */
    ButterList.prototype.bindItemRenderer = function(renderer) {
      this.itemRenderer = renderer;
    };

    /** @return {number} **/
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
      return heights.length ? average(heights) : 1;
    };

    /** @return {number} **/
    ButterList.prototype.getBottomPadHeight = function() {
      var itemsBelowCount = this.items.length - this.bottomItemIndex;
      return itemsBelowCount * this.getAverageItemHeight();
    };

    /** @return {number} **/
    ButterList.prototype.getTopPadHeight = function() {
      return this.topItemIndex * this.getAverageItemHeight();
    };

    /**
     *  @param {string} type
     *  @return {number}
     */
    ButterList.prototype.getPaddingFromType = function(type) {
      return type === 'top' ? this.$topPadding : this.$bottomPadding;
    };

    /** @description Called when a 'scroll' event is triggered **/
    ButterList.prototype.onScroll = function() {
      var delta = this.prevScrollTop - this.$el.scrollTop();
      this.prevScrollTop = this.$el.scrollTop();
      this.update(delta);
    };

    /** @description Removes all visible list items **/
    ButterList.prototype.removeItems = function() {
      this.$topPadding.nextUntil('.butterlist-padding-bottom').remove();
    };

    /** @description Remove top-most items that are no longer visible **/
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

    /** @description Initial render called to setup the list **/
    ButterList.prototype.render = function() {
      if (this.rendered) {
        return;
      }      

      this.itemHeights = {};

      this.averageHeight = null;

      this.$topItem = null;
      this.$bottomItem = null;
      this.topItemIndex = 0;
      this.bottomItemIndex = -1;

      this.prevScrollTop = 0;

      this.rendered = true;
      this.$topPadding = $('<div class="butterlist-padding-top"></div>').appendTo(this.$el);
      this.$bottomPadding = $('<div class="butterlist-padding-bottom"></div>').appendTo(this.$el);

      this.renderItemsBelow();
      this.updatePaddingBottom();
    };

    /** @description Render all items that should be visible given the current scroll state **/
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

    /** 
     * @description Render visible items above the current top-most rendered item 
     * TODO(Mike): This should be cleaned up 
     */
    ButterList.prototype.renderItemsAbove = function() {
      if (this.topItemIndex <= 0 || this.$topItem.position().top < 0) {
        return;
      }

      var $renderedItem = null;
      for (var i = this.topItemIndex - 1; i >= 0; i--) {
        $renderedItem = $(this.itemRenderer(this.items[i])).insertAfter(this.$topPadding).data('index', i);
        this.resizePadding('top', -$renderedItem.outerHeight());
        this.itemHeights[i] = $renderedItem.outerHeight();
        this.$topItem = $renderedItem;
        if ($renderedItem.position().top < 0) {
          break;
        }
      }

      this.topItemIndex = i;
    };

    /** @description Remove bottom-most items that are no longer visible **/
    ButterList.prototype.removeItemsBelow = function() {
      var itemsToRemove = [];
      var averageHeight = this.getAverageItemHeight();
      for (var i = this.bottomItemIndex; i > this.topItemIndex && i >= 0; i--) {
        var $prevItem = this.$bottomItem.prev();
        if ($prevItem === this.$topPadding || (this.$bottomItem.position().top - (averageHeight * 3)) < this.$el.outerHeight()) {
          break;
        } else {          
          itemsToRemove.push(this.$bottomItem);
        }
        this.bottomItemIndex = i - 1;
        this.$bottomItem = $prevItem;
      }
      itemsToRemove.forEach(function(item) { item.remove(); });
    };

    /** 
     * @description Render visible items below the current bottom-most rendered item
     * TODO(Mike): This should be cleaned up 
     */
    ButterList.prototype.renderItemsBelow = function() {
      var averageHeight = this.getAverageItemHeight();
      var outerHeight = this.$el.outerHeight() + averageHeight * 3;
      if (this.bottomItemIndex + 1 === this.items.length 
        || (this.$bottomItem && this.$bottomItem.position().top > outerHeight)) {
        return;
      }
      var $renderedItem = null;
      for (var i = this.bottomItemIndex + 1; i < this.items.length; i++) {
        $renderedItem = $(this.itemRenderer(this.items[i])).insertBefore(this.$bottomPadding).data('index', i);
        if (i === 0 || !this.$topItem) {
          this.$topItem = $renderedItem;
        }
        if (averageHeight === 1) {
          averageHeight = $renderedItem.height();
          outerHeight = this.$el.outerHeight() + averageHeight * 3;
        }
        this.resizePadding('bottom', -$renderedItem.outerHeight());
        this.itemHeights[i] = $renderedItem.outerHeight();
        this.$bottomItem = $renderedItem;
        if ($renderedItem.position().top > outerHeight) {
          break;
        }
      }
      this.bottomItemIndex = i;
    };

    /**
     *  @description Set the size of the top/bottom padding of the list
     *    Padding in this context is a div sized so that the scroll bar is 
     *    rendered in the proper location. 
     *  @param {string} type
     *  @param {number} pixels
     */
    ButterList.prototype.resizePadding = function(type, pixels) {
      var $padding = this.getPaddingFromType(type);
      $padding.height($padding.outerHeight() + pixels);
    };

    /** @description Scroll to top of the list **/
    ButterList.prototype.scrollToTopOfItems = function() {
      this.ignoreScroll = true;
      this.$el.scrollTop(this.getTopPadHeight());
    };

    /** @description Clear the rendered items, calculate our location, and rerender items.
     *    Useful when we want to do quick jumps on the list.
     */
    ButterList.prototype.fullUpdate = function() {      
      this.removeItems();
      this.topItemIndex = Math.round(this.$el.percentScrolledTop() * this.items.length);
      this.bottomItemIndex = Math.round(this.$el.percentScrolledBottom() * this.items.length);
      this.renderItems();
      this.updatePaddingTop();
      this.updatePaddingBottom();
      this.scrollToTopOfItems();
    };

    /**
     *  @description Set the items for the list and renders everything.
     *  @param {Array} items
     */
    ButterList.prototype.setItems = function(items) {
      this.rendered = false;
      this.items = items;
      this.$el.empty();
      this.render();
    };

    /**
     *  @description Take a scroll delta and call the proper rendering function
     *  @param {number} delta
     */
    ButterList.prototype.update = function(delta) {
      if (this.ignoreScroll) {
        this.ignoreScroll = false;
        return;
      }
      // Scrolling with scrollbar
      if (Math.abs(delta) > 500) {
        this.fullUpdate();
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
  
    /**
     *  @param {Object} options
     */
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

    /** @return {Array.<number>|number} **/
    $.fn.percentScrolledTop = function() {
      var vals = [];
      this.each(function() {
        vals.push(+($(this).scrollTop() / this.scrollHeight));
      });
      return vals.length === 1 ? vals[0] : vals;
    };
     
    /** @return {Array.<number>|number} **/
    $.fn.percentScrolledBottom = function() {
      var vals = [];
      this.each(function() {
        var $this = $(this);
        vals.push(($this.scrollTop() + $this.outerHeight())  / this.scrollHeight);
      });
      return vals.length === 1 ? vals[0] : vals;
    };

    /** 
     *  @param {Array.<number>} array
     *  @return {number}
     */
    function average(array) {
      var sum = 0;
      for (var i = 0; i < array.length; i++) {
        sum += array[i];
      }
      return sum / array.length;
    }

    /**
     *  @param {Object} obj
     *  @return {bool}
     */
    function isArray(obj) {
      return obj instanceof Array;
    }

}).call(this, window.jQuery);