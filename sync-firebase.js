"use strict";

angular.module("firebase", ["SyncResource"]);
angular.module("firebase").factory("firebaseProtocol",
  ["$q", "$timeout", "$differ", "$binderTypes", "syncEvents",
  function($q, $timeout, $differ, $binderTypes, $syncEvents) {

  function FirebaseProtocol(url) {
    this._ref = new Firebase(url);
  }

  FirebaseProtocol.prototype.change = function (binder, delta) {
    // If a type is not specified on the delta this will be called.
    if (angular.equals(delta.newVal, delta.oldVal)) {
      return;
    }
    if (binder._firebase.collection) {
      var data = delta.data;
      if (typeof data != typeof []) {
        throw new Error("Collection created, but data is not an array");
      }
      for (var i = 0; i < data.length; i++) {
        var id = binder._firebase.collection[i];
        binder._firebase.ref.child(id).set(data[i]);
      }
    } else {
      binder._firebase.ref.set(delta.data);
    }
  };

  FirebaseProtocol.prototype.subscribe = function(binder, cb) {
    if (!binder.query || !binder.query.path) {
      throw new Error("No path provided, required by Firebase protocol");
    }
    binder._firebase = {
      ref: this._ref.child(binder.query.path),
      local: false
    };

    // If binder.type was set to collection, add methods to the model.
    if (binder.type && binder.type == $binderTypes.COLLECTION) {
      this._makeCollection(binder);
      binder._firebase.collection = {};
    }

    // Add value event listener.
    binder._firebase.cb = binder._firebase.ref.on("value", function(snap) {
      if (binder._firebase.collection) {
        var idx = 0;
        var val = binder.scope[binder.model];
        snap.forEach(function(childSnap) {
          binder._firebase.collection[idx] = childSnap.name();
          val[idx++] = childSnap.val();
        });
        Array.prototype.splice.call(val, idx, val.length);
      } else {
        val = snap.val();
      }
      cb.call(this, {type: $syncEvents.UPDATE, data: val});
    });
  };

  FirebaseProtocol.prototype.unsubscribe = function(binder, cb) {
    binder._firebase.ref.off("value", binder._firebase.cb);
    delete binder._firebase;
  };

  FirebaseProtocol.prototype._makeCollection = function(binder) {
    var model = binder.scope[binder.model];
    if (!model) {
      model = [];
    }
    // Overriding array methods.
    model.push = function(val) {
      binder._firebase.ref.push(val);
      return model.length;
    };
    model.splice = function(idx, len) {
      var ret = [];
      if (idx <= model.length && len > 0) {
        for (var i = 0; i < len; i++) {
          ret.push(model[idx + i]);
          var id = binder._firebase.collection[idx + i];
          binder._firebase.ref.child(id).remove();
        }
      }
      if (arguments.length > 2) {
        for (var j = 0; j < arguments.length - 2; j++) {
          binder._firebase.ref.push(arguments[j + 2]);
        }
      }
      return ret;
    };
  };

  return function(url) {
    return new FirebaseProtocol(url);
  }
}]);
