console.log("Loading utilities....");

const fs = require('fs');
const daikon = require('./public/js/node_modules/daikon/release/current/daikon.js');

async function readVolumeFromDicom(rootPath, path, seriesIndex) {
  const series = new daikon.Series();
  processFile(rootPath, path, fileFilter);
  console.log('All files processed! Building the series...');
  series.buildSeries();
  console.log('The series is ready! Concatenating images...');
  const image3D = await new Promise((resolve, _reject) => {
    series.concatenateImageData(null, resolve);
  });
  console.log('Done! Preparing volume...');
  const firstImage = series.images[0];
  const dataScaleIntercept = firstImage.getDataScaleIntercept();
  const dataScaleSlope = firstImage.getDataScaleSlope();
  const rawData = new Uint16Array(image3D);
  const resultData = new Int16Array(rawData.length);
  for(let itemIndex = 0; itemIndex < rawData.length; ++itemIndex) {
    resultData[itemIndex] = rawData[itemIndex] * dataScaleSlope + dataScaleIntercept;
  }
  console.log(resultData);
  const volume = {
    xLength: firstImage.getCols(),
    yLength: firstImage.getRows(),
    zLength: series.images.length,
    data: resultData,
  };
  return volume;

  function fileFilter(file) {
    const rawBuffer = fs.readFileSync(file);
    const arrayBuffer = toArrayBuffer(rawBuffer);
    const dataView = new DataView(arrayBuffer);
    const image = daikon.Series.parseImage(dataView);
    if (image && image.hasPixelData()) {
      if (image.getSeriesNumber() != seriesIndex) {
        return;
      }
      if (series.matchesSeries(image)) {
        series.addImage(image);
        console.log('Image found:', file);
      } else {
        if(series.images.length > 0) {
          readImageInfo(image);
          console.warn(
            'Image does not match the series!',
            image.getSeriesNumber());
        }
      }
    }
  }
}

function processDirectory(path, fileProcessor) {
  let currentFiles = fs.readdirSync(path);
  for (const file in currentFiles) {
    processFile(path, currentFiles[file], fileProcessor);
  }
}

function processFile(path, file, fileProcessor) {
  const fullPath = path + file;
  const stats = fs.lstatSync(fullPath);
  if (stats.isFile()) {
    fileProcessor(fullPath);
  } else if (stats.isDirectory()) {
    processDirectory(fullPath + '/', fileProcessor);
  } else {
    console.error(
      'Something strange. file may not exists:',
      file);
  }
}

function toArrayBuffer(buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for(let itemIndex = 0; itemIndex < view.length; ++itemIndex) {
    view[itemIndex] = buffer[itemIndex];
  }
  return arrayBuffer;
}

function readImageInfo(image) {
  //console.log('Image', image);
  console.log('(Rows, Colums)', image.getRows(), image.getCols());
  console.log('series number', image.getSeriesNumber());
  console.log('Number of frames', image.getNumberOfFrames());
  console.log('TR', image.getTR());
  console.log('Has pixel data', image.hasPixelData());
  console.log('Series Description', image.getSeriesDescription());
  console.log('Image type', image.getImageType());
  console.log('Data Type', image.getDataType());
  console.log('Pixel Representation', image.getPixelRepresentation());
  console.log('Pixel Data', image.getPixelData());
  console.log('Compressed', image.isCompressed());
  console.log('CompressedJPEG', image.isCompressedJPEG());
  console.log('CompressedJPEGLossless', image.isCompressedJPEGLossless());
  console.log('Image min', image.getImageMin());
  console.log('Image max', image.getImageMax());
  console.log('Bits allocated', image.getBitsAllocated() / 8);
}

module.exports = {readVolumeFromDicom};
