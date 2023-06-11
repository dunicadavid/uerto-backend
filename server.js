require("dotenv").config();

const cluster = require('cluster');
const express = require('express');
const fs = require('fs');
const helmet = require('helmet');
const https = require('https');
const middleware = require('./models/Middleware');
const os = require('os');

const app = express();

//middleware
app.use(helmet());
app.use(express.json());

app.use("/images", require("./routes/imagesRoutes"));

app.use(middleware.decodeToken);
app.use("/users", require("./routes/userRoutes"));
app.use("/places", require("./routes/placeRoutes"));
app.use("/reservations", require("./routes/reservationRoutes"));


app.use((err, req, res, next) => {
    console.log(err.stack);
    console.log(err.name);
    console.log(err.code);

    res.status(500).json({
        message: "Something went wrong",
    });
});


//  !!delete cluster when in production
// if (cluster.isMaster) {
//     console.log(`Server running on PORT 3000`);
//     const NUM_WORKERS = os.cpus(). length;
//     for( let i = 0 ; i < NUM_WORKERS; i++) {
//         cluster.fork();
//     }
// } else {
//     const PORT = process.env.PORT || 3000;
//     https.createServer({
//         key: fs.readFileSync('key.pem'),
//         cert: fs.readFileSync('cert.pem'),
//     }, app).listen(PORT, () => {});
// }

const PORT = process.env.PORT || 3000;
https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
}, app).listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
});