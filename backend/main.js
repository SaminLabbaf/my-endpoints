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

app.get("/v1/recipes/:id", (request, response) => {
    const id = request.params.id;
    const query = `SELECT 
    Recipes.recipe_id,
    Recipes.title, 
    Recipes.description, 
    Recipes.cooking_time, 
    Recipes.instructions,
    CONCAT(Users.fname, ' ', Users.lname) AS user,
    Recipes.created_at,
    COALESCE(
        JSON_ARRAYAGG(
            CASE 
                WHEN Ingredients.ingredient_id IS NOT NULL THEN
                    JSON_OBJECT(
                        'ingredient_id', Ingredients.ingredient_id,
                        'name', Ingredients.name,
                        'unit', Recipe_Ingredient.unit,
                        'amount', Recipe_Ingredient.quantity
                    )
                ELSE NULL
            END
        ),
        JSON_ARRAY()
    ) AS ingredients
FROM Recipes
JOIN Users ON Recipes.user = Users.user_id
LEFT JOIN Recipe_Ingredient ON Recipe_Ingredient.recipe = Recipes.recipe_id
LEFT JOIN Ingredients ON Ingredients.ingredient_id = Recipe_Ingredient.ingredient
WHERE Recipes.recipe_id = ?
GROUP BY Recipes.recipe_id;`
    pool.query(query, [id], (error, result) => {
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

// FAVORITES ENDPOINTS
app.get("/v1/favorites", (request, response) => {
    const { user_id } = request.query;
    pool.query(`SELECT Recipes.title, Recipes.description FROM Favorites
JOIN Recipes ON Recipes.recipe_id = Favorites.recipe 
WHERE Favorites.user = ? ORDER BY Favorites.favorite_id`, [user_id], (error, result) => {
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

app.post("/v1/favorites", (request, response) => {
    const { user_id, recipe_id } = request.body;
    pool.query(`INSERT INTO Favorites (user, recipe)
        VALUES (?, ?)`, [user_id, recipe_id], (error, result) => {
        if (error) {
            response.status(500).json({ error: error.message });
        }
        else {
            response.json(
                {
                    status: "success",
                    message: "New favorite added successfully"
                }
            )
        }
    });
});

