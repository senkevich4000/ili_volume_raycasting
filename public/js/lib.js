define(['three'], function(three) {
  function Bounds(min, max) {
    this.min = min;
    this.max = max;

    return this;
  }

  Bounds.prototype.asVector = function() {
    return new three.Vector2(this.min, this.max);
  };

  Bounds.fromArray = function(data) {
    const min = data.reduce(minCompare, Number.MAX_VALUE);
    const max = data.reduce(maxCompare, Number.MIN_VALUE);

    return new Bounds(min, max);

    function minCompare(left, right) {
      if (isNaN(left)) {
        return right;
      }
      if (isNaN(right)) {
        return left;
      }
      return left < right ? left : right;
    }

    function maxCompare(left, right) {
      if (isNaN(left)) {
        return right;
      }
      if (isNaN(right)) {
        return left;
      }
      return left > right ? left : right;
    }
  };

  const RenderStyle = {
    raycast: 0,
    steps_debug: 1,
  };
  Object.freeze(RenderStyle);

  const ScaleMode = {
    linear: 0,
    sqrt: 1,
    log: 2,
  };
  Object.freeze(ScaleMode);

  return {Bounds, RenderStyle, ScaleMode};
});
