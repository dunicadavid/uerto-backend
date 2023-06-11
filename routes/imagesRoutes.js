const express = require('express');
const userControllers = require('../controllers/userControllers');
const router = express.Router();


// @route GET && POST - /images/

router.route("/profile-image/:filename").get(userControllers.getUserProfileImage);

module.exports = router;