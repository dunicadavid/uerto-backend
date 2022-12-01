const User = require('../models/User');

exports.createUser = async (req, res, next) => {
    try {

        let {name, email, phone} = req.body;
        let user = new User(name,email,phone);

        user = await user.save();

        res.status(201).json({message : "User created"});

    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.updateUser = async (req, res, next) => {
    try {

        let {id, name, email, phone} = req.body;
        let user = new User(name,email,phone);

        user = await user.update(id);

        res.status(201).json({message : "User updated"});

    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getUserById = async (req, res, next) => {
    try {

        let userId = req.params.id;
        let [user, _ ] = await User.findById(userId);

        res.status(200).json({user : user[0]});

    } catch (error) {
        console.log(error);
        next(error);
    }
}