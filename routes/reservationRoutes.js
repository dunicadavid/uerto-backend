const express = require('express');
const reservationControllers = require('../controllers/reservationControllers');
const router = express.Router();

// @route GET && POST - /reservations/
router.route("/create").post(reservationControllers.createReservation);
router.route("/id=:id").get(reservationControllers.getReservationById);
router.route("/").get(reservationControllers.getReservationsByUser); //edit previous and future


module.exports = router;