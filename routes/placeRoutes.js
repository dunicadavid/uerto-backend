const express = require('express');
const placeControllers = require('../controllers/placeControllers');
const router = express.Router();

// @route GET && POST - /places/
router
    .route("/")
    .get(placeControllers.getAllPlaces)
    .post(placeControllers.createPlace);

router.route("/id=:id").get(placeControllers.getPlaceById);

router.route("/id=:id/activity").get(placeControllers.getActivities);

router.route("/search=:name").get(placeControllers.getPlaceByName);

router.route("/availability").get(placeControllers.getAvailability);

router.route("/interaction/block-user").post(placeControllers.blockUser);

router.route("/interaction/unblock-user").delete(placeControllers.unblockUser);

module.exports = router;