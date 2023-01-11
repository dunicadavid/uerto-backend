const Reservation = require('../models/Reservation');

exports.createReservation = async (req, res, next) => {
    try {
        let {idplace, idactivity, idactivity_seating, iduser, date, hour, party_size} = req.body;
        let reservation = new Reservation(idplace, idactivity, iduser, date, hour, party_size);

        if (await reservation.verifyReservationConsistancy(idactivity_seating)) {
            reservation = await reservation.save();
            res.status(201).json({message : "Reservaion created"});
        } else {
            res.status(406).json({message : "Not Acceptable"});
        }

    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getReservationsByUser = async (req, res, next) => {
    try {
        let userId = req.params.id;

        let [reservation, _ ] = await Reservation.findByUser(userId);

        res.status(200).json({count : reservation.length,reservation});
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}