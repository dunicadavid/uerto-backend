const db = require('../config/db');

class Reservation {
    constructor(idplace, iduser, date, hour, party_size) {
        this.idplace = idplace;
        this.iduser = iduser;
        this.date = date;
        this.hour = hour;
        this.party_size = party_size;
    }

    async save() {
        let sql = `
        INSERT INTO reservation(
            place,
            customer,
            date,
            hour,
            party_size)
        VALUES(
            ${this.idplace},
            ${this.iduser},
            '${this.date}',
            '${this.hour}',
            ${this.party_size}
        );`;

        const [newReservation, _] = await db.execute(sql);

        return newReservation;
    }

    static findByUser(id) {
        let sql = `SELECT * FROM reservation where customer = ${id};`;

        return db.execute(sql);
    }
}

module.exports = Reservation;