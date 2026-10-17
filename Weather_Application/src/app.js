const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const express = require('express')
const hbs = require('hbs')
const geocode = require('./utils/geocode')
const forecast = require('./utils/forecast')

const app = express()

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

// Setup handlebars engine and views location
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

// Setup static directory to serve
app.use(express.static(publicDirectoryPath))

app.get('', (req, res) => {
    res.render('index', {
        title: 'Weather',
        name: 'Ganesh Bhat'
    })
})

app.get('/about', (req, res) => {
    res.render('about', {
        title: 'About Me',
        name: 'Ganesh Bhat'
    })
})

app.get('/help', (req, res) => {
    res.render('help', {
        helpText: 'This is some helpful text.',
        title: 'Help',
        name: 'Ganesh Bhat'
    })
})

app.get('/weather', (req, res) => {
    const address = req.query.address
    if (typeof address !== 'string' || !address.trim()) {
        return res.status(400).send({
            error: 'You must provide an address!'
        })
    }

    geocode(address, (error, result, statusCode) => {
        if (error) {
            return res.status(statusCode || 502).send({ error })
        }

        const { latitude, longitude, location } = result
        forecast(latitude, longitude, (error, forecastData, statusCode) => {
            if (error) {
                return res.status(statusCode || 502).send({ error })
            }

            res.send({
                forecast: forecastData,
                location,
                address
            })
        })
    })
})

app.get('/products', (req, res) => {
    if (!req.query.search) {
        return res.send({
            error: 'You must provide a search term'
        })
    }

    console.log(req.query.search)
    res.send({
        products: []
    })
})

app.get('/help/*', (req, res) => {
    res.render('404', {
        title: '404',
        name: 'Ganesh Bhat',
        errorMessage: 'Help article not found.'
    })
})

app.get('*', (req, res) => {
    res.render('404', {
        title: '404',
        name: 'Ganesh Bhat',
        errorMessage: 'Page not found.'
    })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server is up on port ${port}.`)
})