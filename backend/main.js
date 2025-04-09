// connect to sql database
const mysql = require('mysql2');
require('dotenv').config()

// create connection to database
const pool = mysql.createPool({
    host: process.env.SQL_HOSTNAME,
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DBNAME,
});

// Set up the API
const express = require('express')
var cors = require('cors');
const bodyParser = require('body-parser')
const app = express()
const port = 3007

// Make it available for public access

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    next();
});

app.use(cors());
app.options("*", cors());

app.set('json spaces', 2)
app.use(bodyParser.json({
    limit: "50mb"
}))
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)

// Listen to outside connection

app.listen(port, () => {
    console.log(`App running on port ${port}. Control+C to exit.`)
})

// Spit out data

app.get('/', (request, response) => {
    response.json(
        {
            info: 'Backend for my first endpoint using my database by Samin L'
        }
    )
})

app.get("/v1/users", (request, response) => {
    pool.query("select fname, lname, email from Users ORDER BY user_id", [], (error, result) => {
        response.json(
            {
                status: "success",
                data: result
            }
        )
    });
})

app.post("/v1/users", (request, response) => {
    const { fname, lname, email, password_hash } = request.body;
    pool.query("INSERT INTO Users (fname, lname, email, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())", [fname, lname, email, password_hash], (error, result) => {
        if (error) {
            response.status(500).json({ error: "Error inserting data" });
        } else {
            response.json(
                {
                    status: "success",
                    message: "New user added successfully"
                }
            )
        }
    });
})