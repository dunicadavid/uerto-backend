const { db } = require('../config/db');
const geo = require('geo-hash');

class Place {
    constructor(name, category, location, latitude, longitude, hourOfOpp) {
        this.name = name;
        this.category = category;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.geohash = geo.encode(latitude, longitude);
        this.hourOfOpp = hourOfOpp;
    }

    async save() {
        let sql = `
        INSERT INTO place(
            name,
            category,
            location,
            latitude,
            longitude,
            geohash,
            hoursOfOpp)
        VALUES(
            '${this.name}',
            '${this.category}',
            '${this.location}',
            '${this.latitude}',
            '${this.longitude}',
            '${this.geohash}',
            '${this.hourOfOpp}'
        );`;

        const [newPlace, _] = await db.execute(sql);

        return newPlace;
    }

    static findAll(filter, proximityGeohashes,sortedBy) {            //ADAUGA FILTRU DUPA RATING SAU PRICE-RANGE
        let sql;
        let whereClauseActive = 0;
        sql = `SELECT idplace,name,category,location FROM place`;

        if (filter != '0') {
            sql = sql + ` join place_filter_restaurant ON filterRestaurant = idfilterRestaurant WHERE ${filter}=1`;
            whereClauseActive = 1;
        }

        if (proximityGeohashes.length > 0) {
            if (!whereClauseActive) { sql = sql + ' WHERE' } else {sql = sql + ' AND'}
            sql = sql + ` SUBSTRING(geohash,1,6) IN (${proximityGeohashes})`; 
            whereClauseActive = 1;
        }

        if(sortedBy != '0') {
            switch(sortedBy) {
                case 'rating-asc':
                    sql = sql + ' ORDER BY rating ASC';
                break;
                case 'rating-desc':
                    sql = sql + ' ORDER BY rating DESC';
                break;
                case 'price-asc':
                    sql = sql + ' ORDER BY price ASC';
                break;
                case 'price-desc':
                    sql = sql + ' ORDER BY price DESC';
                break;
            }
        }

        //console.log(sql);

        return db.execute(sql);

    }

    static findById(id) {
        let sql = `SELECT * FROM place where idplace = ${id};`;

        return db.execute(sql);
    }

    static findByName(name) {
        let sql = `select * from uerto.place where UPPER(name) LIKE '%${name}%';`;

        return db.execute(sql);
    }

    static activities(id) {
        let sql = `SELECT * FROM activity where place = ${id};`;

        return db.execute(sql);
    }

    static availability(date, id, party_size) {
        let sql = `select hour, idactivity_seating from activity_seating s join activity_arrangement a 
        on a.activity_seating = s.idactivity_seating 
        join reservation r on a.reservation=r.idreservation where r.date = '${date}' AND s.activity = ${id} AND s.capacity >= ${party_size};`;

        return db.execute(sql);
    }

    static seating(id, party_size) {
        let sql = `select * from activity_seating where activity = ${id} AND capacity >= ${party_size} ORDER BY capacity ASC;`;

        return db.execute(sql);
    }

    static activityInfo(id) {
        let sql = `select hoursOfOpp, reservationTime from activity where idactivity = ${id};`;

        return db.execute(sql);
    }

    async block(placeId, userId) {
        let sql = `
        INSERT INTO place_blocked_users(
            place,
            user)
        VALUES(
            ${placeId},
            ${userId}
        );`;

        const [newBlock, _] = await db.execute(sql);

        return newBlock;
    }

    async unblock(placeId, userId) {
        let sql = `
        DELETE FROM place_blocked_users WHERE place = ${placeId} AND user = ${userId};`;

        const [newUnblock, _] = await db.execute(sql);

        return newUnblock;
    }

}

module.exports = Place;