/**
 * Module dependencies.
 */
const express= require("express")
const db = require("./db/db")
const app = express()


app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/**
 * Test route
 */
app.get('/',(req,res)=>{
    res.send("test")
})

// connexion à la base de données 

db.sync()
    .then((console.log("Connexion à la base de données")))
    .catch(err => console.log("Connexion à la base de données échoué" + err))




// ----------------------- Routes ----------------------- // 

const routeUser = require('./routes/User')

app.use('/api/users/', routeUser);

module.exports = app