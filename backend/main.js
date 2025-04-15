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

// RECIPES ENDPOINTS
app.get("/v1/recipes", (request, response) => {
    pool.query(`SELECT title, description, cooking_time, instructions, CONCAT(Users.fname, ' ', Users.lname) AS user from Recipes 
JOIN Users on Users.user_id = Recipes.user ORDER BY recipe_id`, [], (error, result) => {
        if (error) {
            response.status(500).json({ error: "Error fetching data" });
        }
        else {
            response.json(
                {
                    status: "success",
                    data: result
                }
            )
        }
    });
});

app.post("/v1/recipes", (request, response) => {
    const { title, description, cooking_time, instructions, user_id } = request.body;
    pool.query("INSERT INTO Recipes (title, description, cooking_time, instructions, user, created_at) VALUES (?, ?, ?, ?, ?, NOW())", [title, description, cooking_time, instructions, user_id], (error, result) => {
        if (error) {
            response.status(500).json({ error: error.message });
        } else {
            response.json(
                {
                    status: "success",
                    message: "New recipe added successfully"
                }
            )
        }
    });
});

// RATINGS ENDPOINTS
app.get("/v1/ratings", (request, response) => {
    pool.query(`SELECT CONCAT(Users.fname, ' ', Users.lname) AS user, Recipes.title AS recipe , rating, comment from Ratings 
JOIN Users on Users.user_id = Ratings.user
JOIN Recipes on Recipes.recipe_id = Ratings.recipe ORDER BY rating_id`, [], (error, result) => {
        if (error) {
            response.status(500).json({ error: "Error fetching data" });
        }
        else {
            response.json(
                {
                    status: "success",
                    data: result
                }
            )
        }
    });
}
);

app.post("/v1/ratings", (request, response) => {
    const { user_id, recipe_id, rating, comment } = request.body;
    pool.query(`INSERT INTO Ratings (user, recipe, rating, comment, created_at) VALUES
        (?, ?, ?, ?, NOW())`, [user_id, recipe_id, rating, comment], (error, result) => {
        if (error) {
            response.status(500).json({ error: error.message });
        }
        else {
            response.json(
                {
                    status: "success",
                    message: "New rating added successfully"
                }
            )
        }
    }
    );
});

