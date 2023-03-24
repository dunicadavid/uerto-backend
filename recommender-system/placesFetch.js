const GeohashDistance = require('geohash-distance');
const Place = require('../models/Place');

exports.preparePlaces = async () => {

    console.log('(0) Fetching data');
    const [places, _] = await Place.getPlacesFilters();

    console.log('(1) Extracting Features');
    let X = places.map(toFeaturizedPlaces());

    console.log('(2) Calculating Coefficients');
    let { means, ranges } = getCoefficients(X);

    console.log(means, ranges);

    console.log('(3) Synthesizing Features');
    X = synthesizeFeatures(X, means, [0, 1, 2, 3, 4, 5, 6]);

    console.log('(4) Scaling Features \n');
    X = scaleFeatures(X, means, ranges);

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
        //console.log(featureVector);
        return featureVector;
    }
}

function toFeaturizedMorning(place) {
    return parseInt(place.hoursOfOpp.substring(1, 3)) < 9 ? 1 : 0;
}

function toFeaturizedNight(place) {
    return parseInt(place.hoursOfOpp.substring(6, 8)) >= 21 ? 1 : 0;
}

function toFeaturizedCenter(place) {
    return parseInt(GeohashDistance.inKm(place.geohash, 'sxfscg5sf'));
}

function toFeaturizedFilters(place) {
    const filters = place.filters.split('');
    return filters.map((value) => value === '1' ? 1 : 0);
}

function getCoefficients(X) {
    const M = X.length;

    const initC = {
        sums: [],
        mins: [],
        maxs: [],
    };

    const helperC = X.reduce((result, row) => {
        if (row.includes('undefined')) {
            return result;
        }

        return {
            sums: row.map((feature, key) => {
                if (result.sums[key]) {
                    return result.sums[key] + feature;
                } else {
                    return feature;
                }
            }),
            mins: row.map((feature, key) => {
                if (result.mins[key] === 'undefined') {
                    return result.mins[key];
                }

                if (result.mins[key] <= feature) {
                    return result.mins[key];
                } else {
                    return feature;
                }
            }),
            maxs: row.map((feature, key) => {
                if (result.maxs[key] === 'undefined') {
                    return result.maxs[key];
                }

                if (result.maxs[key] >= feature) {
                    return result.maxs[key];
                } else {
                    return feature;
                }
            }),
        };
    }, initC);
    const means = helperC.sums.map(value => value / M);
    const ranges = helperC.mins.map((value, key) => helperC.maxs[key] - value);

    return { ranges, means };
}

function scaleFeatures(X, means, ranges) {
    return X.map((row) => {
        return row.map((feature, key) => {
            return (feature - means[key]) / (ranges[key] !== 0 ? ranges[key] : Number.MIN_VALUE);
        });
    });
}

function synthesizeFeatures(X, means, featureIndexes) {
    return X.map((row) => {
        return row.map((feature, key) => {
            if (featureIndexes.includes(key) && feature === 'undefined') {
                return means[key];
            } else {
                return feature;
            }
        });
    });
}