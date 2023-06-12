const express = require('express');
const userControllers = require('../controllers/userControllers');
const placeControllers = require('../controllers/placeControllers');
const router = express.Router();


// @route GET && POST - /images/

router.route("/profile-image/:filename").get(userControllers.getUserProfileImage);
router.route("/places/:filename").get(placeControllers.getPlaceImage);

module.exports = router;