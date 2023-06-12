const multer = require('multer');
const path = require('path');

const storageUser = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/users/')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const storagePlace = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/places/')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const uploadUser = multer({storage: storageUser});
const uploadPlace = multer({storage: storagePlace});

module.exports = { storageUser, uploadUser , storagePlace, uploadPlace };