import '../styles/MapBox.css'
import { useState } from 'react'

export default function MapBox() {
    const lines = [
        {
            id: "lrt-kelana-jaya",
            name: "LRT Kelana Jaya Line",
            color: "#E53935",
            stations: ["Gombak", "Taman Melati", "Wangsa Maju", "KLCC", "KL Sentral", "Kelana Jaya"],
        },
        {
            id: "lrt-ampang",
            name: "LRT Ampang Line",
            color: "#FFB300",
            stations: ["Ampang", "Cahaya", "Maluri", "Hang Tuah", "Sri Petaling"],
        },
        {
            id: "mrt-sbk",
            name: "MRT Sungai Buloh–Kajang Line",
            color: "#1E88E5",
            stations: ["Sungai Buloh", "Mutiara Damansara", "Bukit Bintang", "Merdeka", "Kajang"],
        },
    ];

    const [expandedLine, setExpandedLine] = useState(null);
    const [selectedDestination, setSelectedDestination] = useState(null);

    const toggleExpand = (lineId) => {
        setExpandedLine(expandedLine === lineId ? null : lineId);
    }

    const selectDestination = (station, lineName, lineColor) => {
        setSelectedDestination({ station, lineName, lineColor });
    }

    const clearSelection = () => {
        setSelectedDestination(null);
    }

    return (
        <div className="map-box">
            <div className="lrt-title">
                <h3>LRT & MRT Lines</h3>

                {selectedDestination && (
                    <div className="selected-destination">
                        <div className="destination-info">
                            <div className="destination-text">
                                <strong>Selected: {selectedDestination.station}</strong>
                                <div
                                    className="line-info"
                                    style={{ color: selectedDestination.lineColor }}
                                >
                                    {selectedDestination.lineName}
                                </div>
                            </div>
                        </div>
                        <button className="clear-button" onClick={clearSelection}>
                            ✕
                        </button>
                    </div>
                )}
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
                                {expandedLine === line.id ? '▼' : '▶'}
                            </span>
                        </div>

                        <div className={`station-list-wrapper ${expandedLine === line.id ? 'open' : ''}`}>
                            <div className="station-list-horizontal">
                                {line.stations.map((station, index) => (
                                    <div
                                        key={index}
                                        className={`station-box-horizontal ${selectedDestination?.station === station ? 'selected' : ''}`}
                                        onClick={() => selectDestination(station, line.name, line.color)}
                                    >
                                        {station}
                                        {selectedDestination?.station === station && (
                                            <span className="selected-icon">✓</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedDestination && (
                <div className="journey-info">
                    <div className="journey-details">
                        <h4>Journey Information</h4>
                        <p><strong>Destination:</strong> {selectedDestination.station}</p>
                        <p><strong>Line:</strong> {selectedDestination.lineName}</p>
                        <p><strong>Fare:</strong> </p>
                        <p className="ready-text">Ready to plan your journey!</p>
                    </div>
                    <img className="qr-code" src="/images/qr_code.png" />
                </div>
            )}
        </div>
    )
}