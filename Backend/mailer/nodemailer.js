const nodemailer = require("nodemailer");

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false,
  auth: {
      user: 'elhilali.abdelouahab@gmail.com',
      pass: 'ctpswpvausvsbjsa'
  }
}); 

module.exports = transporter