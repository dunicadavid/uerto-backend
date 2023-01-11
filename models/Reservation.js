const db = require('../config/db');

class Reservation {
    constructor(idplace, idactivity, iduser, date, hour, party_size) {
        this.idplace = idplace;
        this.idactivity = idactivity;
        this.iduser = iduser;
        this.date = date;
        this.hour = hour;
        this.party_size = party_size;
    }

    async save(idactivity_seating) {
        let sql = `
        INSERT INTO uerto.reservation(
            place,
            activity,
            customer,
            date,
            hour,
            party_size
        )
        VALUES(
            ${this.idplace},
            ${this.idactivity},
            ${this.iduser},
            '${this.date}',
            '${this.hour}',
            ${this.party_size}
        );`;

        const [newReservation, _] = await db.execute(sql);

        ///work in progress - sterg activity_arrangement!!!
        sql = `INSERT INTO uerto.activity_arrangement (reservation, activity_seating)
        values (44,${idactivity_seating});`;

        await db.execute(sql);
        
        return newReservation;
    }

    async verifyReservationConsistancy(idactivity_seating) {
        let sql = `select hour from activity_arrangement s join reservation r on s.reservation=r.idreservation 
        where r.date = '${this.date}' AND s.activity_seating = '${idactivity_seating}';`;

        const [reservations, _] = await db.execute(sql);

        sql = `select hoursOfOpp, reservationTime from activity where idactivity = ${this.idactivity};`;
        const [activityInfo, ] = await db.execute(sql);
        let {hoursOfOpp, reservationTime} = activityInfo[0];

        let activityTimeDivision = reservationTime / 5 ;
        let totalTimeDivision = (parseInt(hoursOfOpp.slice(6,8)) - parseInt(hoursOfOpp.slice(0,2))) * 12 + parseInt(hoursOfOpp.slice(9,11)) / 5 + 1 - parseInt(hoursOfOpp.slice(3,5)) / 5;
        let reservationArray = Array(totalTimeDivision).fill(0);
        let thisHourIndex = (parseInt(this.hour.slice(0,2)) - parseInt(hoursOfOpp.slice(0,2))) * 12 + parseInt(this.hour.slice(3,5)) / 5 - parseInt(hoursOfOpp.slice(3,5)) / 5;

        reservations.forEach((value)=>{
            let startIndex = (parseInt(value.hour.slice(0,2)) - parseInt(hoursOfOpp.slice(0,2))) * 12 + parseInt(value.hour.slice(3,5)) / 5 - parseInt(hoursOfOpp.slice(3,5)) / 5;
            let endIndex = startIndex + activityTimeDivision;
            if(endIndex > totalTimeDivision) {
                endIndex = totalTimeDivision;
            }
            for(let i = startIndex ; i < endIndex ; i++) {
                reservationArray[i] = 1;
            }
        });

        console.log(totalTimeDivision,thisHourIndex,activityTimeDivision,reservations,reservationArray);
 
        return reservationArray[thisHourIndex] === 0 && reservationArray[thisHourIndex+activityTimeDivision-1] === 0;
    }

    static findByUser(id) {
        let sql = `SELECT * FROM reservation where customer = ${id};`;

        return db.execute(sql);
    }
}

module.exports = Reservation;