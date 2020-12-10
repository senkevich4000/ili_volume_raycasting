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
        const result = VolumeUtils.getIntensityMapFromCuboidCreator(
            info.xLength,
            info.yLength,
            info.zLength,
            info.xLength,
            info.yLength,
            info.zLength,
            info.cuboids)();
        postMessage({ready: true, volume: result});
      };
      postMessage({ready: false});
    },
);
