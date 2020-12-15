define(function() {
  function DataLoader() {
    this.contexts = [];
    return this;
  }

  DataLoader.prototype.registerJob = function(pathToWorker, calculator, messageProcessor) {
    this.contexts.push(
        new LoadingContext(pathToWorker, calculator, messageProcessor));
  };

  DataLoader.prototype.start = function() {
    this.contexts.forEach(postWaitingMessage);
  };

  function LoadingContext(pathToWorker, calculator, resultProcessor) {
    this.worker = new Worker(pathToWorker);
    this.calculator = calculator;
    this.worker.onmessage = (function(event) {
      switch (event.data.type) {
        case MessageType.initializing:
          postWaitingMessage(this);
          break;
        case MessageType.initialized:
          postMessage(this);
          break;
        case MessageType.finished:
          resultProcessor(event.data.data);
          break;
      }
    }).bind(this);
  }

  const MessageType = {
    initializing: 0,
    initialized: 1,
    waiting: 2,
    request: 3,
    finished: 4,
  };
  Object.freeze(MessageType);

  function postMessage(loadingContext) {
    loadingContext.worker.postMessage(
        new RequestCalculationMessage(MessageType.request, loadingContext.calculator));
  };

  function postWaitingMessage(loadingContext) {
    loadingContext.worker.postMessage(
        new RequestCalculationMessage(MessageType.waiting, undefined));
  }

  function RequestCalculationMessage(type, calculator) {
    this.type = type;
    this.calculator = calculator;

    return this;
  }

  function ResponseMessage(type, data) {
    this.type = type;
    this.data = data;

    return this;
  }

  return {DataLoader, ResponseMessage, MessageType};
});

