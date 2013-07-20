jQuery ButterList
==========
ButterList is a jQuery plugin for rendering/manipulating lists of any size without slowing down the browser.
  
Initialization
--------------
Using the ButterList plugin is straightforward. To use the plugin, provide an array and a function that knows how to render a member of the array. **Note**: You don't need to provide data or the renderer at initialization, those can be set at any point during the life of the ButterList.
  
```javascript
$('#list').butterlist({
  renderer: function(item) {
    return '<li>' + item + '</li>';
  },
  items: [1, 2, 3, 4, 5, 6, 7, 8]
});
```
  
Public API
----------
  
### <code>appendItem(object|array)</code>

Appends an object or array of objects to the end of the list.

### <code>prependItem(object|array)</code>

Prepends an object or array of objects to the beginning of the list.

### <code>bindItemRenderer(function)</code>

Provide the function to call when an a list item needs to be rendered. The function should take one paramater, an item from the array provided, and return a string or object that can be used in a jQuery append() call.

### <code>setItems(array)</code>

Sets the array of objects that will be rendered, one at a time, by the renderer function. You can call `setItems` as many times as you would like with new or updated data. When `setItems` is called, it will clear any existing data/HTML and will begin rendering the new data from the start of the array.

  
Requirements
------------
A modern flavor of jQuery. Probably something like 1.8.x. Built and tested with 1.10.2.
  
License
-------
ButterList is freely distributable under the MIT license. See LICENSE.txt for full license.
