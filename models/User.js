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
        let sql = `
        INSERT INTO user(
            name,
            phone,
            email,
            idauth
        )
        VALUES(
            '${this.name}',
            '${this.phone}',
            '${this.email}',
            '${this.authId}'
        );`;

        const [newUser, _] = await db.execute(sql);

        return newUser;
    }

    async update(id) {
        let sql = `
        UPDATE user
        SET name = '${this.name}', phone = '${this.phone}', email ='${this.email}'
        WHERE iduser = ${id};`;

        const [updatedUser, _] = await db.execute(sql);

        return updatedUser;
    }

    static findById(id) {
        let sql = `SELECT * FROM user where iduser = ${id};`;

        return db.execute(sql);
    }

    static findByAuthId(id) {
        let sql = `SELECT * FROM user where idauth = '${id}';`;

        return db.execute(sql);
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
            return;
        } catch(err) {
            connection.rollback();
            return err.message;
        }
        
    }
}

module.exports = User;