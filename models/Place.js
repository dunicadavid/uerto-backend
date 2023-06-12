const { db } = require('../config/db');
const mysql = require('mysql2/promise');
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
        const sql = 'INSERT INTO place( name, category, location, latitude, longitude, geohash, hoursOfOpp) VALUES(?,?,?,?,?,?,?);';
        const params = [this.name,this.category,this.location,this.latitude,this.longitude,this.geohash,this.hourOfOpp];

        const [newPlace, _] = await db.query(sql,params);

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

    static async updateImages(idplace, path) {
        const queries = [
            {
                query: 'SELECT imageFirst, imageSecond, imageThird FROM place WHERE idplace = ?;',
                parameters: [parseInt(idplace)]
            },
            {
                query: 'UPDATE place SET imageFirst = ?, imageSecond = ?, imageThird = ? WHERE idplace = ?;',
                parameters: [...path, parseInt(idplace)]
            },
        ];

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
        });

        try{
            await connection.beginTransaction();
            const oldPath = await connection.query(queries[0].query, queries[0].parameters);
            await connection.query(queries[1].query, queries[1].parameters);
            await connection.commit();
            connection.destroy();
            return oldPath;
        } catch(err) {
            connection.rollback();
            connection.destroy();
            return err.message;
        }
    }

    //vezi sql injection
    async updateFilterRestaurant(idplace,queryString) {
        const sql = `UPDATE uerto.place_filter_restaurant SET ${queryString} WHERE idfilterRestaurant = (SELECT filterRestaurant FROM uerto.place WHERE idplace = ? LIMIT 1);`;
        const params = [idplace];

        const [updateFilterPlace, _] = await db.query(sql,params);

        return updateFilterPlace;
    }
    //vezi sql injection
    async updateFilterLeasure(idplace,queryString) {
        const sql = `UPDATE uerto.place_filter_leasure SET ${queryString} WHERE idfilterLeasure = (SELECT filterLeasure FROM uerto.place WHERE idplace = ? LIMIT 1);`;
        const params = [idplace];

        const [updateFilterPlace, _] = await db.query(sql,params);

        return updateFilterPlace;
    }
    //vezi sql injection
    static findAll(filter, proximityGeohashes, type, sortedBy) {            
        let sql;
        let whereClauseActive = false;
        sql = `SELECT idplace,imageFirst,name,category,location,geohash,rating,price FROM place`;

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

    static findGroupById(idplaceList) {
        const sql = 'SELECT * FROM place WHERE idplace IN (?,?,?);';
        const param = [...idplaceList];

        return db.query(sql,param);
    }

    static getPlacesFilters() {
        const sql = `SELECT p.idplace , p.rating, p.price, p.geohash, p.hoursOfOpp, CONCAT(asian,
            arabic, greek, italian, latin, streetfood, cocktail, vegan, fish, meat, desert, breakfest, 
            fancy, reservation, night, skybar, view, nature, tv, live, quite, work, games, smoke) 
            AS filters FROM place p INNER JOIN place_filter_restaurant f ON f.idfilterRestaurant = p.idplace;`;

        return db.query(sql);
    }

    static findById(idplace) {
        const sql = 'SELECT * FROM place WHERE idplace = ?;';
        const param = [idplace];

        return db.query(sql,param);
    }

    static findByName(name) {
        const sql = "SELECT * FROM uerto.place WHERE UPPER(name) LIKE ?;";
        const param = ['%'+name+'%'];

        return db.query(sql,param);
    }

    static favouriteCheck(iduser,idplace) {
        const sql = 'SELECT COUNT(user) AS favourite FROM uerto.user_favourite_place WHERE user = ? AND place = ?;';
        const param = [parseInt(iduser),parseInt(idplace)];

        return db.query(sql,param);
    }

    static findByFavourite(iduser) {
        const sql = `SELECT idplace,name,category,location FROM uerto.place p JOIN uerto.user_favourite_place f ON p.idplace = f.place WHERE user = ?;`;
        const param = [iduser];

        return db.query(sql,param);
    }

    static findLastMaxRatedPlaceOfUser(iduser) {
        const sql = `SELECT user_rating.place FROM user_rating JOIN reservation ON reservation = idreservation WHERE user = ? ORDER BY rating DESC ,date DESC LIMIT 1;`;
        const param = [iduser];

        return db.query(sql,param);
    }

    static activities(idplace) {
        const sql = 'SELECT * FROM activity where place = ?;';
        const param = [idplace];

        return db.query(sql,param);
    }

    static availability(date, idactivity, partySize) {
        const sql = 'SELECT hour, idactivitySeating FROM activity_seating s JOIN activity_arrangement a ON a.activitySeating = s.idactivitySeating JOIN reservation r ON a.reservation=r.idreservation WHERE r.date = ? AND s.activity = ? AND s.capacity >= ?;';
        const param = [date,idactivity, partySize];

        return db.query(sql,param);
    }

    static seating(idactivity, partySize) {
        const sql = 'SELECT * FROM activity_seating WHERE activity = ? AND capacity >= ? ORDER BY capacity ASC;';
        const param = [idactivity, partySize];

        return db.query(sql,param);
    }

    static activityInfo(idactivity) {
        const sql = 'SELECT hoursOfOpp, reservationTime FROM activity WHERE idactivity = ?;';
        const param = [idactivity];

        return db.query(sql,param);
    }

    async block(idplace, iduser) {
        const sql = `INSERT INTO place_blocked_users(place, user) VALUES(?,?);`;
        const params = [idplace,iduser];

        const [newBlock, _] = await db.query(sql,params);

        return newBlock;
    }

    async unblock(idplace, iduser) {
        const sql = `DELETE FROM place_blocked_users WHERE place = ? AND user = ?;`;
        const params = [idplace,iduser];

        const [newUnblock, _] = await db.query(sql,params);

        return newUnblock;
    }

}

module.exports = Place;