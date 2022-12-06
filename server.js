require("dotenv").config();

const express = require('express');
const fs = require('fs');
const helmet = require('helmet');
const https = require('https');
const middleware = require('../models/Middleware');

const app = express();

//middleware



app.use(helmet());
app.use(express.json());
app.use(middleware.decodeToken);

app.use("/places",require("./routes/placeRoutes")); 
app.use("/users",require("./routes/userRoutes"));
app.use("/reservations",require("./routes/reservationRoutes"));


app.use((err, req, res, next) => {
    console.log(err.stack);
    console.log(err.name);
    console.log(err.code);

    res.status(500).json({
        message: "Something went wrong",
    });
});


const PORT = process.env.PORT || 3000;
https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
}, app).listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
});