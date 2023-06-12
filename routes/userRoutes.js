const express = require('express');
const userControllers = require('../controllers/userControllers');
const middleware = require('../models/Middleware');
const router = express.Router();
const { uploadUser } = require('../config/storage.js');


// @route GET && POST - /users/
router.route("/create").post(uploadUser.single("image"),userControllers.createUser);       //[authorizata prin decodarea tokenului si transferul de uid]
router.route("/update").put(middleware.UserAuthorization,userControllers.updateUser);
router.route("/update/profile-image").put(middleware.UserAuthorization,uploadUser.single("image"),userControllers.updateUserProfileImage);
router.route("/update/strategy").put(middleware.UserAuthorization,userControllers.updateUserStrategy);
router.route("/id=:id").get(userControllers.getUserById);
router.route("/idauth").get(userControllers.getUserByAuthId);   //[authorizata prin decodarea tokenului si transferul de uid]

router.route("/interaction/rate-requests").get(middleware.UserAuthorization,userControllers.getRateRequests); 
router.route("/interaction/rate-requests").delete(middleware.UserAuthorization,userControllers.deleteRateRequest); 

router.route("/interaction/rate-place").post(middleware.UserAuthorization,userControllers.ratePlace); 
router.route("/interaction/favourite-place").post(middleware.UserAuthorization,userControllers.makePlaceFavourite);
router.route("/interaction/unfavourite-place").delete(middleware.UserAuthorization,userControllers.makePlaceUnfavourite);

module.exports = router;