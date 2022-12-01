const Reservation = require('../models/Reservation');

exports.createReservation = async (req, res, next) => {
    try {
        let {idplace, iduser, date, hour, party_size} = req.body;
        let reservation = new Reservation(idplace, iduser, date, hour, party_size);

        reservation = await reservation.save();

        res.status(201).json({message : "Reservaion created"});
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