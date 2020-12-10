importScripts('./../node_modules/requirejs/require.js');

require(
    {
      baseUrl: '../.',
    },
    ['VolumeUtils'],
    function(VolumeUtils) {
      onmessage = function(event) {
        console.log('Worker get the message...');
        const info = event.data;
        const result = VolumeUtils.getNormalsMapVolumeCreator(
            info.volume,
            info.bounds)();
        postMessage({ready: true, volume: result});
      };
      postMessage({ready: false});
    },
);
