//import {createIntensityVolume} from './VolumeUtils.js';
const m = require('./VolumeUtils');

test('Intensity volume test', () => {
  const size = 3;
  const intensityVolume = m.createIntensityVolume(size, size, size);
  console.log(intensityVolume);
  expect(1 + 2).toBe(3);
});
