requirejs.config({
  paths: {
    'main': 'main',
    'three': 'node_modules/three/build/three',
    'orbitControls': 'adapters/OrbitControl',
    'nrrdLoader': 'adapters/NRRDLoader',
    'dataLoader': 'DataLoader',
    'shaderLoader': 'ShaderLoader',
    'volumeUtils': 'VolumeUtils',
    'lib': 'lib',
    'constants': 'constants',
    'uniforms': 'Uniforms',
  },
});

requirejs(['main']);
