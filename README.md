# ili volume raycasting

Demo project with raycasting implementation.

Web server: express.js

Install: ```npm install``` or ```make install```

To run the server use ```node index.js``` or ```make```

## TODO
* Change the pivot of the cuboid from (0, 0, 0) to its center.
* Generate colormap from colorstops, remove predefined assets.
* Think about serialization.
* DataLoader should also load shape volume.
* Code refactoring required. 
    * DataLoader and VolumeUtils should have consistent infrastructure.
    * Add errors handling.
* Add comments!
