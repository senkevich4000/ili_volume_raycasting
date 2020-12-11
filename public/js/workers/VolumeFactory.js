importScripts('./../node_modules/requirejs/require.js');

require(
    {
      baseUrl: '../.',
    },
    ['VolumeUtils'],
    function(VolumeUtils) {
      onmessage = function(event) {
        VolumeUtils.calculateIntensityMapFromCuboids(event.data.calculator);
        postMessage({ready: true, volume: event.data.calculator.volume});
      };
      postMessage({ready: false});
    },
);
