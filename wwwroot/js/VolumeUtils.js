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

  return {
    xLength: xLength,
    yLength: yLength,
    zLength: zLength,
    data: result,
  };

  function calculateNormal(input, indexer, xIndex, yIndex, zIndex) {
    const leftXValue = input[indexer.getXClipped(xIndex - 1, yIndex, zIndex)];
    const rightXValue = input[indexer.getXClipped(xIndex + 1, yIndex, zIndex)];

    const leftYValue = input[indexer.getYClipped(xIndex, yIndex - 1, zIndex)];
    const rightYValue = input[indexer.getYClipped(xIndex, yIndex + 1, zIndex)];

    const leftZValue = input[indexer.getZClipped(xIndex, yIndex, zIndex - 1)];
    const rightZValue = input[indexer.getZClipped(xIndex, yIndex, zIndex + 1)];

    const xRange = rightXValue - leftXValue;
    const yRange = rightYValue - leftYValue;
    const zRange = rightZValue - leftZValue;

    const vectorLength = Math.sqrt(xRange * xRange + yRange * yRange + zRange * zRange);

    const result = new Uint8Array(3);
    result[0] = mapRange(xRange, vectorLength);
    result[1] = mapRange(yRange, vectorLength);
    result[2] = mapRange(zRange, vectorLength);

    return result;

    function mapRange(range, length) {
      return map(range / length, 0, 1, 0, 255);
    }
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

function map(value, minFrom, maxFrom, minTo, maxTo) {
  return minTo + (maxTo - minTo) * ((value - minFrom) / (maxFrom - minFrom));
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
