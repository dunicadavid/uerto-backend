const Place = require('../models/Place');

const geo = require('geo-hash');
const proximityhash = require('proximityhash');

exports.getAllPlaces = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        const type = req.query.type;

        const filter = req.query.filter || '0';
        const latitude = parseFloat(req.query.latitude);
        const longitude = parseFloat(req.query.longitude);
        const radius = parseInt(req.query.radius);

        const sortedBy = req.query.sorted || '0';

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const results = {}
        let geohashesOptions = {};
        let proximityGeohashes = [];

        if (latitude && longitude && radius) {
            geohashesOptions = {
                latitude: latitude,
                longitude: longitude,
                radius: radius,
                precision: 6,
                georaptorFlag: true,
                minlevel: 1,
                maxlevel: 12,
                approxHashCount: true
            }
            proximityGeohashes = proximityhash.createGeohashes(geohashesOptions);
            proximityGeohashes.forEach((each, index) => proximityGeohashes[index] = `\'${each}\'`);
        }

        //console.log(proximityGeohashes, proximityGeohashes.length);
        //(node:21720) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [Bus]. Use emitter.setMaxListeners() to increase limit (Use `node --trace-warnings ...` to show where the warning was created)

        const [places, _] = await Place.findAll(filter.replaceAll(' ', '=1 AND '), proximityGeohashes, type, sortedBy);

        if (endIndex < places.length) {
            results.next = {
                page: page + 1,
                limit
            }
        }

        if (startIndex > 0) {
            results.previous = {
                page: page - 1,
                limit
            }
        }

        results.results = places.slice(startIndex, endIndex);
        res.status(200).json(results);

    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.createPlace = async (req, res, next) => {
    try {
        let { name, category, location, latitude, longitude, hoursOfOpp } = req.body;
        let place = new Place(name, category, location, latitude, longitude, hoursOfOpp);

        place = await place.save();

        res.status(201).json({ message: "Place created" });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.updatePlaceInfo = async (req, res, next) => {
    try {
        const { idplace, name, hoursOfOpp, category, price } = req.body;
        const user = new Place();
        await user.updateInfo(idplace, name, hoursOfOpp, category, price);

        res.status(201).json({ message: "Place updated successfull" });
    } catch (error) {
        console.log(error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(405).json({ message: "Cannot use duplicates" });
        } else {
            next(error);
        }
    }
}

exports.updatePlaceLocation = async (req, res, next) => {
    try {
        const { idplace, location, latitude, longitude } = req.body;
        const geohash = geo.encode(latitude, longitude);

        const user = new Place();
        await user.updateLocation(idplace, location, latitude, longitude, geohash);

        res.status(201).json({ message: "Place updated successfull" });
    } catch (error) {
        console.log(error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(405).json({ message: "Cannot use duplicates" });
        } else {
            next(error);
        }
    }
}

exports.updatePlaceFilterRestaurant = async (req, res, next) => {
    try {
        const { idplace, makeTrue, makeFalse } = req.body;
        let queryString = '';

        makeTrue.forEach((value) => {
            queryString += value + ' = 1, ';
        });

        makeFalse.forEach((value) => {
            queryString += value + ' = 0, ';
        });

        queryString = queryString.substring(0,queryString.length - 2); 

        console.log(queryString);

        const user = new Place();
        await user.updateFilterRestaurant(idplace, queryString);

        res.status(201).json({ message: "Place updated successfull" });
    } catch (error) {
        console.log(error);
        if (error.code === 'ER_BAD_FIELD_ERROR') {
            res.status(405).json({ message: "Unknown place atribute"});
        } else {
            next(error);
        }
    }
}

exports.updatePlaceFilterLeasure = async (req, res, next) => {
    try {
        const { idplace, makeTrue, makeFalse } = req.body;
        let queryString = '';

        makeTrue.forEach((value) => {
            queryString += value + ' = 1, ';
        });

        makeFalse.forEach((value) => {
            queryString += value + ' = 0, ';
        });

        queryString = queryString.substring(0,queryString.length - 2); 

        console.log(queryString);

        const user = new Place();
        await user.updateFilterLeasure(idplace, queryString);

        res.status(201).json({ message: "Place updated successfull" });
    } catch (error) {
        console.log(error);
        if (error.code === 'ER_BAD_FIELD_ERROR') {
            res.status(405).json({ message: "Unknown place atribute"});
        } else {
            next(error);
        }
    }
}

exports.getPlaceById = async (req, res, next) => {
    try {
        const idplace = req.params.id;
        const iduser = req.query.iduser;

        let [place, _] = await Place.findById(idplace);
        let [check] = await Place.favouriteCheck(iduser, idplace);

        place[0].favourite = check[0].favourite;

        res.status(200).json({ place: place[0] });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getActivities = async (req, res, next) => {
    try {
        let placeId = req.params.id;
        let [place, _] = await Place.activities(placeId);

        res.status(200).json({ activities: place });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getPlacesByName = async (req, res, next) => {
    try {
        let placeName = req.params.name;
        let [places, _] = await Place.findByName(placeName);

        res.status(200).json({ count: places.length, places });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getPlacesByFavourite = async (req, res, next) => {
    try {
        const iduser = req.params.id;
        const [places, _] = await Place.findByFavourite(iduser);
        if (places.length !== 0) {
            res.status(200).json({ count: places.length, places });
        } else {
            res.status(404).json({ message: "There is no place in your favourites list" });
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.blockUser = async (req, res, next) => {
    try {
        let { placeId, userId } = req.body;

        let place = new Place();

        place = await place.block(placeId, userId);

        res.status(201).json({ message: "Block Request created" });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.unblockUser = async (req, res, next) => {
    try {
        let { placeId, userId } = req.body;

        let place = new Place();

        place = await place.unblock(placeId, userId);

        res.status(200).json({ message: "Unblock Request deleted" });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getAvailability = async (req, res, next) => {
    try {
        const idactivity = req.query.idactivity;
        const date = req.query.date;
        const partySize = req.query.partySize;

        const [reservations, _] = await Place.availability(date, idactivity, partySize);
        const [seating,] = await Place.seating(idactivity, partySize);
        const [activityInfo,] = await Place.activityInfo(idactivity);
        const { hoursOfOpp, reservationTime } = activityInfo[0];

        ///diviziune de timp pentru timp-alocat-activitate si perioada-activitate [o unitate = 5 minute]
        const activityTimeDivision = reservationTime / 5;
        //let activityTimeDivision = 17 ;
        const totalTimeDivision = (parseInt(hoursOfOpp.slice(6, 8)) - parseInt(hoursOfOpp.slice(0, 2))) * 12 + parseInt(hoursOfOpp.slice(9, 11)) / 5 + 1 - parseInt(hoursOfOpp.slice(3, 5)) / 5;
        const divideTimeSearch = totalTimeDivision - activityTimeDivision - (totalTimeDivision - activityTimeDivision) % 3;

        ///matrice pentru observarea sloturilor libere de forma {id,[array diviziuni de timp]}
        const reservationMatrix = new Map();
        ///lista cu variante de rezervare
        let result = [];

        for (let i = 0; i < seating.length; i++) {
            reservationMatrix.set(seating[i].idactivitySeating , Array(totalTimeDivision).fill(0));
        }

        reservations.forEach((value) => {
            let startIndex = (parseInt(value.hour.slice(0, 2)) - parseInt(hoursOfOpp.slice(0, 2))) * 12 + parseInt(value.hour.slice(3, 5)) / 5 - parseInt(hoursOfOpp.slice(3, 5)) / 5;
            let endIndex = startIndex + activityTimeDivision;
            if (endIndex > totalTimeDivision) {
                endIndex = totalTimeDivision;
            }
            let temporaryReservationArray = reservationMatrix.get(value.idactivitySeating);
            for (let i = startIndex; i < endIndex; i++) {
                temporaryReservationArray[i] = 1;
            }
            reservationMatrix.set(value.idactivitySeating,temporaryReservationArray);
        });

        console.log(reservationMatrix);
        for (let i = 0; i < divideTimeSearch + 3; i += 3) {
            let checkIfAlreadyChosen = false;
            let resHour;
            let index;

            for (let j = 0; j < seating.length; j++) {
                let temporaryReservationArray = reservationMatrix.get(seating[j].idactivitySeating);
                if (temporaryReservationArray[i] == 0) {
                    if (temporaryReservationArray[i + activityTimeDivision - 1] == 0) {
                        if (temporaryReservationArray[i - 3] === 1 && i !== 0) {
                            if (temporaryReservationArray[i - 3] == 0) {
                                resHour = (parseInt(hoursOfOpp.slice(0, 2)) + Math.floor((i - 2) / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3, 5)) + (i - 2) % 12 * 5).toString();
                                index = seating[j].idactivitySeating;
                                checkIfAlreadyChosen = true;
                                break;
                            } else if (temporaryReservationArray[i - 2] == 0) {
                                resHour = (parseInt(hoursOfOpp.slice(0, 2)) + Math.floor((i - 1) / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3, 5)) + (i - 1) % 12 * 5).toString();
                                index = seating[j].idactivitySeating;
                                checkIfAlreadyChosen = true;
                                break;
                            }
                        }
                        if (checkIfAlreadyChosen == false) {
                            resHour = (parseInt(hoursOfOpp.slice(0, 2)) + Math.floor(i / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3, 5)) + i % 12 * 5).toString();
                            index = seating[j].idactivitySeating;
                            checkIfAlreadyChosen = true;
                        }
                    } else {
                        if (temporaryReservationArray[i - 3] === 1 && i !== 0) {
                            if (temporaryReservationArray[i - 2] == 0 && temporaryReservationArray[i + activityTimeDivision - 3] == 0) {
                                resHour = (parseInt(hoursOfOpp.slice(0, 2)) + Math.floor((i - 2) / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3, 5)) + (i - 2) % 12 * 5).toString();
                                index = seating[j].idactivitySeating;
                                checkIfAlreadyChosen = true;
                                break;
                            } else if (temporaryReservationArray[i - 1] == 0 && temporaryReservationArray[i + activityTimeDivision - 2] == 0) {
                                resHour = (parseInt(hoursOfOpp.slice(0, 2)) + Math.floor((i - 1) / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3, 5)) + (i - 1) % 12 * 5).toString();
                                index = seating[j].idactivitySeating;
                                checkIfAlreadyChosen = true;
                                break;
                            }
                        }
                    }

                }
            }
            if (checkIfAlreadyChosen == true) {
                result.push({ "hour": resHour, "idactivitySeating": index });
            }
        }

        for (let i = divideTimeSearch + 3; i < totalTimeDivision; i += 3) {
            let checkIfAlreadyChosen = false;
            let resHour;
            let index;
            for (let j = 0; j < seating.length; j++) {
                let temporaryReservationArray = reservationMatrix.get(seating[j].idactivitySeating);
                if (temporaryReservationArray[i] == 0 && temporaryReservationArray[totalTimeDivision - 1] == 0) {
                    if (temporaryReservationArray[i - 3] === 1 && i !== 0) {
                        if (temporaryReservationArray[i - 2] == 0) {
                            resHour = (parseInt(hoursOfOpp.slice(0, 2)) + Math.floor((i - 2) / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3, 5)) + (i - 2) % 12 * 5).toString();
                            index = j + 1;
                            checkIfAlreadyChosen = true;
                            break;
                        } else if (temporaryReservationArray[i - 1] == 0) {
                            resHour = (parseInt(hoursOfOpp.slice(0, 2)) + Math.floor((i - 1) / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3, 5)) + (i - 1) % 12 * 5).toString();
                            index = j + 1;
                            checkIfAlreadyChosen = true;
                            break;
                        }
                    }
                    if (checkIfAlreadyChosen == false) {
                        resHour = (parseInt(hoursOfOpp.slice(0, 2)) + Math.floor(i / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3, 5)) + i % 12 * 5).toString();
                        index = j + 1;
                        checkIfAlreadyChosen = true;
                    }
                }
            }
            if (checkIfAlreadyChosen == true) {
                result.push({ "hour": resHour, "idactivitySeating": index });
            }
        }

        res.status(200).json({ result });
    } catch (error) {
        console.log(error);
        next(error);
    }
}


exports.getRecommendation = async (req, res, next) => {
    res.status(404).json({ message: 'Not Implemented' });
}