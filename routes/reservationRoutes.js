const express = require('express');
const reservationControllers = require('../controllers/reservationControllers');
const router = express.Router();

// @route GET && POST - /reservations/
router.route("/create").post(reservationControllers.createReservation);

router.route("/user=:id").get(reservationControllers.getReservationsByUser);
module.exports = router;