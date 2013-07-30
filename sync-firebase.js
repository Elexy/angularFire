"use strict";

angular.module("firebase", ["SyncResource"]);
angular.module("firebase").factory("firebaseProtocol", ["$q", "$differ", "syncEvents", function($q, $differ, $syncEvents) {
  function FirebaseProtocol(url) {
    this._ref = new Firebase(url);
  }
  FirebaseProtocol.prototype.create = function(binder, delta) {

  };
  FirebaseProtocol.prototype.read = function(binder) {

  };
  FirebaseProtocol.prototype.update = function(binder, delta) {

  };
  FirebaseProtocol.prototype.remove = function(binder, delta) {

  };
  FirebaseProtocol.prototype.change = function (binder, delta) {
    // If a type is not specified on the delta this will be called.
    if (angular.equals(delta.newVal, delta.oldVal)) {
      return;
    }
    // TODO: Find diff for [] and {} and only send child events.
    binder.firebaseRef.set(delta.data);
  };
  FirebaseProtocol.prototype.subscribe = function(binder, cb) {
    if (!binder.query || !binder.query.path) {
      throw new Error("No path provided, required by Firebase protocol");
    }
    // For objects and arrays, we need to use child events.
    // For all other types, we use a simple value callback. (For now use value for all)
    binder.firebaseRef = this._ref.child(binder.query.path);
    binder.firebaseRef.on("value", function(snap) {
      var val = snap.val();
      if (val !== null) {
        cb.call(this, {
          type: $syncEvents.UPDATE,
          data: snap.val()
        });
      }
    });
  };
  FirebaseProtocol.prototype.unsubscribe = function(binder, cb) {
    // XXX: Because we don't have isolated refs, this will also turn off
    // events for all other listeners at this path?
    binder.firebaseRef.off("value");
  };

  return function(url) {
    return new FirebaseProtocol(url);
  }
}]);
