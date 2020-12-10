define(['three'], function(three) {
  return import('../node_modules/three/examples/jsm/loaders/NRRDLoader.js')
      .then((module) => module.NRRDLoader);
});
