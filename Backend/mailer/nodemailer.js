const nodemailer = require("nodemailer");

/**
 * Configuration du transporteur SMTP
 */
const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 465,
  secure: true,
  auth: {
      user: 'elhilali.abdelouahab@gmail.com',
      pass: 'fikhmgcheswzhbft'
  }
}); 

module.exports = transporter