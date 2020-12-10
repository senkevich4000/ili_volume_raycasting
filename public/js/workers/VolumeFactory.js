//importScripts('./../VolumeUtils.js');

onmessage = function(event) {
  console.log('Worker get the message...');
  /*
  const info = event.data;
  const result = getIntensityMapFromCuboidCreator(
      info.xLength,
      info.yLength,
      info.zLength,
      info.xLength,
      info.yLength,
      info.zLength,
      createCuboids(info.xLength, info.yLength, info.zLength))();
  */
  postMessage(123);
};
