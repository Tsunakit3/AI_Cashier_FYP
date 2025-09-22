import '../styles/InfoBox.css';
import { useState, useEffect } from 'react';

export default function InfoBox() {
    const [time, setTime] = useState(new Date());
    const [weather, setWeather] = useState("Loading weather...");
    const [currentStation, setCurrentStation] = useState("Loading...");
    const [linesData, setLinesData] = useState({});
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedLine, setSelectedLine] = useState(null);

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

        // WebSocket for real-time station updates
        let ws;
        function setupWebSocket() {
            ws = new window.WebSocket("ws://localhost:8010/ws/current_station");
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.current_station) {
                        setCurrentStation(data.current_station);
                    }
                } catch (err) {
                    setCurrentStation("Unavailable");
                }
            };
            ws.onerror = () => setCurrentStation("Unavailable");
        }

        fetchWeather();
        const interval = setInterval(fetchWeather, 3600000); // refresh hourly
        setupWebSocket();
        // Fetch lines_data for dropdown
        fetch("http://localhost:8010/lines_data")
            .then(res => res.json())
            .then(data => setLinesData(data.lines_data || {}))
            .catch(err => console.error("Failed to fetch lines_data:", err));
        return () => {
            clearInterval(timer);
            clearInterval(interval);
            if (ws) ws.close();
        }
    }, []);

    const rawHours = time.getHours();
    const hours = ((rawHours % 12) || 12).toString().padStart(2, "0"); // 12-hour format
    const minutes = time.getMinutes().toString().padStart(2, "0");
    const ampm = rawHours >= 12 ? "PM" : "AM";

    // Handle station change
    const handleStationChange = async (station) => {
        try {
            await fetch("http://localhost:8010/set_station", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ station_name: station })
            });
            setDropdownOpen(false);
            setSelectedLine(null);
        } catch (err) {
            console.error("Failed to set station:", err);
        }
    };

    // Color palette for lines
    const lineColors = [
        '#D7263D', // Red
        '#1B998B', // Teal
        '#2E294E', // Dark Blue
        '#F46036', // Orange
        '#3A86FF', // Blue
        '#8338EC', // Purple
        '#FF006E', // Pink
        '#FFBE0B', // Yellow
    ];

    return (
        <div className="info-box">
            <div className="logo-row">
                <img src="/images/logoH.jpg" className="info-logo" />
            </div>

            <div className="station-row">
                <p className="curr-station"> Current Station : </p>
                <div style={{ position: 'relative', minWidth: '220px' }}>
                    <button
                        className="station-name"
                        style={{
                            background: 'linear-gradient(90deg, #f7f7f7 0%, #e0e0e0 100%)',
                            color: '#222',
                            border: 'none',
                            borderBottom: '2px solid #3A86FF',
                            borderRadius: '12px',
                            padding: '12px 28px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '1.08em',
                            fontFamily: 'Inter, Segoe UI, Arial, Helvetica, sans-serif',
                            minWidth: '180px',
                            boxShadow: '0 2px 12px rgba(58,134,255,0.08)',
                            transition: 'box-shadow 0.2s',
                            outline: dropdownOpen ? '2px solid #3A86FF' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <span style={{ flex: 1, textAlign: 'left' }}>{currentStation}</span>
                        <span style={{ fontSize: '1.2em', marginLeft: '12px', color: '#3A86FF', fontWeight: 'bold', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}>
                            ▼
                        </span>
                    </button>
                    {dropdownOpen && (
                        <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 10, background: '#fff', border: '1px solid #ccc', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', maxHeight: '340px', overflowY: 'auto', width: '100%' }}>
                            {!selectedLine ? (
                                Object.entries(linesData).map(([lineName, stations], idx) => {
                                    const lineColor = lineColors[idx % lineColors.length];
                                    return (
                                        <div key={lineName}>
                                            <div
                                                style={{ fontWeight: 'bold', background: lineColor, color: '#fff', padding: '16px 20px', fontSize: '0.95em', borderBottom: '2px solid #fff', borderRadius: '0', cursor: 'pointer', marginBottom: '0', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
                                                onClick={() => setSelectedLine(lineName)}
                                            >
                                                {lineName} <span style={{ float: 'right', color: '#fff' }}>▶</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <>
                                    <div style={{ fontWeight: 'bold', background: '#f7f7f7', padding: '12px 18px', fontSize: '0.95em', borderBottom: '1px solid #eee', color: '#222', cursor: 'pointer', borderRadius: '0' }} onClick={() => setSelectedLine(null)}>
                                        ← Back to Lines
                                    </div>
                                    {Object.entries(linesData).map(([lineName, stations], idx) => (
                                        lineName === selectedLine && stations.map((station) => (
                                            <div
                                                key={station}
                                                style={{ padding: '12px 18px', fontSize: '0.95em', cursor: 'pointer', color: '#222', background: station === currentStation ? '#e0e0e0' : '#fff', fontWeight: station === currentStation ? 'bold' : 'normal', borderLeft: `6px solid ${lineColors[idx % lineColors.length]}`, marginBottom: '0', borderRadius: '0' }}
                                                onClick={() => handleStationChange(station)}
                                            >
                                                {station}
                                            </div>
                                        ))
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
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

            <div className="language-row">
                <span className="language">Language:</span>
                <div style={{ position: "relative", display: "inline-block", minWidth: "180px" }}>
                    <select
                        defaultValue="en"
                        style={{
                            width: "100%",
                            paddingRight: "32px", // space for arrow
                            appearance: "none",
                            background: "linear-gradient(90deg, #f7f7f7 0%, #e0e0e0 100%)",
                            color: "#222",
                            border: "none",
                            borderBottom: "2px solid #3A86FF",
                            borderRadius: "12px",
                            padding: "12px 28px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "1.08em",
                            fontFamily: "Inter, Segoe UI, Arial, Helvetica, sans-serif",
                            minWidth: "180px",
                            boxShadow: "0 2px 12px rgba(58,134,255,0.08)",
                            transition: "box-shadow 0.2s",
                            outline: "none"
                        }}
                        onChange={async (e) => {
                            const lang = e.target.value;
                            try {
                                const res = await fetch("http://localhost:8010/set_language", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ language: lang })
                                });
                                const data = await res.json();
                                // Optionally show feedback
                            } catch (err) {
                                // Optionally show error feedback
                            }
                        }}
                    >
                        <option value="en" style={{
                            fontFamily: "Inter, Segoe UI, Arial, Helvetica, sans-serif",
                            fontWeight: "600",
                            fontSize: "1.08em",
                            padding: "10px 0",
                        }}> English</option>
                        <option value="ms" style={{
                            fontFamily: "Inter, Segoe UI, Arial, Helvetica, sans-serif",
                            fontWeight: "600",
                            fontSize: "1.08em",
                            padding: "10px 0"
                        }}> Malay</option>
                    </select>
                    <span
                        style={{
                            position: "absolute",
                            right: "18px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                            fontSize: "1.2em",
                            color: "#3A86FF",
                            fontWeight: "bold"
                        }}
                    >
                        ▼
                    </span>
                </div>
            </div>
        </div>
    )
}
