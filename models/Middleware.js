const admin = require('../config/firebase-config');
const User = require('./User');

class Middleware {
    async decodeToken(req,res,next) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decodeValue = await admin.auth().verifyIdToken(token);
            console.log(token);
            if(decodeValue) {
                req.user = decodeValue;
                return next();
            }
            return res.json({message : 'Unauthorize.'});
        } catch (e) {
            if(typeof req.headers.authorization === 'undefined') {
                return res.json({message : 'No token provided.'});
            }
            return res.json({message : 'Invalid token.'});
        }
    }

    async ownUserAuthorization(req,res,next) {
        const start = Date.now();
        try {
            const [result, _] = await User.getIduserByIdauth(req.user.uid);
            if(result[0].iduser === req.body.iduser) {
                return next();
            }
            return res.json({message : 'Unauthorize. Permision denied'});
        } catch (e) {
            return res.json({message : 'Invalid token.'});
        }
    }
    
    //continue authorization

}

module.exports = new Middleware();