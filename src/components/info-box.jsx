import '../styles/InfoBox.css';
import { useState, useEffect } from 'react';

export default function InfoBox() {
    const [time, setTime] = useState(new Date());
    const [weather, setWeather] = useState("Loading weather...");

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);

        async function fetchWeather() {
            try {
                const res = await fetch(
                    "https://api.data.gov.my/weather/forecast?contains=Ampang@location__location_name"
                );
                const data = await res.json();
                const today = data[0]; // assuming first entry is today's forecast
                const temps = `Min: ${today?.min_temp}°C, Max: ${today?.max_temp}°C`;
                setWeather(temps);
            } catch (err) {
                console.error(err);
                setWeather("Weather data unavailable");
            }
        }

        fetchWeather();
        const interval = setInterval(fetchWeather, 3600000); // refresh hourly
        return () => {
            clearInterval(timer);
            clearInterval(interval);
        }
    }, []);

    const rawHours = time.getHours();
    const hours = ((rawHours % 12) || 12).toString().padStart(2, "0"); // 12-hour format
    const minutes = time.getMinutes().toString().padStart(2, "0");
    const ampm = rawHours >= 12 ? "PM" : "AM";

    return (
        <div className="info-box">
            <div className="logo-row">
                <img src="/images/logoH.jpg" className="info-logo" />
            </div>

            <div className="station-row">
                <p className="curr-station"> Current Station : </p>
                <p className="station-name"> Ampang Park </p>
            </div>

            <div className="status-row">
                <p className="status-text">Temperature: {weather}</p>
            </div>

            <div className="time-row">
                <span className="time">
                    {hours}
                    <span className="blink">:</span>
                    {minutes} {ampm}
                </span>
                <div className="date">
                    {time.toLocaleDateString()} ({time.toLocaleDateString(undefined, { weekday: 'long' })})
                </div>
            </div>
        </div>
    )
}
