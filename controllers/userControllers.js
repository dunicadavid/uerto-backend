const User = require('../models/User');
const path = require('path');
const fs = require('fs');

exports.createUser = async (req, res, next) => {
    try {
        console.log("intra");
        // const userData = JSON.parse(req.body.data);
        // const imageFile = req.file;
        const userData = req.body;

        let user = new User(userData.name, userData.email, userData.phone, userData.idauth);
        console.log(user);
        user = await user.save();

        let [resUser, _] = await User.getUserByIdauth(userData.idauth);

        res.status(201).json({ message: "User created", user: { userId: resUser[0].iduser, fullname: resUser[0].name, phoneNumber: resUser[0].phone, email: resUser[0].email, uid: resUser[0].idauth, photoUrl: resUser[0].profileImagePath, nextStrategy: resUser[0].nextStrategy } });

    } catch (error) {
        console.log(error);
        if (error.code === 'ER_DUP_ENTRY') {
            const filePath = path.join(__dirname, '../images/users', req.file.filename);
            fs.unlink(filePath, (error) => {});
            res.status(405).json({ message: "Mobile number already taken." }); //more cases [email and idauth]
        }
        else
            next(error);
    }
}

exports.updateUser = async (req, res, next) => {
    try {

        const { iduser, name, phone } = req.body;

        const user = new User();
        await user.update(iduser, name, phone);

        res.status(201).json({ message: "User updated" });

    } catch (error) {
        console.log(error);
        if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.slice(-13) === "phone_UNIQUE'") {
            res.status(405).json({ message: "Mobile number already taken." });
        } else if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.slice(-13) === "email_UNIQUE'") {
            res.status(405).json({ message: "Email already taken." });
        } else
            next(error);
    }
}

exports.updateUserProfileImage = async (req, res, next) => {
    try {
        const iduser = parseInt(req.query.iduser);
        const imageFile = req.file;

        const [result,_] = await User.updateImage(iduser, imageFile.filename);

        if(result[0].profileImagePath !== null && result[0].profileImagePath !== undefined) {
            const filePath = path.join(__dirname, '../images/users', result[0].profileImagePath);
            fs.unlink(filePath, (error) => {});
        }

        res.status(201).json({ message: "User profile image updated",  photoUrl: imageFile.filename});

    } catch (error) {
        const filePath = path.join(__dirname, '../images/users', req.file.filename);
        fs.unlink(filePath, (error) => {});
        console.log(error);
        next(error);
    }
}

exports.updateUserStrategy = async (req, res, next) => {
    try {

        const { iduser, strategy } = req.body;

        await User.updateStrategy(iduser, strategy);

        res.status(201).json({ message: "User strategy updated" });

    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getUserProfileImage = async (req, res, next) => {

    try {

        const { filename } = req.params;

        const imagePath = `images/users/${filename}`;

        console.log(imagePath);

        res.status(200).sendFile(path.resolve(imagePath));

    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getUserById = async (req, res, next) => {
    try {
        let userId = req.params.id;
        console.log(userId);
        let [user, _] = await User.findById(userId);

        res.status(200).json({ userId: user[0].iduser, fullname: user[0].name, phoneNumber: user[0].phone, email: user[0].email, uid: user[0].idauth, photoUrl: user[0].profileImagePath, nextStrategy: user[0].nextStrategy });

    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getUserByAuthId = async (req, res, next) => {
    try {

        const idauth = req.user.uid;
        const [user, _] = await User.getUserByIdauth(idauth);

        const results = {};

        if (user.length === 0) {
            res.status(204).json({ message: "No user information" });
        } else {
            const [rateRequests, _] = await User.getAllRateRequests(user[0].iduser);
            results.user = { userId: user[0].iduser, fullname: user[0].name, phoneNumber: user[0].phone, email: user[0].email, uid: user[0].idauth, photoUrl: user[0].profileImagePath, nextStrategy: user[0].nextStrategy };
            results.rateRequests = rateRequests;
            console.log(results);
            res.status(200).json(results);
        }

    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.ratePlace = async (req, res, next) => {
    try {
        const { iduser, idplace, idreservation, rating } = req.body;

        const user = new User();

        const err = await user.rate(iduser, idplace, idreservation, rating);///adauga rutins!!!

        if (!err) {
            res.status(201).json({ message: `Place rated successfully with ${rating} stars.` });
        } else {
            if (err.substring(0, 15) === 'Duplicate entry')
                res.status(500).json({ message: "Already rated your experience there." });
            else {
                console.log(err);
                res.status(500).json({ message: err });
            }

        }

    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getRateRequests = async (req, res, next) => {
    try {
        const iduser = req.query.iduser;

        const [ratingRequests, _] = await User.getAllRateRequests(iduser);

        res.status(200).json({ ratingRequests });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.deleteRateRequest = async (req, res, next) => {
    try {
        const { idreservation } = req.body;

        await User.deleteRateRequest(idreservation);

        res.status(201).json({ message: "Deleted reservation request" });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.makePlaceFavourite = async (req, res, next) => {
    try {
        const { iduser, idplace } = req.body;
        const user = new User();
        await user.makeFavourite(iduser, idplace);

        res.status(201).json({ message: "Place inserted in favourites list" });

    } catch (error) {
        console.log(error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(405).json({ message: "Already in the favourites list" });
        } else {
            next(error);
        }
    }
}

exports.makePlaceUnfavourite = async (req, res, next) => {
    try {
        const { iduser, idplace } = req.body;
        const user = new User();
        await user.makeUnfavourite(iduser, idplace);

        res.status(200).json({ message: "Place deleted from favourites list" });

    } catch (error) {
        console.log(error);
        next(error);
    }
}