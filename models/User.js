const db = require('../config/db');

class User {
    constructor(name, email, phone) {
        this.name = name;
        this.email = email;
        this.phone = phone;
    }

    async save() {
        let sql = `
        INSERT INTO user(
            name,
            phone,
            email
        )
        VALUES(
            '${this.name}',
            '${this.phone}',
            '${this.email}'
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
}

module.exports = User;