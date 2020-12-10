requirejs.config({
  paths: {
    'main': 'main',
    'three': 'node_modules/three/build/three',
    'orbitControls': 'adapters/OrbitControl',
    'nrrdLoader': 'adapters/NRRDLoader',
    'shaderLoader': 'ShaderLoader',
    'volumeUtils': 'VolumeUtils',
    'lib': 'lib',
    'constants': 'constants',
  },
});

console.log('app');
requirejs(['main']);
