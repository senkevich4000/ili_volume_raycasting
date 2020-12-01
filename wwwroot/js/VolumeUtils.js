export function createNormalsMapVolume(volume, bounds) {
  const xLength = volume.xLength;
  const yLength = volume.yLength;
  const zLength = volume.zLength;

  const inputIndexer = new Indexer1D(xLength, yLength, zLength);
  const input = volume.data;

  const resultIndexer = new Indexer1D(xLength, yLength, zLength * 3);
  const result = new Uint8Array(resultIndexer.length);

  for (let xIndex = 0; xIndex < xLength; ++xIndex) {
    for (let yIndex = 0; yIndex < yLength; ++yIndex) {
      for (let zIndex = 0; zIndex < zLength; ++zIndex) {
        const values = calculateNormal(input, inputIndexer, xIndex, yIndex, zIndex);
        const resultIndex = resultIndexer.get(xIndex, yIndex, zIndex * 3);
        result[resultIndex] = values[0];
        result[resultIndex + 1] = values[1];
        result[resultIndex + 2] = values[2];
      }
    }
  }

  return result;

  function calculateNormal(input, indexer, xIndex, yIndex, zIndex) {
    let leftXValue = input[indexer.getXClipped(xIndex - 1, yIndex, zIndex)];
    let rightXValue = input[indexer.getXClipped(xIndex + 1, yIndex, zIndex)];

    let leftYValue = input[indexer.getYClipped(xIndex, yIndex - 1, zIndex)];
    let rightYValue = input[indexer.getYClipped(xIndex, yIndex + 1, zIndex)];

    let leftZValue = input[indexer.getZClipped(xIndex, yIndex, zIndex - 1)];
    let rightZValue = input[indexer.getZClipped(xIndex, yIndex, zIndex + 1)];

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

  const data = new Float32Array(xLength * yLength * zLength);
  for (let xIndex = 0; xIndex < xLength; xIndex++) {
    for (let yIndex = 0; yIndex < yLength; yIndex++) {
      for (let zIndex = 0; zIndex < zLength; zIndex++) {
        const value = xIndex / (xLength - 1);
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

function normalize(value, bounds) {
  return (value - bounds.min) / (bounds.max - bounds.min);
}

function Indexer1D(xLength, yLength, zLength) {
  this.xLength = xLength;
  this.yLength = yLength;
  this.zLength = zLength;
  this.length = xLength * yLength * zLength;
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
