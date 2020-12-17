requirejs.config({
  paths: {
    'main': 'main',
    'three': 'node_modules/three/build/three',
    'csv': 'external/csv',
    'orbitControls': 'adapters/OrbitControl',
    'nrrdLoader': 'adapters/NRRDLoader',
    'dataLoader': 'DataLoader',
    'shaderLoader': 'ShaderLoader',
    'cuboidsReader': 'CuboidsReader',
    'volumeUtils': 'VolumeUtils',
    'lib': 'lib',
    'constants': 'constants',
    'uniforms': 'Uniforms',
  },
});

requirejs(['main']);
