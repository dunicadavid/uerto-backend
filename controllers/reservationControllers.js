const Reservation = require('../models/Reservation');

exports.createReservation = async (req, res, next) => {
    try {
        const {idplace, idactivity, idactivitySeating, iduser, date, hour, partySize} = req.body;
        const reservation = new Reservation(idplace, idactivity, iduser, date, hour, partySize);

        if (await reservation.verifyReservationConsistancy(idactivitySeating)) {

            const err = await reservation.save(idactivitySeating);
            if(!err) {
                res.status(201).json({message : "Reservaion created"});
            } else {
                res.status(500).json({message : err});
            }
            

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
        const iduser = req.query.iduser;
        const time = req.query.time;

        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const results = {}

        console.log(iduser,time);
        const date = new Date().toJSON().slice(0, 10);
        const hour = new Date().toLocaleString("en-US", { hour12: false }).slice(10, 15); ///????????????????? 10-15 sau 11-16
        console.log(iduser, time, date, hour); 

        const [reservations, _ ] = await Reservation.findByUser(iduser, time, date, hour);

        if (endIndex < reservations.length) {
            results.next = {
                page: page + 1,
                limit
            }
        }

        if (startIndex > 0) {
            results.previous = {
                page: page - 1,
                limit
            }
        }
        
        results.count = reservations.length;
        results.results = reservations.slice(startIndex, endIndex);

        if(reservations.length !== 0) {
            res.status(200).json(results);
        } else {
            res.status(404).json({message : "There are no reservations available"});
        }
        
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getReservationById = async (req, res, next) => {
    try {
        const idreservation = req.params.id;
        const [reservation, _ ] = await Reservation.findById(idreservation);
        if(reservation.length !== 0) {
            res.status(200).json(reservation[0]);
        } else {
            res.status(404).json({message : "There is no reservation with that id"});
        }


    } catch (error) {
        console.log(error);
        next(error);
    }
}