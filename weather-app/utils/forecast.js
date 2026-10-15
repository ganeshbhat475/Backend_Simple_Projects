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

const forecast = (latitude, longitude, callback) => {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', latitude)
    url.searchParams.set('longitude', longitude)
    url.searchParams.set('current', 'temperature_2m')
    url.searchParams.set('daily', 'weather_code,precipitation_probability_max')
    url.searchParams.set('temperature_unit', 'fahrenheit')
    url.searchParams.set('timezone', 'auto')

    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Weather service returned HTTP ${response.status}`)
            }
            return response.json()
        })
        .then((body) => {
            const current = body && body.current
            const daily = body && body.daily
            const temperature = current && current.temperature_2m
            const weatherCode = daily && Array.isArray(daily.weather_code) && daily.weather_code[0]
            const precipitationProbability = daily && Array.isArray(daily.precipitation_probability_max) &&
                daily.precipitation_probability_max[0]

            if (
                !Number.isFinite(temperature) ||
                !Number.isFinite(weatherCode) ||
                !Number.isFinite(precipitationProbability)
            ) {
                callback('Unable to retrieve a valid forecast for this location.', undefined)
                return
            }

            const summary = weatherDescriptions[weatherCode] || 'Weather conditions unavailable'
            callback(undefined, `${summary}. It is currently ${temperature} degrees out. There is a ${precipitationProbability}% chance of rain.`)
        }, () => {
            callback('Unable to connect to weather service!', undefined)
        })
}

module.exports = forecast