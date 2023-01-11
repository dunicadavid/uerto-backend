const Place = require('../models/Place');

const proximityhash = require('proximityhash');

exports.getAllPlaces = async (req, res, next) => {
    try {
        console.time("dbsave");
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

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

        if(latitude && longitude && radius) {
            geohashesOptions = {
                latitude : latitude,
                longitude : longitude,
                radius : radius,
                precision : 6,
                georaptorFlag : true,
                minlevel : 1,
                maxlevel : 12,
                approxHashCount : true 
            }
            proximityGeohashes = proximityhash.createGeohashes(geohashesOptions);
            proximityGeohashes.forEach((each,index) => proximityGeohashes[index] = `\'${each}\'`);
            console.timeEnd("dbsave");
        }

        //console.log(proximityGeohashes, proximityGeohashes.length);
        //(node:21720) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [Bus]. Use emitter.setMaxListeners() to increase limit (Use `node --trace-warnings ...` to show where the warning was created)

        const [places, _ ] = await Place.findAll(filter.replaceAll(' ', '=1 AND '), proximityGeohashes, sortedBy);

        if(endIndex < places.length){
            results.next = {
                page : page + 1,
                limit
            }
        }

        if(startIndex > 0) {
            results.previous = {
                page : page - 1,
                limit
            }
        }

        results.results = places.slice(startIndex,endIndex);
        res.status(200).json(results);

    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.createPlace = async (req, res, next) => {
    try {
        let {name, category, location, latitude, longitude, hoursOfOpp} = req.body;
        let place = new Place(name, category, location, latitude, longitude, hoursOfOpp);

        place = await place.save();

        res.status(201).json({message : "Place created"});
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getPlaceById = async (req, res, next) => {
    try {
        let placeId = req.params.id;
        let [place, _ ] = await Place.findById(placeId);

        res.status(200).json({place : place[0]});
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getActivities = async (req, res, next) => {
    try {
        let placeId = req.params.id;
        let [place, _ ] = await Place.activities(placeId);

        res.status(200).json({activities : place});
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getPlaceByName = async (req, res, next) => {
    try {
        let placeName = req.params.name;
        let [places, _ ] = await Place.findByName(placeName);

        res.status(200).json({count : places.length, places});
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.blockUser = async (req, res, next) => {
    try {
        let {placeId, userId} = req.body;

        let place = new Place();

        place = await place.block(placeId, userId);

        res.status(201).json({message : "Block Request created"});
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.unblockUser = async (req, res, next) => {
    try {
        let {placeId, userId} = req.body;

        let place = new Place();

        place = await place.unblock(placeId, userId);

        res.status(200).json({message : "Unblock Request deleted"});
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getAvailability = async (req, res, next) => {
    try {
        let {date, activityId, partySize} = req.body;
        let [reservations, _ ] = await Place.availability(date,activityId,partySize);
        let [seating,] = await Place.seating(activityId,partySize);
        let [activityInfo,] = await Place.activityInfo(activityId);
        let {hoursOfOpp,reservationTime} = activityInfo[0];

        ///diviziune de timp pentru timp-alocat-activitate si perioada-activitate [o unitate = 5 minute]
        let activityTimeDivision = reservationTime / 5 ;
        //let activityTimeDivision = 17 ;
        let totalTimeDivision = (parseInt(hoursOfOpp.slice(6,8)) - parseInt(hoursOfOpp.slice(0,2))) * 12 + parseInt(hoursOfOpp.slice(9,11)) / 5 + 1 - parseInt(hoursOfOpp.slice(3,5)) / 5;
        let divideTimeSearch = totalTimeDivision - activityTimeDivision - (totalTimeDivision - activityTimeDivision) % 3; 

        ///matrice pentru observarea sloturilor libere
        let reservationMatrix = [];
        ///lista cu variante de rezervare
        let result = [];

        for(let i = 0 ; i < seating.length ; i++) {
            reservationMatrix.push(Array(totalTimeDivision).fill(0));
        }
        reservations.forEach((value)=>{
            let startIndex = (parseInt(value.hour.slice(0,2)) - parseInt(hoursOfOpp.slice(0,2))) * 12 + parseInt(value.hour.slice(3,5)) / 5 - parseInt(hoursOfOpp.slice(3,5)) / 5;
            let endIndex = startIndex + activityTimeDivision;
            if(endIndex > totalTimeDivision) {
                endIndex = totalTimeDivision;
            }
            for(let i = startIndex ; i < endIndex ; i++) {
                reservationMatrix[value.idactivity_seating - 1][i] = 1;
            }
        });
   
 
        for(let i = 0 ; i < divideTimeSearch + 3; i+=3) {
            let checkIfAlreadyChosen = false;
            let resHour;
            let index;

            for(let j = 0 ; j < seating.length; j++) {
                if(reservationMatrix[j][i] == 0) {
                    if(reservationMatrix[j][i+activityTimeDivision-1] == 0) {
                        if(reservationMatrix[j][i-3] === 1 && i !== 0) {
                            if(reservationMatrix[j][i-3] == 0) {
                                resHour = (parseInt(hoursOfOpp.slice(0,2)) + Math.floor((i - 2) / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3,5)) + (i - 2) % 12 * 5 ).toString();
                                index = j+1;
                                checkIfAlreadyChosen = true;
                                break;
                            } else if(reservationMatrix[j][i-2] == 0) {
                                resHour = (parseInt(hoursOfOpp.slice(0,2)) + Math.floor((i - 1) / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3,5)) + (i - 1) % 12 * 5 ).toString();
                                index = j+1;
                                checkIfAlreadyChosen = true;
                                break;
                            }
                        }
                        if(checkIfAlreadyChosen == false) {
                            resHour = (parseInt(hoursOfOpp.slice(0,2)) + Math.floor(i / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3,5)) + i % 12 * 5 ).toString();
                            index = j+1;
                            checkIfAlreadyChosen = true;
                        }
                    } else {
                        if(reservationMatrix[j][i-3] === 1 && i !== 0) {
                            if(reservationMatrix[j][i-2] == 0 && reservationMatrix[j][i+activityTimeDivision-3] == 0) {
                                resHour = (parseInt(hoursOfOpp.slice(0,2)) + Math.floor((i - 2) / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3,5)) + (i - 2) % 12 * 5 ).toString();
                                index = j+1;
                                checkIfAlreadyChosen = true;
                                break;
                            } else if(reservationMatrix[j][i-1] == 0 && reservationMatrix[j][i+activityTimeDivision-2] == 0) {
                                resHour = (parseInt(hoursOfOpp.slice(0,2)) + Math.floor((i - 1) / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3,5)) + (i - 1) % 12 * 5 ).toString();
                                index = j+1;
                                checkIfAlreadyChosen = true;
                                break;
                            }
                        }
                    }
                    
                } 
            }
            if(checkIfAlreadyChosen == true) {
                result.push({"hour" : resHour,"idactivity_seating": index});  
            } 
        }

        for(let i = divideTimeSearch + 3 ; i < totalTimeDivision ; i+=3) {
            let checkIfAlreadyChosen = false;
            let resHour;
            let index;
            for(let j = 0 ; j < seating.length; j++) {
                if(reservationMatrix[j][i] == 0 && reservationMatrix[j][totalTimeDivision - 1] == 0) {
                    if(reservationMatrix[j][i-3] === 1 && i !== 0) {
                        if(reservationMatrix[j][i-2] == 0) {
                            resHour = (parseInt(hoursOfOpp.slice(0,2)) + Math.floor((i - 2) / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3,5)) + (i - 2) % 12 * 5 ).toString();
                            index = j+1;
                            checkIfAlreadyChosen = true;
                            break;
                        } else if(reservationMatrix[j][i-1] == 0) {
                            resHour = (parseInt(hoursOfOpp.slice(0,2)) + Math.floor((i - 1) / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3,5)) + (i - 1) % 12 * 5 ).toString();
                            index = j+1;
                            checkIfAlreadyChosen = true;
                            break;
                        }
                    }
                    if(checkIfAlreadyChosen == false) {
                        resHour = (parseInt(hoursOfOpp.slice(0,2)) + Math.floor(i / 12)).toString() + ':' + (parseInt(hoursOfOpp.slice(3,5)) + i % 12 * 5 ).toString();
                        index = j+1;
                        checkIfAlreadyChosen = true;
                    }
                }
            }
            if(checkIfAlreadyChosen == true) {
                result.push({"hour" : resHour,"idactivity_seating": index});  
                console.log(divideTimeSearch,resHour);
            } 
        }

        res.status(200).json({result});
    } catch (error) {
        console.log(error);
        next(error);
    }
}

