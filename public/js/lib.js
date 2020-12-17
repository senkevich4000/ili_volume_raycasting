define(['three', 'constants'], function(three, constants) {
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
      return left < right ? left : right;
    }

    function maxCompare(left, right) {
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

  function VolumeRenderingSettings() {
    this.shapeColormapName = constants.PathToGrayColormap;
    this.intensityColormapName = constants.PathToViridisColormap;

    this.renderStyle = RenderStyle.raycast;
    this.scaleMode = ScaleMode.linear;

    this.relativeStepSize = 1.0;
    this.uniformalOpacity = 1.0;
    this.uniformalStepOpacity = 0.6;
    this.proportionalOpacityEnabled = 1;
    this.lightingEnabled = 1;

    this.backgroundColor = constants.MainCameraBackgroundColor;

    return this;
  }

  function calculateNormalValue(value, bounds) {
    return (value - bounds.min) / (bounds.max - bounds.min);
  }

  return {Bounds, RenderStyle, ScaleMode, VolumeRenderingSettings, calculateNormalValue};
});
