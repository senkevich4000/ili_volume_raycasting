define(['three', 'volumeUtils'], function(three, volumeUtils) {
  function RenderContext(view, scene, camera, renderer, maxDimension) {
    this.view = view;
    this.scene = scene;
    this.camera = camera;
    this.maxDimension = maxDimension;
    this.renderer = renderer;

    RenderContext.prototype.render = function() {
      this.renderer.setScissorTest(true);
      const aspect = setScissorForElement.call(this, this.view.bottomElement);
      updateOrthoCamera(this.camera, this.maxDimension, aspect);
      this.scene.background.set(constants.MainCameraBackgroundColor);
      this.renderer.render(this.scene, this.camera);
    };
  }

  function DataLoader(shapeVolume, normalsBounds) {
    this.shapeVolume = shapeVolume;
    this.normalsBounds = normalsBounds;

    this.intensityMapWorker = new Worker('./js/workers/VolumeFactory.js');
    this.normalsMapWorker = new Worker('./js/workers/NormalsFactory.js');

    this.intensityMapWorker.onmessage = this.onIntensntyMapWorkerMessage.bind(this);
    this.normalsMapWorker.onmessage = this.onNormalsMapWorkerMessage.bind(this);

    this.intensityMap = undefined;
    this.normalsMap = undefined;
    return this;
  }

  DataLoader.prototype.start = function(onready) {
    this.onready = onready;
    this.tryPostMessageToIntensityMapWorker();
    this.tryPostMessageToNormalsMapWorker();
  };

  DataLoader.prototype.onready = function(intensityMap, normalsMap) {};

  DataLoader.prototype.onIntensntyMapWorkerMessage = function(event) {
    if (event.data.ready) {
      this.intensityMap = event.data.volume;
      this.ready();
    } else {
      this.tryPostMessageToIntensityMapWorker();
    }
  };

  DataLoader.prototype.onNormalsMapWorkerMessage = function(event) {
    if (event.data.ready) {
      this.normalsMap = event.data.volume;
      this.ready();
    } else {
      this.tryPostMessageToNormalsMapWorker();
    }
  };

  DataLoader.prototype.ready = function() {
    if (this.intensityMap && this.normalsMap) {
      this.onready(this.intensityMap, this.normalsMap);
    }
  };

  DataLoader.prototype.tryPostMessageToIntensityMapWorker = function() {
    const volume = this.shapeVolume;
    this.intensityMapWorker.postMessage({
      xLength: volume.xLength,
      yLength: volume.yLength,
      zLength: volume.zLength,
      xSize: volume.xLength,
      ySize: volume.yLength,
      zSize: volume.zLength,
      cuboids: DataLoader.createCuboids(volume.xLength, volume.yLength, volume.zLength),
    });
  };

  DataLoader.prototype.tryPostMessageToNormalsMapWorker = function() {
    this.normalsMapWorker.postMessage({
      volume: this.shapeVolume,
      bounds: this.normalsBounds,
    });
  };

  DataLoader.createCuboids = function(xLength, yLength, zLength) {
    const xOffset = xLength / 2;
    const yOffset = yLength / 2;
    const zOffset = zLength / 2;

    const full = false;
    if (full) {
      return [
        new volumeUtils.Cuboid(0, 0, 0, xLength, yLength, zLength, 1),
      ];
    } else {
      return [
        new volumeUtils.Cuboid(0, 0, 0, xOffset, yOffset, zOffset, 0.75),
        new volumeUtils.Cuboid(xLength - xOffset, yLength - yOffset, 0, xOffset, yOffset, zOffset, 0.25),
        new volumeUtils.Cuboid(xOffset / 2, yOffset, zLength - zOffset, xLength / 2, yLength / 2, zOffset, 1),
      ];
    }
  };

  return {RenderContext, DataLoader};
});

