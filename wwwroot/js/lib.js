import {Vector2} from './node_modules/three/build/three.module.js';


function Bounds(min, max) {
  this.min = min;
  this.max = max;

  return this;
}

Bounds.prototype.asVector = function() {
  return new Vector2(this.min, this.max);
};

Bounds.fromArray = function(data) {
  const min = data.reduce((left, right) => left < right ? left : right, Number.MAX_VALUE);
  const max = data.reduce((left, right) => left > right ? left : right, Number.MIN_VALUE);

  return new Bounds(min, max);
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

export {Bounds, RenderStyle, ScaleMode};
