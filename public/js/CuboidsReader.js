define(
    ['csv'],
    function CuboidsReader() {
      async function read(filename) {
        const data = await CSV.fetch({url: filename});
        const header = data.fields;
        const columsCount = header.length;
        const result = [];

        data.records.forEach((record) => {
          const cuboid = new Cuboid(
              record[FieldPositionMap.id],
              record[FieldPositionMap.xCenter],
              record[FieldPositionMap.yCenter],
              record[FieldPositionMap.zCenter],
              record[FieldPositionMap.xSize],
              record[FieldPositionMap.ySize],
              record[FieldPositionMap.zSize]);
          for (let columnIndex = FieldPositionMap.zSize + 1; columnIndex < columsCount; ++columnIndex) {
            const molecule = new Molecule(header[columnIndex], record[columnIndex]);
            cuboid.molecules.push(molecule);
          }
          result.push(cuboid);
        });
        return result;
      }

      function Cuboid(id, xCenter, yCenter, zCenter, xSize, ySize, zSize) {
        this.id = id;

        this.xCenter = xCenter;
        this.yCenter = yCenter;
        this.zCenter = zCenter;

        this.xSize = xSize;
        this.ySize = ySize;
        this.zSize = zSize;

        this.molecules = [];

        return this;
      }

      function Molecule(name, intensity) {
        this.name = name;
        this.intensity = intensity;

        return this;
      }

      const FieldPositionMap = {
        id: 0,
        xCenter: 1,
        yCenter: 2,
        zCenter: 3,
        xSize: 4,
        ySize: 5,
        zSize: 6,
      };
      Object.freeze(FieldPositionMap);

      return {Cuboid, Molecule, read};
    },
);
