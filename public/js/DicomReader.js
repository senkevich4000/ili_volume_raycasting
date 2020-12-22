define(
  ['daikon'],
  function DicomReader(Daikon) {
    async function fetchVolumeFromDicom(url) {
      return await fetch(url).then(async (response) => {
        if (response.ok && response.status == 200) {
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const view = new DataView(arrayBuffer);
          const xLength = view.getInt32(0, true);
          const yLength = view.getInt32(4, true);
          const zLength = view.getInt32(8, true);
          const rawData = arrayBuffer.slice(12, arrayBuffer.byteLength - 12);
          console.log('raw data:', rawData);
          const data = new Int16Array(rawData);
          const volume = {
            xLength,
            yLength,
            zLength,
            data,
          };
          return volume;
        } else {
          console.warning(
            'Bad response on fetching volume form dicom',
            response.status);
          return undefined;
        }
      });
    }

    return {fetchVolumeFromDicom};
  },
);
