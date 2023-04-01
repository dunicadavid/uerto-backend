const { auth } = require('firebase-admin');
const { db } = require('../config/db');
const mysql = require('mysql2/promise');

class User {
    constructor(name, email, phone, authId) {
        
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.authId = authId;
    }

    async save() {
        const sql = 'INSERT INTO user(name,phone,email,idauth) VALUES(?,?,?,?);';
        const params = [this.name,this.phone,this.email,this.authId];

        const [newUser, _] = await db.query(sql,params);

        return newUser;
    }

    async update(iduser, name, phone) {
        const sql = 'UPDATE user SET name = ? , phone = ? WHERE iduser = ?';
        const params = [name, phone, parseInt(iduser)];
        
        const [updatedUser, _] = await db.query(sql,params);

        return updatedUser;
    }

    static findById(id) {
        const sql = `SELECT * FROM user where iduser = ?;`;
        const params = [id];

        return db.query(sql,params);
    }

    static getUserByIdauth(id) {
        const sql = 'SELECT * FROM user where idauth = ?;';
        const params = [id];
        
        return db.query(sql,params);
    }

    static getIduserByIdauth(id) {
        const sql = 'SELECT iduser FROM user WHERE idauth = ?;';
        const params = [id];
        
        return db.query(sql,params);
    }

    async makeFavourite(iduser,idplace) {
        const sql = 'INSERT INTO user_favourite_place VALUES (?,?);';
        const params = [parseInt(idplace),parseInt(iduser)];
        
        const [insertFavouritePlace, _] = await db.query(sql,params);

        return insertFavouritePlace;
    }

    async makeUnfavourite(iduser,idplace) {
        const sql = 'DELETE FROM user_favourite_place WHERE place = ? AND user = ?;';
        const params = [parseInt(idplace),parseInt(iduser)];
        
        const [insertFavouritePlace, _] = await db.query(sql,params);

        return insertFavouritePlace;
    }

    async rate(iduser, idplace, idreservation, rating) {

        const queries = [
            {
                query: 'INSERT INTO uerto.user_rating(place,user,reservation,rating)VALUES(?,?,?,?);',
                parameters: [parseInt(iduser), parseInt(idplace), parseInt(idreservation), parseInt(rating)]
            },
            {
                query: 'UPDATE uerto.place SET rating = (rating * ratingCounter + ?)/(ratingCounter+1), ratingCounter = ratingCounter + 1 WHERE idplace = ?;',
                parameters: [parseInt(rating), parseInt(idplace)]
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
            return;
        } catch(err) {
            connection.rollback();
            connection.destroy();
            return err.message;
        }
        
    }

    static getRatingsOfUser(iduser) {
        const sql = 'SELECT place, rating FROM user_rating WHERE user = ? ORDER BY place;';
        const params = [iduser];
        
        return db.query(sql,params);
    }

    static getAllRatings() {
        const sql = 'SELECT user, place, rating FROM user_rating ORDER BY user;';
        
        return db.query(sql);
    }
}

module.exports = User;