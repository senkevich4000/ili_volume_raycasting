define(
  ['daikon'],
  function DicomReader(Daikon) {
    async function fetchDicom(filename) {
      const url = 'readAllFiles/LUNG_MAP_D187_25';
      const parser = new Daikon.Parser();
      const seriesMap = await fetch(url).then(async (res) => {
        const images = [];
        // change filenames to huge blob + map of [filename] -> filesize.
        const allFiles = await res.json();
        for (const fileName of allFiles) {
          const file = await fetch('./' + fileName).then(async (res) => {
            if (res.ok && res.status == 200) {
              const blob = await res.blob();
              return blob.arrayBuffer();
            } else {
              console.error(res);
            }
            return undefined;
          });
          if (file) {
            const image = parser.parse(new DataView(file));
            if (image && image.hasPixelData()) {
              images.push(image);
            }
          }
        }
        return images.reduce((acc, image) => {
          const seriesNumber = image.getSeriesNumber();
          if (!(acc.has(seriesNumber))) {
            acc.set(seriesNumber, new Daikon.Series());
          }
          const currentSeries = acc.get(seriesNumber);
          if (currentSeries.matchesSeries(image)) {
            currentSeries.addImage(image);
          } else {
            if(currentSeries.images.length > 0) {
              console.error('Image does not match the series!', seriesNumber);
            }
          }
          return acc;
        },
        new Map());
      });

      // get the longest series to create a volume.
      const series = seriesMap.get(2);
      console.log(series);
      series.buildSeries();
      const image3D = await new Promise((resolve, reject) => {
        series.concatenateImageData(null, function (imageData) {
          resolve(imageData);
        });
      });
      console.log(image3D);
      const firstImage = series.images[0];
      readImageInfo(firstImage);
      const result = {
        xLength: firstImage.getCols(),
        yLength: firstImage.getRows(),
        zLength: series.images.length,
        data: new Uint16Array(image3D),
      };
      console.log(result);
      return result;
    }

    function readImageInfo(image) {
      console.log('Image', image);
      console.log('(Rows, Colums)', image.getRows(), image.getCols());
      console.log('series number', image.getSeriesNumber());
      console.log('Number of frames', image.getNumberOfFrames());
      console.log('TR', image.getTR());
      console.log('Has pixel data', image.hasPixelData());
      console.log('Series Description', image.getSeriesDescription());
      console.log('Image type', image.getImageType());
      console.log('Data Type', image.getDataType());
      console.log('Pixel Representation', image.getPixelRepresentation());
    }

    return {fetchDicom};
  },
);
