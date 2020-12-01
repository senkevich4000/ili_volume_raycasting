export function generateVolume(indexer, valueCalculator) {
  const xLength = indexer.xLength;
  const yLength = indexer.yLength;
  const zLength = indexer.zLength;

  const data = new Float32Array(xLength * yLength * zLength);
  for (let xIndex = 0; xIndex < xLength; xIndex++) {
    for (let yIndex = 0; yIndex < yLength; yIndex++) {
      for (let zIndex = 0; zIndex < zLength; zIndex++) {
        const value = valueCalculator(indexer, xIndex, yIndex, zIndex);
        data[indexer.get(xIndex, yIndex, zIndex)] = value;
      }
    }
  }

  return {
    xLength: xLength,
    yLength: yLength,
    zLength: zLength,
    data: data,
  };
}

export function createVolumeNormalsMap(volume, bounds) {
  const data = volume.data;
  const indexer = new Indexer1D(volume.xLength, volume.yLength, volume.zLength);

  return generateVolume(indexer, normalsCalculator);

  function normalsCalculator(xIndex, yIndex, zIndex) {
    const leftXValue = data[indexer.getXClipped(xIndex - 1, yIndex, zIndex)];
    const rightXValue = data[indexer.getXClipped(xIndex + 1, yIndex, zIndex)];

    const leftYValue = data[indexer.getYClipped(xIndex, yIndex - 1, zIndex)];
    const rightYValue = data[indexer.getYClipped(xIndex, yIndex + 1, zIndex)];

    const leftZValue = data[indexer.getZClipped(xIndex, yIndex, zIndex - 1)];
    const rightZValue = data[indexer.getZClipped(xIndex, yIndex, zIndex + 1)];

    leftXValue = normalize(leftXValue, bounds);
    leftYValue = normalize(leftYValue, bounds);
    leftZValue = normalize(leftZValue, bounds);

    rightXValue = normalize(rightXValue, bounds);
    rightYValue = normalize(rightYValue, bounds);
    rightZValue = normalize(rightZValue, bounds);

    const xRange = rightXValue - leftXValue;
    const yRange = rightYValue - leftYValue;
    const zRange = rightZValue - leftZValue;

    const result = new Uint8Array(3);
    result[0] = xRange;
    result[1] = yRange;
    result[2] = zRange;
    return result;
  }
}

export function createIntensityVolume(xLength, yLength, zLength) {
  const indexer = new Indexer1D(xLength, yLength, zLength);
  return generateVolume(indexer, intensityCalculator);

  function intensityCalculator(_indxer, xIndex, _yIndex, _zIndex) {
    return xIndex / (xLength - 1);
  }
}

function normalize(value, bounds) {
  return (value - bounds.min) / (bounds.max - bounds.min);
}

function Indexer1D(xLength, yLength, zLength) {
  this.xLength = xLength;
  this.yLength = yLength;
  this.zLength = zLength;
}

Indexer1D.prototype.get = function(xIndex, yIndex, zIndex) {
  const index = zIndex + this.zLength * (yIndex + this.yLength * xIndex);
  return index;
};

Indexer1D.prototype.getXClipped = function(xIndex, yIndex, zIndex) {
  if (xIndex < 0) {
    xIndex = 0;
  }
  if (xIndex == this.xLength) {
    --xIndex;
  }
  return this.get(xIndex, yIndex, zIndex);
};

Indexer1D.prototype.getYClipped = function(xIndex, yIndex, zIndex) {
  if (yIndex < 0) {
    yIndex = 0;
  }
  if (yIndex == this.yLength) {
    --yIndex;
  }
  return this.get(xIndex, yIndex, zIndex);
};

Indexer1D.prototype.getZClipped = function(xIndex, yIndex, zIndex) {
  if (zIndex < 0) {
    zIndex = 0;
  }
  if (zIndex == this.zLength) {
    --zIndex;
  }
  return this.get(xIndex, yIndex, zIndex);
};
