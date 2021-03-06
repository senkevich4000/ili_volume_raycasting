importScripts('./../node_modules/requirejs/require.js');

require(
    {
      baseUrl: './../',
      paths: {
        'three': 'node_modules/three/build/three',
      },
    },
    ['VolumeUtils', 'DataLoader'],
    function(VolumeUtils, DataLoader) {
      onmessage = function(event) {
        if (event.data.type === DataLoader.MessageType.waiting) {
          postMessage(new DataLoader.ResponseMessage(
              DataLoader.MessageType.initialized, undefined));
          return;
        }
        VolumeUtils.calculateIntensityMapFromCuboids(event.data.calculator);
        postMessage(new DataLoader.ResponseMessage(
            DataLoader.MessageType.finished, event.data.calculator.volume));
      };
      postMessage(new DataLoader.ResponseMessage(
          DataLoader.MessageType.initializing, undefined));
    },
);
