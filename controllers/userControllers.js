const User = require('../models/User');

exports.createUser = async (req, res, next) => {
    try {

        let { name, email, phone, authId } = req.body;
        let user = new User(name, email, phone, authId);

        user = await user.save();

        let [resUser, _] = await User.findByAuthId(authId);

        res.status(201).json({ message: "User created", user: { userId: resUser[0].iduser, fullname: resUser[0].name, phoneNumber: resUser[0].phone, email: resUser[0].email, uid: resUser[0].idauth } });

    } catch (error) {
        console.log(error);
        if (error.code === 'ER_DUP_ENTRY')
            res.status(405).json({ message: "Mobile number already taken." });
        else
            next(error);
    }
}

exports.updateUser = async (req, res, next) => {
    try {

        let { id, name, email, phone } = req.body;
        let user = new User(name, email, phone);

        user = await user.update(id);

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

exports.getUserById = async (req, res, next) => {
    console.log('aici');
    try {
        let userId = req.params.id;
        console.log(userId)
        let [user, _] = await User.findById(userId);

        res.status(200).json({ userId: user[0].iduser, fullname: user[0].name, phoneNumber: user[0].phone, email: user[0].email, uid: user[0].idauth });

    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getUserByAuthId = async (req, res, next) => {
    try {

        let userAuthId = req.params.id;
        let [user, _] = await User.findByAuthId(userAuthId);

        if (user.length === 0) {
            res.status(204).json({ message: "No user information" });
        } else {
            console.log({ userId: user[0].iduser, fullname: user[0].name, phoneNumber: user[0].phone, email: user[0].email, uid: user[0].idauth });
            res.status(200).json({ userId: user[0].iduser, fullname: user[0].name, phoneNumber: user[0].phone, email: user[0].email, uid: user[0].idauth });
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

        const err = await user.rate(iduser, idplace, idreservation, rating);
        
        if (!err) {
            res.status(201).json({ message: `Place rated successfully with ${rating} stars.` });
        } else {
            if (err.substring(0, 15) === 'Duplicate entry')
                res.status(500).json({ message: "Already rated your experience there." });
            else
                res.status(500).json({ message: err });
        }

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