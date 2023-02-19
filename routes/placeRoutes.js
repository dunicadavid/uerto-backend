const express = require('express');
const placeControllers = require('../controllers/placeControllers');
const router = express.Router();

// @route GET && POST - /places/
//BY PLACE
router.route("/create").post(placeControllers.createPlace); //modificam ulterior
router.route("/update/info").put(placeControllers.updatePlaceInfo); 
router.route("/update/location").put(placeControllers.updatePlaceLocation); 
router.route("/update/filter/restaurant").put(placeControllers.updatePlaceFilterRestaurant);
router.route("/update/filter/leasure").put(placeControllers.updatePlaceFilterLeasure);

router.route("/interaction/block-user").post(placeControllers.blockUser);
router.route("/interaction/unblock-user").delete(placeControllers.unblockUser);

//BY USERS
router.route("/").get(placeControllers.getAllPlaces); 
router.route("/id=:id").get(placeControllers.getPlaceById);          
router.route("/search=:name").get(placeControllers.getPlacesByName);
router.route("/favourites-of-user=:id").get(placeControllers.getPlacesByFavourite);
router.route("/id=:id/activity").get(placeControllers.getActivities);
router.route("/availability").get(placeControllers.getAvailability);
router.route("/recommend").get(placeControllers.getRecommendation); //not implemented


module.exports = router;