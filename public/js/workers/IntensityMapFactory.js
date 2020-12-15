importScripts('./../node_modules/requirejs/require.js');

require(
    {
      baseUrl: '../.',
    },
    ['VolumeUtils', 'DataLoader'],
    function(VolumeUtils, DataLoader) {
      onmessage = function(event) {
        VolumeUtils.calculateIntensityMapFromCuboids(event.data.calculator);
        postMessage(new DataLoader.ResponseMessage(true, event.data.calculator.volume));
      };
      postMessage(new DataLoader.ResponseMessage(false, undefined));
    },
);
