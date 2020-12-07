function Volume(data, xLength, yLength, zLength) {
  this.data = data;
  this.xLength = xLength;
  this.yLength = yLength;
  this.zLength = zLength;

  return this;
}

function SizedVolume(
    data,
    xLength,
    yLength,
    zLength,
    xSize,
    ySize,
    zSize) {
  Volume.call(this, data, xLength, yLength, zLength);
  this.xSize = xSize;
  this.ySize = ySize;
  this.zSize = zSize;

  return this;
}

SizedVolume.prototype = Object.create(Volume.prototype);
SizedVolume.prototype.constructor = SizedVolume;

function Cuboid(xPivot, yPivot, zPivot, xSize, ySize, zSize, intensity) {
  this.xPivot = xPivot;
  this.yPivot = yPivot;
  this.zPivot = zPivot;

  this.xSize = xSize;
  this.ySize = ySize;
  this.zSize = zSize;

  this.intensity = intensity;

  return this;
}

function createIntensityMapFromCuboids(sizedVolume, cuboids) {
  const xStep = getStep(sizedVolume.xLength, sizedVolume.xSize);
  const yStep = getStep(sizedVolume.yLength, sizedVolume.ySize);
  const zStep = getStep(sizedVolume.zLength, sizedVolume.zSize);

  const result = new Float32Array(sizedVolume.data.length);
  const resultIndexer = new Indexer1D(
      sizedVolue.xLength,
      sizedVolume.yLength,
      sizedVolume.zLength);

  cuboids.forEach((cuboid) => {
    const xStartIndex = Math.floor(getIndex(cuboid.xPivot, xStep));
    const yStartIndex = Math.floor(getIndex(cuboid.yPivot, yStep));
    const zStartIndex = Math.floor(getIndex(cuboid.zPivot, zStep));

    const xEndIndex = Math.ceil(getIndex(
        getEndPosition(cuboid.xPivot, cuboid.xSize, sizedVolume.xSize),
        xStep));
    const yEndIndex = Math.ceil(getIndex(
        getEndPosition(cuboid.yPivot, cuboid.ySize, sizedVolume.ySize),
        yStep));
    const zEndIndex = Math.ceil(getIndex(
        getEndPosition(cuboid.zPivot, cuboid.zSize, sizedVolume.zSize),
        zStep));

    for (let xIndex = xStartIndex; xIndex < xEndIndex; ++xIndex) {
      for (let yIndex = yStartIndex; yIndex < yEndIndex; ++yLength) {
        for (let zIndex = zStartIndex; zIndex < zEndIndex; ++zLength) {
          result[resultIndexer.get(xIndex, yIndex, zIndex)] = cuboid.intensity;
        }
      }
    }
  });

  return new Volume(result, sizedVolume.xLength, sizedVolume.yLength, sizedVolume.zLength);

  function getStep(length, sizes) {
    return length / sizes;
  }

  function getIndex(position, step) {
    return position / step;
  }

  function getEndPosition(startPosition, size, limit) {
    const endPosition = startPosition + size;
    if (endPosition > limit) {
      console.error(
          'Cuboid is out if volume limits. Cuboid\'s end position: ' +
          endPosition +
          ' , Limit: ' +
          limit);
      return limit;
    } else {
      return endPosition;
    }
  }
}

function createNormalsMapVolume(volume, bounds) {
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
        const resultIndex = resultIndexer.get(xIndex, yIndex, zIndex * 3);
        calculateNormal(
            input,
            inputIndexer,
            xIndex,
            yIndex,
            zIndex,
            result,
            resultIndex);
      }
    }
  }

  return new Volume(result, xLength, yLength, zLength);

  function calculateNormal(input, indexer, xIndex, yIndex, zIndex, output, outputIndex) {
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

    output[outputIndex] = mapRange(xRange, vectorLength, bounds);
    output[outputIndex + 1] = mapRange(yRange, vectorLength, bounds);
    output[outputIndex + 2] = mapRange(zRange, vectorLength, bounds);

    function mapRange(range, length, bounds) {
      return map(range / length, 0, 1, bounds.min, bounds.max);
    }
  }
}

function createIntensityVolume(xLength, yLength, zLength) {
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

  return new Volume(data, xLength, yLength, zLength);
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

export {
  Volume,
  SizedVolume,
  Cuboid,
  createNormalsMapVolume,
  createIntensityVolume,
  createIntensityMapFromCuboids,
};
