import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 3000;

env.config();

const db = new pg.Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  try{
    db.query("SELECT country_code FROM visited_countries WHERE user_id=$1",[req.body.user], (err, r)=>{
      const countries = r.rows;
      const country_codes = countries.map(country=>country.country_code)
   
      console.log(countries);
    db.query("SELECT * FROM users WHERE id=$1",[req.body.user], (err, result)=>{
      db.query("SELECT * FROM users", (err, re)=>{
        const current_user = re.rows;
        const users = result.rows;
        const existing_user = req.body.user;
        console.log(existing_user)
        users.find(user=>user.id==existing_user)
        res.render("index.ejs",{
          countries: country_codes,
          total: countries.length,
          users: current_user,
          color: 'teal'
          })
      })
    })
  })
  }catch (error) {
    console.error("Error in the main route", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;

    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1,$2)",[countryCode, currentUserId ]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {
  try{
    db.query("SELECT country_code FROM visited_countries WHERE user_id=$1",[req.body.user], (err, r)=>{
      const countries = r.rows;
      const country_codes = countries.map(country=>country.country_code)
      console.log(countries);

    db.query("SELECT * FROM users WHERE id=$1",[req.body.user], (err, result)=>{
      db.query("SELECT * FROM users", (err, re)=>{
        const current_user = re.rows;
        const users = result.rows;
        const existing_user = req.body.user;
        console.log(existing_user)
        currentUserId = existing_user;
        const selected_user = users.find(user=>user.id==existing_user)
        if(selected_user){
          res.render("index.ejs",{
            countries: country_codes,
            total: countries.length,
            users: current_user,
            color: selected_user.color
          })
        }else{
          res.render("new.ejs");
        }
      })
    })
      })
  }catch (error) {
    console.error("Error in the main route", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const name = req.body.name;
  const color = req.body.color
  console.log(name);
  console.log(color);
  db.query("INSERT INTO users(name, color) VALUES($1, $2)",[name, color]);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});