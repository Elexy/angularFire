casper.test.comment("Testing TODO example with syncResource and Firebase");

casper.start("tests/test_todo.html", function() {
  this.test.assertTitle("AngularFire TODO Test");
});

casper.thenEvaluate(function() {
  // Clean up Firebase to start fresh test.
  var fbRef = new Firebase(_url);
  fbRef.set(null, function(err) {
    window.__flag = true;
  });
});

casper.waitFor(function() {
  return this.getGlobal("__flag") === true;
});

casper.waitFor(function() {
  return this.evaluate(function() {
    return _scope != null;
  });
});

casper.then(function() {
  var _testTodo = "Eat some Chocolate";

  this.test.assertEval(function(title) {
    _scope.newTodo = title;
    _scope.addTodo();
    _scope.$digest();
    return _scope.newTodo == "";
  }, "Adding a new TODO", _testTodo);

  this.waitForSelector(".todoView", function() {
    this.test.assertEval(function(todo) {
      return testIfInDOM(todo, document.querySelector(".todoView"));
    }, "Testing if TODO is in the DOM", {title: _testTodo, completed: false});
  });
});

casper.then(function() {
  this.evaluate(function() {
    _scope.todos[0].completed = true;
    _scope.$digest();
  });
  this.waitFor(function() {
    return this.evaluate(function() {
      return document.querySelector(".todoView").childNodes[1].checked === true;
    });
  });
});

casper.then(function() {
  var _testTodo = "Run for 10 miles";

  this.test.assertEval(function(title) {
    _scope.todos.push({title: title, completed: false});
    _scope.$digest();
    return _scope.newTodo == "";
  }, "Adding another TODO", _testTodo);

  this.waitFor(function() {
    return this.evaluate(function() {
      return document.querySelectorAll(".todoView").length == 2;
    });
  });
});

casper.run(function() {
  this.test.done();
});
