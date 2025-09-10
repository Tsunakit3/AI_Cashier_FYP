import '../styles/MapBox.css'
import lines from '../data/lineData';
import { useState } from 'react'

export default function MapBox() {
    const [expandedLine, setExpandedLine] = useState(null);
    const [departure, setDeparture] = useState(null);
    const [destination, setDestination] = useState(null);
    const [selecting, setSelecting] = useState(null); // "departure" or "destination"

    const toggleExpand = (lineId) => {
        setExpandedLine(expandedLine === lineId ? null : lineId);
    };

    const handleStationClick = (station, lineName, lineColor) => {
        if (selecting === "departure") {
            setDeparture({ station, lineName, lineColor });
            setSelecting(null);
        } else if (selecting === "destination") {
            setDestination({ station, lineName, lineColor });
            setSelecting(null);
        }
    };

    const handleConfirmJourney = () => {
        if (!departure || !destination) return;

        const message = `Route from ${departure.station} to ${destination.station}`;
        console.log("Sending to LLM:", message);

        // Reset after confirm
        setDeparture(null);
        setDestination(null);
    };

    /*
    const handleConfirmJourney = async () => {
        if (!departure || !destination) return;

        const message = `Route from ${departure.station} to ${destination.station}`;

        try {
            const response = await fetch("http://localhost:8010/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("LLM API response:", data);

            // After confirming, reset the journey
            handleResetJourney();

        } catch (error) {
            console.error("Failed to send journey to LLM API:", error);
        }
    };
    */

    const handleResetJourney = () => {
        setDeparture(null);
        setDestination(null);
        console.log("Journey planner reset.");
    };

    return (
        <div className="map-box">
            <div className="lrt-title">
                <h3>LRT & MRT Journey Planner</h3>

                <p className="instruction-text">
                    Please select your Departure{" "}
                    <span
                        className="select-box"
                        style={{ color: departure?.lineColor || "#ccc" }}
                        onClick={() => setSelecting("departure")}
                    >
                        {departure ? departure.station : "Station"}
                    </span>{" "}
                    and Destination{" "}
                    <span
                        className="select-box"
                        style={{ color: destination?.lineColor || "#ccc" }}
                        onClick={() => setSelecting("destination")}
                    >
                        {destination ? destination.station : "Station"}
                    </span>
                </p>
            </div>

            {/* Station Picker */}
            {selecting && (
                <div className="station-picker">
                    <hr className="section-divider" />

                    {/* Header with title + actions */}
                    <div className="station-picker-header">
                        <h4>
                            Select {selecting === "departure" ? "Departure" : "Destination"} Station
                        </h4>
                        <div className="station-picker-actions">
                            <button
                                className="picker-btn clear"
                                onClick={() => {
                                    if (selecting === "departure") setDeparture(null);
                                    if (selecting === "destination") setDestination(null);
                                    setSelecting(null); //
                                }}
                            >
                                Clear
                            </button>
                            <button
                                className="picker-btn close"
                                onClick={() => setSelecting(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    <div className="line-list">
                        {lines.map((line) => (
                            <div key={line.id} className="line-container">
                                <div
                                    className="line-box"
                                    style={{ backgroundColor: line.color }}
                                    onClick={() => toggleExpand(line.id)}
                                >
                                    {line.name}
                                    <span className="expand-icon">
                                        {expandedLine === line.id ? "▼" : "▶"}
                                    </span>
                                </div>

                                <div
                                    className={`station-list-wrapper ${expandedLine === line.id ? "open" : ""
                                        }`}
                                >
                                    <div className="station-list-horizontal">
                                        {line.stations.map((station, index) => (
                                            <div
                                                key={index}
                                                className="station-box-horizontal"
                                                onClick={() =>
                                                    handleStationClick(station, line.name, line.color)
                                                }
                                            >
                                                {station}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Journey Info */}
            {departure && destination && (
                <div className="journey-info">
                    <div className="journey-details">
                        <h4>Journey Information</h4>
                        <div className="journey-row">
                            <strong>From:</strong> {departure.station} &nbsp; → &nbsp;
                            <strong>To:</strong> {destination.station}
                        </div>
                        <p>
                            <strong>Line(s):</strong> {departure.lineName} → {destination.lineName}
                        </p>
                        <p className="ready-text">Ready to plan your journey!</p>

                        <div className="journey-actions">
                            <button
                                className="confirm-button"
                                onClick={() => handleConfirmJourney()}
                            >
                                Confirm Journey
                            </button>
                            <button
                                className="reset-button"
                                onClick={handleResetJourney}
                            >
                                Reset Journey
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    )
}