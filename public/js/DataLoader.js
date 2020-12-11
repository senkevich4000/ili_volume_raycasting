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

  DataLoader.prototype.start = function(onIntensityMapCalculated, onNormalsMapCalculated) {
    this.onIntensityMapCalculated = onIntensityMapCalculated;
    this.onNormalsMapCalculated = onNormalsMapCalculated;
    this.tryPostMessageToIntensityMapWorker();
    this.tryPostMessageToNormalsMapWorker();
  };

  DataLoader.prototype.onIntensntyMapWorkerMessage = function(event) {
    if (event.data.ready) {
      this.intensityMapCalculator.volume = event.data.volume;
      this.onIntensityMapCalculated();
    } else {
      this.tryPostMessageToIntensityMapWorker();
    }
  };

  DataLoader.prototype.onNormalsMapWorkerMessage = function(event) {
    if (event.data.ready) {
      this.normalsMapCalculator.volume = event.data.volume;
      this.onNormalsMapCalculated();
    } else {
      this.tryPostMessageToNormalsMapWorker();
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

