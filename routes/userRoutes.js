const express = require('express');
const userControllers = require('../controllers/userControllers');
const router = express.Router();

// @route GET && POST - /users/
router.route("/create").post(userControllers.createUser);
router.route("/update").put(userControllers.updateUser);
router.route("/id=:id").get(userControllers.getUserById);
router.route("/authid=:id").get(userControllers.getUserByAuthId);

module.exports = router;