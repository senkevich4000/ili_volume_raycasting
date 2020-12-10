var THREE;
define(['three'], function(three) {
  THREE = three;
  return import('../node_modules/three/examples/js/controls/OrbitControls.js')
      .then(() => THREE.OrbitControls);
});
