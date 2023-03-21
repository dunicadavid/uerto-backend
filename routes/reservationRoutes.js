const express = require('express');
const reservationControllers = require('../controllers/reservationControllers');
const middleware = require('../models/Middleware');
const router = express.Router();


// @route GET && POST - /reservations/
router.route("/create").post(middleware.UserAuthorization,reservationControllers.createReservation);
router.route("/delete").delete(reservationControllers.deleteReservation);  //authorize
router.route("/id=:id").get(reservationControllers.getReservationById);
router.route("/").get(middleware.UserAuthorization,reservationControllers.getReservationsByUser); 


module.exports = router;