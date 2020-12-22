define(
    ['lib'],
    function(lib) {
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

      function IntencityMapFromCuboidsCalculator(
          xLength,
          yLength,
          zLength,
          xSize,
          ySize,
          zSize,
          cuboids,
          moleculeIndex) {
        const result = new Float32Array(xLength * yLength * zLength);
        result.fill(Number.NaN); // Fake value that indiates that voxel should not be colored.
        this.volume = new SizedVolume(
            result,
            xLength,
            yLength,
            zLength,
            xSize,
            ySize,
            zSize);

        this.cuboids = cuboids;
        this.moleculeIndex = moleculeIndex;
        this.calculated = false;
      }

      function calculateIntensityMapFromCuboids(source) {
        if (source.calculated) {
          return;
        }

        const xLength = source.volume.xLength;
        const yLength = source.volume.yLength;
        const zLength = source.volume.zLength;

        const xSize = source.volume.xSize;
        const ySize = source.volume.ySize;
        const zSize = source.volume.zSize;

        const xStep = getStep(xLength, xSize);
        const yStep = getStep(yLength, ySize);
        const zStep = getStep(zLength, zSize);

        const resultIndexer = new Indexer1D(xLength, yLength, zLength);
        const result = source.volume.data;

        const intensities = source.cuboids
            .map((cuboid) => cuboid.molecules[source.moleculeIndex].intensity);
        const cuboidBounds = lib.Bounds.fromArray(intensities);

        source.cuboids.forEach((cuboid) => {
          const xPivot = getXPivot(cuboid);
          const yPivot = getYPivot(cuboid);
          const zPivot = getZPivot(cuboid);

          const xStartIndex = Math.floor(getIndex(xPivot, xStep, xLength));
          const yStartIndex = Math.floor(getIndex(yPivot, yStep, yLength));
          const zStartIndex = Math.floor(getIndex(zPivot, zStep, zLength));

          const xEndIndex = Math.floor(getIndex(
              getEndPosition(xPivot, cuboid.xSize, xSize),
              xStep,
              xLength));
          const yEndIndex = Math.floor(getIndex(
              getEndPosition(yPivot, cuboid.ySize, ySize),
              yStep,
              yLength));
          const zEndIndex = Math.floor(getIndex(
              getEndPosition(zPivot, cuboid.zSize, zSize),
              zStep,
              zLength));

          for (let xIndex = xStartIndex; xIndex <= xEndIndex; ++xIndex) {
            for (let yIndex = yStartIndex; yIndex <= yEndIndex; ++yIndex) {
              for (let zIndex = zStartIndex; zIndex <= zEndIndex; ++zIndex) {
                result[resultIndexer.get(xIndex, yIndex, zIndex)] =
                  lib.calculateNormalValue(
                    cuboid.molecules[source.moleculeIndex].intensity,
                    cuboidBounds);
              }
            }
          }
        });
        source.calculated = true;

        function getXPivot(cuboid) {
          return cuboid.xCenter - cuboid.xSize / 2;
        }

        function getYPivot(cuboid) {
          return cuboid.yCenter - cuboid.ySize / 2;
        }

        function getZPivot(cuboid) {
          return cuboid.zCenter - cuboid.zSize / 2;
        }

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

      function NormalsMapCalculator(inputVolume, bounds) {
        this.inputVolume = inputVolume;
        this.bounds = bounds;

        const length = inputVolume.xLength * inputVolume.yLength * inputVolume.zLength * 3;
        const result = new Uint8Array(length);

        this.volume = new Volume(
            result,
            inputVolume.xLength,
            inputVolume.yLength,
            inputVolume.zLength);

        this.calculated = false;

        return this;
      }

      function calculateNormalsMap(source) {
        if (source.calculated) {
          return;
        }
        const xLength = source.inputVolume.xLength;
        const yLength = source.inputVolume.yLength;
        const zLength = source.inputVolume.zLength;

        const inputIndexer = new Indexer1D(xLength, yLength, zLength);
        const input = source.inputVolume.data;

        const result = source.volume.data;
        const resultIndexer = new Indexer1D(
            source.inputVolume.xLength,
            source.inputVolume.yLength,
            source.inputVolume.zLength * 3);

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
        source.calculated = true;

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

          output[outputIndex] = mapRange(xRange, vectorLength, source.bounds);
          output[outputIndex + 1] = mapRange(yRange, vectorLength, source.bounds);
          output[outputIndex + 2] = mapRange(zRange, vectorLength, source.bounds);

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
        NormalsMapCalculator,
        calculateNormalsMap,
        IntencityMapFromCuboidsCalculator,
        calculateIntensityMapFromCuboids,
      };
    },
);
