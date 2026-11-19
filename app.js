const form = document.getElementById('search-form');
const input = document.getElementById('country-input');
const statusMessage = document.getElementById('status-message');
const resultsContainer = document.getElementById('results-container');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  statusMessage.textContent = 'Searching for "' + query + '"...';
  resultsContainer.classList.add('hidden');

  try {
    const geoHost = 'https://' + 'geocoding-api.' + 'open-meteo.com';
    const geoUrl = new URL(geoHost);
    geoUrl.pathname = '/v1/search';
    geoUrl.searchParams.set('name', query);
    geoUrl.searchParams.set('count', '1');
    geoUrl.searchParams.set('language', 'en');

    const geoRes = await fetch(geoUrl.toString());
    if (!geoRes.ok) {
      throw new Error('Location error.');
    }
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('Location not found.');
    }

    const place = geoData.results.at(0);
    const lat = place.latitude;
    const lon = place.longitude;

    const weatherHost = 'https://' + 'api.' + 'open-meteo.com';
    const weatherUrl = new URL(weatherHost);
    weatherUrl.pathname = '/v1/forecast';

    weatherUrl.searchParams.set('latitude', lat);
    weatherUrl.searchParams.set('longitude', lon);
    weatherUrl.searchParams.set('current_weather', 'true');

    const weatherRes = await fetch(weatherUrl.toString());
    if (!weatherRes.ok) {
      throw new Error('Unable to retrieve weather data.');
    }
    const weatherData = await weatherRes.json();

    const wikiHost = 'https://' + 'en.' + 'wikipedia.org';
    const wikiUrl = new URL(wikiHost);
    wikiUrl.pathname = '/api/rest_v1/page/summary/' + encodeURIComponent(place.name);


    const wikiRes = await fetch(wikiUrl.toString());
    const wikiData = wikiRes.ok ? await wikiRes.json() : null;

    updateUI(place, weatherData.current_weather, wikiData);
    statusMessage.textContent = '';
    resultsContainer.classList.remove('hidden');

  } catch (error) {
    console.error('Fetch Error:', error);
    statusMessage.textContent = error.message;
  }
});

function updateUI(place, weather, wikiData) {
  const imgElement = document.getElementById('country-flag');
  if (wikiData && wikiData.thumbnail && wikiData.thumbnail.source) {
    imgElement.src = wikiData.thumbnail.source;
    imgElement.alt = 'Photo of ' + place.name;
    imgElement.style.display = 'block';
  } else {
    imgElement.style.display = 'none';
  }

  document.getElementById('country-name').textContent = place.name;
  document.getElementById('country-capital').textContent = place.country || place.name;
  document.getElementById('country-region').textContent = place.admin1 || place.timezone || 'N/A';
  document.getElementById('country-population').textContent = place.population ? place.population.toLocaleString() : 'N/A';
  document.getElementById('country-languages').textContent = wikiData && wikiData.extract ? wikiData.extract : 'No summary available.';

  document.getElementById('weather-city').textContent = 'Current conditions in ' + place.name;
  document.getElementById('weather-temp').textContent = Math.round(weather.temperature) + '°C';
  document.getElementById('weather-desc').textContent = getWeatherDescription(weather.weathercode);
  document.getElementById('weather-wind').textContent = weather.windspeed + ' km/h';
  document.getElementById('weather-coords').textContent = place.latitude.toFixed(2) + ', ' + place.longitude.toFixed(2);
}

function getWeatherDescription(code) {
  const codes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    51: 'Light drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    71: 'Slight snow',
    80: 'Rain showers',
    95: 'Thunderstorm'
  };
  return codes[code] || 'Variable conditions';
}
