const { db } = require('../config/db');
const mysql = require('mysql2/promise');

class Reservation {
    constructor(idplace, idactivity, iduser, date, hour, partySize) {
        this.idplace = idplace;
        this.idactivity = idactivity;
        this.iduser = iduser;
        this.date = date;
        this.hour = hour;
        this.partySize = partySize;
    }

    async saveOld(idactivity_seating) {
        const queries = [
            {
                query: 'INSERT INTO uerto.reservation(place,activity,customer,date,hour,partySize)VALUES(?,?,?,?,?,?);',
                parameters: [this.idplace, this.idactivity, this.iduser, this.date, this.hour, this.partySize]
            },
            {
                query: 'INSERT INTO uerto.activity_arrangement (reservation, activity_seating) values (1000,?);',
                parameters: [idactivity_seating]
            }
        ];

        pool.getConnection((err, connection) => {
            if (err) {
                pool.releaseConnection(connection);
                return;
            }
            connection.beginTransaction(function (err) {
                if (err) {
                    pool.releaseConnection(connection);
                    return;
                }
                connection.query(queries[0].query, queries[0].parameters,function (err, result) {
                    if (err) {
                        connection.rollback(function () {
                            pool.releaseConnection(connection);
                            return;
                        });
                    }
                    console.log('aici');
                    connection.query(queries[1].query, queries[1].parameters, function (err, result) {
                        if (err) {
                            connection.rollback(function () {
                                console.log('err');
                                pool.releaseConnection(connection);
                                return;
                            });
                        }
                        connection.commit(function (err) {
                            if (err) {
                                connection.rollback(function () {
                                    pool.releaseConnection(connection);
                                    return;
                                });
                            }
                        });
                    });
                    console.log('finish');
                });
            });
        });
    }

    async save(idactivity_seating) {

        const queries = [
            {
                query: 'INSERT INTO uerto.reservation(place,activity,customer,date,hour,partySize)VALUES(?,?,?,?,?,?);',
                parameters: [this.idplace, this.idactivity, this.iduser, this.date, this.hour, this.partySize]
            },
            {
                query: 'INSERT INTO uerto.activity_arrangement (reservation, activitySeating) values (LAST_INSERT_ID(),?);',
                parameters: [idactivity_seating]
            },
            {
                query: 'SELECT LAST_INSERT_ID(), reservationTime FROM activity where idactivity = ?;',
                parameters: [this.idactivity]
            }
        ];

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
        });

        try{
            await connection.beginTransaction();
            await connection.query(queries[0].query, queries[0].parameters);
            await connection.query(queries[1].query, queries[1].parameters);
            const index = await connection.query(queries[2].query, queries[2].parameters);
            await connection.commit();
            connection.destroy();
            return index;
        } catch(err) {
            connection.rollback();
            connection.destroy();
            return err.message;
        }
        
    }

    async delete(idreservation) {

        const queries = [
            {
                query: 'delete from activity_arrangement where reservation = ?;',
                parameters: [idreservation]
            },
            {
                query: 'delete from reservation where idreservation = ?;',
                parameters: [idreservation]
            }
        ];

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
        });

        try{
            await connection.beginTransaction();
            await connection.query(queries[0].query, queries[0].parameters);
            await connection.query(queries[1].query, queries[1].parameters);
            await connection.commit();
            connection.destroy();
            console.log('commit ' + idreservation);
            return;
        } catch(err) {
            console.log('ROLLBACK');
            connection.rollback();
            connection.destroy();
            return err.message;
        }
        
    }

    async verifyReservationConsistancy(idactivitySeating) {
        const queries = [
            {
                query: 'SELECT hour FROM activity_arrangement s JOIN reservation r ON s.reservation=r.idreservation WHERE r.date = ? AND s.activitySeating = ?;',
                parameters: [this.date,idactivitySeating]
            },
            {
                query: 'SELECT hoursOfOpp, reservationTime FROM activity WHERE idactivity = ?;',
                parameters: [this.idactivity]
            }
        ];

        const [reservations, _] = await db.query(queries[0].query, queries[0].parameters);
        const [activityInfo,] = await db.query(queries[1].query, queries[1].parameters);

        let { hoursOfOpp, reservationTime } = activityInfo[0];

        let activityTimeDivision = reservationTime / 5;
        let totalTimeDivision = (parseInt(hoursOfOpp.slice(6, 8)) - parseInt(hoursOfOpp.slice(0, 2))) * 12 + parseInt(hoursOfOpp.slice(9, 11)) / 5 + 1 - parseInt(hoursOfOpp.slice(3, 5)) / 5;
        let reservationArray = Array(totalTimeDivision).fill(0);
        let thisHourIndex = (parseInt(this.hour.slice(0, 2)) - parseInt(hoursOfOpp.slice(0, 2))) * 12 + parseInt(this.hour.slice(3, 5)) / 5 - parseInt(hoursOfOpp.slice(3, 5)) / 5;

        reservations.forEach((value) => {
            let startIndex = (parseInt(value.hour.slice(0, 2)) - parseInt(hoursOfOpp.slice(0, 2))) * 12 + parseInt(value.hour.slice(3, 5)) / 5 - parseInt(hoursOfOpp.slice(3, 5)) / 5;
            let endIndex = startIndex + activityTimeDivision;
            if (endIndex > totalTimeDivision) {
                endIndex = totalTimeDivision;
            }
            for (let i = startIndex; i < endIndex; i++) {
                reservationArray[i] = 1;
            }
        });

        //console.log(totalTimeDivision,thisHourIndex,activityTimeDivision,reservations,reservationArray);

        return reservationArray[thisHourIndex] === 0 && ((reservationArray[thisHourIndex + activityTimeDivision - 1] === 0 && thisHourIndex < totalTimeDivision - activityTimeDivision)||(reservationArray[totalTimeDivision - 1] === 0 && thisHourIndex >= totalTimeDivision - activityTimeDivision ));
    }

    static findById(idreservation) {
        const sql = `SELECT * FROM reservation WHERE idreservation = ?;`;
        const params = [idreservation];


        return db.query(sql, params);
    }

    static findByUser(iduser, time, date, hour) {
        if(time === 'previous') {
            const sql = 'SELECT * FROM reservation WHERE customer = ? AND date < ? UNION SELECT * FROM reservation WHERE customer = ? AND date = ? AND hour < ?;';
            const params = [iduser,date,iduser,date,hour];
            return db.query(sql, params);
        } else if (time === 'future') {
            const sql = 'SELECT * FROM reservation WHERE customer = ? AND date > ? UNION SELECT * FROM reservation WHERE customer = ? AND date = ? AND hour > ?;';
            const params = [iduser,date,iduser,date,hour];
            return db.query(sql, params);
        }

    }

    static updateReservationStatus(idreservation, status) {
            const sql = 'UPDATE reservation SET status = ? WHERE idreservation = ?;';
            const params = [status, idreservation];
            return db.query(sql, params);
    }
}

module.exports = Reservation;