const express = require('express');
const userControllers = require('../controllers/userControllers');
const router = express.Router();

// @route GET && POST - /places/
router.route("/create").post(userControllers.createUser);
router.route("/update").put(userControllers.updateUser);
router.route("/id=:id").get(userControllers.getUserById);

module.exports = router;