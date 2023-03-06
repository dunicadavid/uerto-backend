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

    async updateInfo(idplace, name, hoursOfOpp, category, price) {
        const sql = 'UPDATE place SET name = ?, hoursOfOpp = ?, category = ?, price= ? WHERE idplace = ?;';
        const params = [name,hoursOfOpp,category,parseFloat(price),parseInt(idplace)];
        
        const [updateInfoPlace, _] = await db.query(sql,params);

        return updateInfoPlace;
    }

    async updateLocation(idplace, location, latitude, longitude, geohash) {
        const sql = 'UPDATE place SET location = ?, latitude = ?, longitude = ?, geohash = ? WHERE idplace = ?;';
        const params = [location, parseFloat(latitude), parseFloat(longitude), geohash ,parseInt(idplace)];
        
        const [updateLocationPlace, _] = await db.query(sql,params);

        return updateLocationPlace;
    }

    async updateFilterRestaurant(idplace,queryString) {
        const sql = `UPDATE uerto.place_filter_restaurant SET ${queryString} WHERE idfilterRestaurant = (SELECT filterRestaurant FROM uerto.place WHERE idplace = ? LIMIT 1);`;
        const params = [idplace];

        const [updateFilterPlace, _] = await db.query(sql,params);

        return updateFilterPlace;
    }

    async updateFilterLeasure(idplace,queryString) {
        const sql = `UPDATE uerto.place_filter_leasure SET ${queryString} WHERE idfilterLeasure = (SELECT filterLeasure FROM uerto.place WHERE idplace = ? LIMIT 1);`;
        const params = [idplace];

        const [updateFilterPlace, _] = await db.query(sql,params);

        return updateFilterPlace;
    }

    static findAll(filter, proximityGeohashes, type, sortedBy) {            
        let sql;
        let whereClauseActive = false;
        sql = `SELECT idplace,name,category,location FROM place`;

        if (filter != '0') {
            sql = sql + ` join place_filter_restaurant ON filterRestaurant = idfilterRestaurant WHERE category='${type}' AND ${filter}=1`;
            whereClauseActive = true;
        }

        if (proximityGeohashes.length > 0) {
            if (!whereClauseActive) { sql = sql + ` WHERE category='${type}' AND` } else {sql = sql + ' AND'}
            sql = sql + ` SUBSTRING(geohash,1,6) IN (${proximityGeohashes})`; 
            whereClauseActive = true;
        }

        if(whereClauseActive === false) {
            sql +=  ` WHERE category='${type}'`;
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

    static favouriteCheck(iduser,idplace) {
        const sql = 'SELECT COUNT(user) AS favourite FROM uerto.user_favourite_place WHERE user = ? AND place = ?;';
        const param = [parseInt(iduser),parseInt(idplace)];

        return db.query(sql,param);
    }

    static findByFavourite(iduser) {
        const sql = `select idplace,name,category,location from uerto.place p JOIN uerto.user_favourite_place f ON p.idplace = f.place WHERE user = ?;`;
        const param = [iduser];

        return db.query(sql,param);
    }

    static activities(id) {
        let sql = `SELECT * FROM activity where place = ${id};`;

        return db.execute(sql);
    }

    static availability(date, id, partySize) {
        let sql = `select hour, idactivitySeating from activity_seating s join activity_arrangement a 
        on a.activitySeating = s.idactivitySeating 
        join reservation r on a.reservation=r.idreservation where r.date = '${date}' AND s.activity = ${id} AND s.capacity >= ${partySize};`;

        return db.execute(sql);
    }

    static seating(id, partySize) {
        let sql = `select * from activity_seating where activity = ${id} AND capacity >= ${partySize} ORDER BY capacity ASC;`;

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