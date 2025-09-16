import React, { useState, useEffect } from 'react';
import './WeatherForecast.css';

interface WeatherData {
  temperature: number;
  condition: string;
  conditionIcon: string;
  high: number;
  low: number;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

const WeatherForecast: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${process.env.REACT_APP_WEATHER_API_KEY}&q=78130&days=1&aqi=no`
        );
        
        if (!response.ok) {
          throw new Error('Weather data not available');
        }

        const data = await response.json();
        setWeather({
          temperature: Math.round(data.current.temp_f),
          condition: data.current.condition.text,
          conditionIcon: data.current.condition.icon,
          high: Math.round(data.forecast.forecastday[0].day.maxtemp_f),
          low: Math.round(data.forecast.forecastday[0].day.mintemp_f),
          humidity: data.current.humidity,
          windSpeed: Math.round(data.current.wind_mph),
          feelsLike: Math.round(data.current.feelslike_f),
        });
      } catch (err) {
        setError('Unable to load weather data');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh weather data every 5 minutes
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="weather-loading">Loading weather data...</div>;
  }

  if (error || !weather) {
    return <div className="weather-error">{error || 'Weather data unavailable'}</div>;
  }

  return (
    <div className="weather-forecast">
      <div className="weather-section icon-only">
        <img 
          src={`https:${weather.conditionIcon}`} 
          alt={weather.condition}
          className="weather-icon"
        />
      </div>

      <div className="weather-section current">
        <div className="temperature">{weather.temperature}°F</div>
        <div className="condition">{weather.condition}</div>
      </div>

      <div className="weather-section feels">
        <div className="feels-like-label">Feels Like</div>
        <div className="feels-like-temp">{weather.feelsLike}°F</div>
        <div className="hi-lo">
          <span>H: {weather.high}°F</span>
          <span>L: {weather.low}°F</span>
        </div>
      </div>

      <div className="weather-section details">
        <div className="detail">
          <div className="detail-label">Humidity</div>
          <div className="detail-value">{weather.humidity}%</div>
        </div>
        <div className="detail">
          <div className="detail-label">Wind</div>
          <div className="detail-value">{weather.windSpeed} mph</div>
        </div>

      </div>
    </div>
  );
};

export default WeatherForecast;