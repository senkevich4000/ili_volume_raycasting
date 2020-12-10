define(function() {
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

  function getIntensityMapFromCuboidCreator(
      xLength,
      yLength,
      zLength,
      xSize,
      ySize,
      zSize,
      cuboids) {
    return () => createIntensityMapFromCuboids(
        xLength,
        yLength,
        zLength,
        xSize,
        ySize,
        zSize,
        cuboids);
  }

  function createIntensityMapFromCuboids(
      xLength,
      yLength,
      zLength,
      xSize,
      ySize,
      zSize,
      cuboids) {
    const xStep = getStep(xLength, xSize);
    const yStep = getStep(yLength, ySize);
    const zStep = getStep(zLength, zSize);

    const result = new Float32Array(xLength * yLength * zLength);
    result.fill(Number.NaN); // Fake value that indiates that voxel should not be colored.
    const resultIndexer = new Indexer1D(xLength, yLength, zLength);

    cuboids.forEach((cuboid) => {
      const xStartIndex = Math.floor(getIndex(cuboid.xPivot, xStep, xLength));
      const yStartIndex = Math.floor(getIndex(cuboid.yPivot, yStep, yLength));
      const zStartIndex = Math.floor(getIndex(cuboid.zPivot, zStep, zLength));

      const xEndIndex = Math.floor(getIndex(
          getEndPosition(cuboid.xPivot, cuboid.xSize, xSize),
          xStep,
          xLength));
      const yEndIndex = Math.floor(getIndex(
          getEndPosition(cuboid.yPivot, cuboid.ySize, ySize),
          yStep,
          yLength));
      const zEndIndex = Math.floor(getIndex(
          getEndPosition(cuboid.zPivot, cuboid.zSize, zSize),
          zStep,
          zLength));

      for (let xIndex = xStartIndex; xIndex <= xEndIndex; ++xIndex) {
        for (let yIndex = yStartIndex; yIndex <= yEndIndex; ++yIndex) {
          for (let zIndex = zStartIndex; zIndex <= zEndIndex; ++zIndex) {
            result[resultIndexer.get(xIndex, yIndex, zIndex)] = cuboid.intensity;
          }
        }
      }
    });

    return new Volume(result, xLength, yLength, zLength);

    function getStep(length, size) {
      return size / length;
    }

    function getIndex(position, step, limit) {
      return Math.min(position / step, limit - 1);
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

  function getNormalsMapVolumeCreator(volume, bounds) {
    return () => createNormalsMapVolume(volume, bounds);
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

  function map(value, minFrom, maxFrom, minTo, maxTo) {
    return minTo + (maxTo - minTo) * ((value - minFrom) / (maxFrom - minFrom));
  }

  function Indexer1D(xLength, yLength, zLength) {
    this.xLength = xLength;
    this.yLength = yLength;
    this.zLength = zLength;

    this.xTopBound = xLength - 1;
    this.yTopBound = yLength - 1;
    this.zTopBound = zLength - 1;

    this.stride = xLength;
    this.pitch = this.stride * yLength;
    this.depthPitch = this.pitch * zLength;
  }

  Indexer1D.prototype.get = function(xIndex, yIndex, zIndex) {
    const index = zIndex * this.pitch + yIndex * this.stride + xIndex;
    return index;
  };

  Indexer1D.prototype.getClipped = function(xIndex, yIndex, zIndex, bound) {
    return this.get(xIndex, yIndex, Math.min(bound, Math.max(0, zIndex)));
  };

  Indexer1D.prototype.getXClipped = function(xIndex, yIndex, zIndex) {
    return this.getClipped(xIndex, yIndex, zIndex, this.xTopBound);
  };

  Indexer1D.prototype.getYClipped = function(xIndex, yIndex, zIndex) {
    return this.getClipped(xIndex, yIndex, zIndex, this.yTopBound);
  };

  Indexer1D.prototype.getZClipped = function(xIndex, yIndex, zIndex) {
    return this.getClipped(xIndex, yIndex, zIndex, this.zTopBound);
  };

  return {
    Volume,
    SizedVolume,
    Cuboid,
    getNormalsMapVolumeCreator,
    getIntensityMapFromCuboidCreator,
  };
});
