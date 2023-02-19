const express = require('express');
const userControllers = require('../controllers/userControllers');
const router = express.Router();

// @route GET && POST - /user/
router.route("/create").post(userControllers.createUser);
router.route("/update").put(userControllers.updateUser);
router.route("/id=:id").get(userControllers.getUserById);
router.route("/authid=:id").get(userControllers.getUserByAuthId);


router.route("/interaction/rate-place").post(userControllers.ratePlace); //not implemented
router.route("/interaction/favourite-place").post(userControllers.makePlaceFavourite);
router.route("/interaction/unfavourite-place").delete(userControllers.makePlaceUnfavourite);

module.exports = router;