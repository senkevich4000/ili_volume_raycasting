const express = require('express');
const fs = require('fs');

const app = express();
const port = 5000;

app.use(express.static('public'));

app.get('/readAllFiles/:path', function (req, res) {
  console.info('Searching for dicom files...');
  const allFiles = [];
  let rootPath = './public/assets/data/';
  processFile(rootPath, req.params.path);
  const json = JSON.stringify(allFiles);
  //console.log(json);
  res.send(json);

  function processDirectory(path) {
    let currentFiles = fs.readdirSync(path);
    //console.log(currentFiles);
    for (const file in currentFiles) {
      processFile(path, currentFiles[file]);
    }
  }

  function processFile(path, file) {
    const fullPath = path + file;
    //console.log(fullPath);
    const stats = fs.lstatSync(fullPath);
    if (stats.isFile()) {
      allFiles.push(fullPath.slice('./public/'.length, fullPath.length));
    } else if (stats.isDirectory()) {
      processDirectory(fullPath + '/');
    } else {
      console.error('something strange. file may not exists.');
    }
  }
});

app.listen(port, () => {
  console.log('Server connected at: ', port);
});
