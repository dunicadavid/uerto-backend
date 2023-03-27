const express = require('express');
const placeControllers = require('../controllers/placeControllers');
const middleware = require('../models/Middleware');
const router = express.Router();

// @route GET && POST - /places/
//BY PLACE
router.route("/create").post(placeControllers.createPlace); //modificam ulterior + authorization check
router.route("/update/info").put(placeControllers.updatePlaceInfo); 
router.route("/update/location").put(placeControllers.updatePlaceLocation); 
router.route("/update/filter/restaurant").put(placeControllers.updatePlaceFilterRestaurant);
router.route("/update/filter/leasure").put(placeControllers.updatePlaceFilterLeasure);

router.route("/interaction/block-user").post(placeControllers.blockUser); //authorize
router.route("/interaction/unblock-user").delete(placeControllers.unblockUser);

//BY USERS
router.route("/").get(placeControllers.getAllPlaces); 
router.route("/id=:id").get(placeControllers.getPlaceById);          
router.route("/search=:name").get(placeControllers.getPlacesByName);
router.route("/favourites-of-user=:iduser").get(middleware.UserAuthorization, placeControllers.getPlacesByFavourite);
router.route("/id=:id/activity").get(placeControllers.getActivities);
router.route("/availability").get(placeControllers.getAvailability);
router.route("/recommend").get(middleware.UserAuthorization, placeControllers.getRecommendation); 


module.exports = router;