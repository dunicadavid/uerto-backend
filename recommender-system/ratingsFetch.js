const User = require('../models/User');


exports.prepareRatingsOfUser = async (iduser) => {

    console.log('(5) Fetching users ratings');
    const [ratings, _] = await User.getRatingsOfUser(iduser);
    let ratingsGroupedByUser = {};

    ratings.forEach((value) => {
        ratingsGroupedByUser[value.place]= {rating : value.rating};
    });

    return ratingsGroupedByUser;
}

exports.prepareRatings = async () => {

    console.log('(6) Fetching all ratings');
    const [ratings, _] = await User.getAllRatings();
    
    let result = {};
    let ratingsGroupedByUser = {};
    let ratingsGroupedByPlace = {};

    ratings.forEach((value) => {
        let pairUserRate = {};
        pairUserRate[value.user] = {rating : value.rating};
        ratingsGroupedByPlace[value.place] = Object.assign(ratingsGroupedByPlace[value.place] || {}, pairUserRate);
        let pairPlaceRate = {};
        pairPlaceRate[value.place] = {rating : value.rating};
        ratingsGroupedByUser[value.user] = Object.assign(ratingsGroupedByUser[value.user] || {}, pairPlaceRate);
    });

    result.ratingsGroupedByPlace = ratingsGroupedByPlace;
    result.ratingsGroupedByUser = ratingsGroupedByUser;

    return result;
}