const express = require('express');

const app = express();
const port = 5000;

app.use(express.static('public'));

app.get('/readAllFiles/:path/:seriesIndex', async function (req, res) {
  const utilities = await import('./utilities.js');
  console.log('Searching for dicom files...');
  const rootPath = './public/assets/data/';
  const volume = await utilities.readVolumeFromDicom(
    rootPath, 
    req.params.path,
    req.params.seriesIndex);
  console.log('Volume is ready:', volume);
  const json = JSON.stringify(volume);
  console.log(json);
  res.send(json);
});

app.listen(port, () => {
  console.log('Server connected at: ', port);
});
