const axios = require('axios');

var nominCache = {};

var nomin = {
  reverse: (lat, lon) => {
    return new Promise((resolve, reject) => {
      if (nominCache[`c${lat}${lon}`]) {
        resolve(nominCache[`c${lat}${lon}`]);
      } else {
        axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
        .then((response) => {
          var info = response.data;
          nominCache[`c${lat}${lon}`] = info;
          resolve(info);
        })
        .catch((err) => {
          resolve(false);
        });
      }
    });
  }
}

module.exports = nomin;
