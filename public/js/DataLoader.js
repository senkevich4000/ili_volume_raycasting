define(['three', 'volumeUtils'], function(three, volumeUtils) {
  function DataLoader(intensityMapCalculator, normalsMapCalculator) {
    this.intensityMapCalculator = intensityMapCalculator;
    this.normalsMapCalculator = normalsMapCalculator;

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
    this.intensityMapWorker.postMessage({
      calculator: this.intensityMapCalculator,
    });
  };

  DataLoader.prototype.tryPostMessageToNormalsMapWorker = function() {
    this.normalsMapWorker.postMessage({
      calculator: this.normalsMapCalculator,
    });
  };

  return {DataLoader};
});

