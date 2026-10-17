const axios = require('axios')

const weatherDescriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
}

const forecast = async (latitude, longitude, callback) => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        callback('A valid latitude and longitude are required.', undefined, 400)
        return
    }

    let response
    try {
        response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude,
                longitude,
                current: 'temperature_2m',
                daily: 'weather_code,precipitation_probability_max',
                temperature_unit: 'fahrenheit',
                timezone: 'auto'
            },
            timeout: 10000
        })
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            callback('Weather service timed out. Please try again.', undefined, 504)
        } else if (error.response) {
            callback('Weather service returned an error. Please try again.', undefined, 502)
        } else {
            callback('Unable to connect to weather service!', undefined, 503)
        }
        return
    }

    const current = response.data && response.data.current
    const daily = response.data && response.data.daily
    const weatherCode = daily && Array.isArray(daily.weather_code) && daily.weather_code[0]
    const precipitationProbability = daily &&
        Array.isArray(daily.precipitation_probability_max) &&
        daily.precipitation_probability_max[0]

    if (
        !current ||
        !Number.isFinite(current.temperature_2m) ||
        !Number.isFinite(weatherCode) ||
        !Number.isFinite(precipitationProbability)
    ) {
        callback('Weather service returned an invalid forecast.', undefined, 502)
        return
    }

    const summary = weatherDescriptions[weatherCode] || 'Weather conditions unavailable'
    callback(
        undefined,
        `${summary}. It is currently ${current.temperature_2m} degrees out. There is a ${precipitationProbability}% chance of rain.`
    )
}

module.exports = forecast
