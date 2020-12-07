const VOLUMEUTILS = require('./VolumeUtils');
const BOUNDS = require('./lib.js');

/*
xIndex / (xLength - 1)

x0 y0 z0 0 (0.5 0 0)
x0 y0 z1 0 (0.5 0 0)
x0 y0 z2 0 (0.5 0 0)
x0 y1 z0 0 (0.5 0 0)
x0 y1 z1 0 (0.5 0 0)
x0 y1 z2 0 (0.5 0 0)
x0 y2 z0 0 (0.5 0 0)
x0 y2 z1 0 (0.5 0 0)
x0 y2 z2 0 (0.5 0 0)

x1 y0 z0 0.5 (1 0 0)
x1 y0 z1 0.5 (1 0 0)
x1 y0 z2 0.5 (1 0 0)
x1 y1 z0 0.5 (1 0 0)
x1 y1 z1 0.5 (1 0 0)
x1 y1 z2 0.5 (1 0 0)
x1 y2 z0 0.5 (1 0 0)
x1 y2 z1 0.5 (1 0 0)
x1 y2 z2 0.5 (1 0 0)

x2 y0 z0 1 (0.5 0 0)
x2 y0 z1 1 (0.5 0 0)
x2 y0 z2 1 (0.5 0 0)
x2 y1 z0 1 (0.5 0 0)
x2 y1 z1 1 (0.5 0 0)
x2 y1 z2 1 (0.5 0 0)
x2 y2 z0 1 (0.5 0 0)
x2 y2 z1 1 (0.5 0 0)
x2 y2 z2 1 (0.5 0 0)

 */

test('Intensity volume test', () => {
  const size = 3;
  const intensityVolume = VOLUMEUTILS.createIntensityVolume(size, size, size);
  expect(intensityVolume.xLength).toBe(size);
  expect(intensityVolume.yLength).toBe(size);
  expect(intensityVolume.zLength).toBe(size);
  const data = intensityVolume.data;
  const expectedResult = new Float32Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
    1, 1, 1, 1, 1, 1, 1, 1, 1,
  ]);
  expect(data.length).toBe(size * size * size);
  expect(data).toEqual(expectedResult);
});

test('Normals test', () => {
  const size = 3;
  const intensityVolume = VOLUMEUTILS.createIntensityVolume(size, size, size);
  const normals = VOLUMEUTILS.createNormalsMapVolume(
      intensityVolume,
      new BOUNDS.Bounds(0, 100));
  expect(normals.xLength).toBe(size);
  expect(normals.yLength).toBe(size);
  expect(normals.zLength).toBe(size);
  const data = normals.data;
  expect(data.length).toBe(size * size * size * 3);
  const expectedResult = new Uint8Array([
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,

    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,

    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
    100, 0, 0,
  ]);
  expect(data).toEqual(expectedResult);
});

test('Cuboids color mapping', () => {
  const cuboids = [
    new VOLUMEUTILS.Cuboid(
        0, 0, 0,
        5, 10, 5,
        1),
    new VOLUMEUTILS.Cuboid(
        0, 0, 5,
        5, 10, 5,
        2),
    new VOLUMEUTILS.Cuboid(
        5, 0, 5,
        5, 10, 5,
        3),
    new VOLUMEUTILS.Cuboid(
        5, 0, 0,
        5, 10, 5,
        4),
  ];
  const cuboidIntensityMap = VOLUMEUTILS.createIntensityMapFromCuboids(
      3,
      3,
      3,
      10,
      10,
      10,
      cuboids);
  const expectedResult = new Float32Array([
    1, 2, 2,
    1, 2, 2,
    1, 2, 2,
    4, 4, 3,
    4, 4, 3,
    4, 4, 3,
    4, 4, 3,
    4, 4, 3,
    4, 4, 3]);
  expect(cuboidIntensityMap.data).toEqual(expectedResult);
});
