const express = require('express')
const bodyParser = require('body-parser')

const app = express()


app.use((req, res, next) => {
    console.log("first middleware logged")
    next()
})

app.use((req, res, next) => {
    console.log("second middleware logged")
    next()
})

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
    console.log("1. Request received");

    debugger;

    console.log("2. Debugger resumed");

    res.send("<h1>NEW RESPONSE AFTER DEBUGGER-13</h1>");

    console.log("3. Response sent");
});

app.use('/test', require('./Router'))

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})