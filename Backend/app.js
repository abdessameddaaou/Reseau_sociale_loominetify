/**
 * Module dependencies.
 */
const express= require("express")
const app = express()

/**
 * Test route
 */
app.get('/',(req,res)=>{
    res.send("test")
})


module.exports = app