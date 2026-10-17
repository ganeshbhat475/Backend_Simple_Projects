const axios = require('axios')
const logUpstreamError = require('./log-upstream-error')

const forecast = async (latitude, longitude, callback) => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        callback('A valid latitude and longitude are required.', undefined, 400)
        return
    }

    const apiKey = process.env.OPENWEATHERMAP_API_KEY
    if (!apiKey) {
        callback('Weather service is not configured. Please contact the site administrator.', undefined, 503)
        return
    }

    let response
    try {
        response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
            params: {
                lat: latitude,
                lon: longitude,
                cnt: 1,
                units: 'imperial',
                appid: apiKey
            },
            timeout: 10000
        })
    } catch (error) {
        logUpstreamError('OpenWeatherMap forecast', error)
        if (error.code === 'ECONNABORTED') {
            callback('Weather service timed out. Please try again.', undefined, 504)
        } else if (error.response && error.response.status === 401) {
            callback(
                'OpenWeatherMap rejected the API key. Verify that it is correct and active; newly created keys may take up to 2 hours to activate.',
                undefined,
                503
            )
        } else if (error.response && error.response.status === 403) {
            callback('OpenWeatherMap denied access to the forecast API. Check your account access.', undefined, 503)
        } else if (error.response) {
            const statusCode = error.response.status === 429 || error.response.status >= 500 ? 503 : 502
            callback('Weather service returned an error. Please try again.', undefined, statusCode)
        } else {
            callback('Unable to connect to weather service!', undefined, 503)
        }
        return
    }

    const nextForecast = response.data &&
        Array.isArray(response.data.list) &&
        response.data.list[0]
    const conditions = nextForecast && Array.isArray(nextForecast.weather) && nextForecast.weather[0]
    const temperature = nextForecast && nextForecast.main && nextForecast.main.temp
    const precipitationProbability = nextForecast && nextForecast.pop

    if (
        !conditions ||
        typeof conditions.description !== 'string' ||
        !Number.isFinite(temperature) ||
        !Number.isFinite(precipitationProbability)
    ) {
        callback('Weather service returned an invalid forecast.', undefined, 502)
        return
    }

    callback(
        undefined,
        `The next 3 hours: ${conditions.description}. Forecast temperature is ${temperature}°F, with a ${Math.round(precipitationProbability * 100)}% chance of precipitation.`
    )
}

module.exports = forecast
