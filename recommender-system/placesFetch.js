const GeohashDistance = require('geohash-distance');
const Place = require('../models/Place');

exports.preparePlaces = async () => {

    const [places, _] = await Place.getPlacesFilters();

    let X = places.map(toFeaturizedPlaces());

    console.log(X);

    return {
        places,
        X,
      };
}

function toFeaturizedPlaces() {
    return function toFeatureVector(place) {
      let featureVector = [];
  
      featureVector.push(place.rating);
      featureVector.push(place.price);
      featureVector.push(toFeaturizedMorning(place));
      featureVector.push(toFeaturizedNight(place));
      featureVector.push(toFeaturizedCenter(place));    //of bucharest for now
      featureVector = featureVector.concat(toFeaturizedFilters(place));
      console.log(toFeaturizedFilters(place))
        
      return featureVector;
    }
}

function toFeaturizedMorning(place) {
    return parseInt(place.hoursOfOpp.substring(1,3)) < 9 ? 1 : 0;
}

function toFeaturizedNight(place) {
    return parseInt(place.hoursOfOpp.substring(6,8)) >= 21 ? 1 : 0;
}

function toFeaturizedCenter(place) {
    return parseInt(GeohashDistance.inKm(place.geohash,'sxfscg5sf'));
}

function toFeaturizedFilters(place) {
    const filters = place.filters.split('');
    return filters.map((value) => value === '1' ? 1 : 0);
}