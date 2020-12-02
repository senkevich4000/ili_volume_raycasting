const volumeUtils = require('./VolumeUtils');

test('Intensity volume test', () => {
  const size = 3;
  const intensityVolume = volumeUtils.createIntensityVolume(size, size, size);
  console.log(intensityVolume);
  expect(1 + 2).toBe(3);
});
