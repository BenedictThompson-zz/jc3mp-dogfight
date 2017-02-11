'use strict';

function randomSpawn(baseVec, radius) {
  const half = radius / 2;
  return new Vector3f(baseVec.x + freeroam.utils.random(-half, half),
    baseVec.y,
    baseVec.z + freeroam.utils.random(-half, half));
}

module.exports = ({ Command, manager }) => {
};
