const User = require('../models/User');

exports.createUser = async (req, res, next) => {
    try {

        let {name, email, phone, authId} = req.body;
        let user = new User(name,email,phone,authId);
        console.log(req.body);
        user = await user.save();

        res.status(201).json({message : "User created", });

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

        res.status(200).json({userId : user[0].iduser, fullname : user[0].name, phoneNumber : user[0].phone, email : user[0].email, uid : user[0].id_firebase_auth});

    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getUserByAuthId = async (req, res, next) => {
    try {

        let userAuthId = req.params.id;
        let [user, _ ] = await User.findByAuthId(userAuthId);

        
        if(user.length === 0) {
            res.status(204).json({message : "No user information"});
        } else {
            console.log({userId : user[0].iduser, fullname : user[0].name, phoneNumber : user[0].phone, email : user[0].email, uid : user[0].id_firebase_auth});
            res.status(200).json({userId : user[0].iduser, fullname : user[0].name, phoneNumber : user[0].phone, email : user[0].email, uid : user[0].id_firebase_auth});
        }

    } catch (error) {
        console.log(error);
        next(error);
    }
}