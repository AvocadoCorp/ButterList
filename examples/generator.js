(function() {
  window.GenerateData = function() {
      var data = [];
      for (var i = 0; i < Math.random() * 10000000000; i++) {
        data.push(i);
      }
      return data;
  };

  window.console.object = function(obj) {
    console.log(JSON.stringify(obj, null, 4));
  };
}).call(this);