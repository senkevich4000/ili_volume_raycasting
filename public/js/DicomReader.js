define(
  ['daikon'],
  function DicomReader(Daikon) {
    async function fetchVolumeFromDicom(url) {
      return await fetch(url).then(async (response) => {
        if (response.ok && response.status == 200) {
          const resultJson = await response.json();
          console.log(resultJson);
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
