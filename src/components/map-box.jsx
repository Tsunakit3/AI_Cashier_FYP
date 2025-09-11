import '../styles/MapBox.css'
import { useState, useEffect } from 'react'
import RouteMap from './react-map';

export default function MapBox({ onConfirmJourney, routeDetails }) {
    const [linesData, setLinesData] = useState({});
    const [expandedLine, setExpandedLine] = useState(null);
    const [currentStation, setCurrentStation] = useState("Loading...");
    const [destination, setDestination] = useState(null);
    const [selecting, setSelecting] = useState(false); // true if selecting destination

    useEffect(() => {
        fetch("http://localhost:8010/lines_data")
            .then(res => res.json())
            .then(data => setLinesData(data.lines_data || {}))
            .catch(err => console.error("Failed to fetch lines_data:", err));

        // WebSocket for real-time current station
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
        setupWebSocket();
        return () => { if (ws) ws.close(); };
    }, []);

    const toggleExpand = (lineName) => {
        setExpandedLine(expandedLine === lineName ? null : lineName);
    };

    const handleStationClick = (station, lineName) => {
        if (selecting) {
            setDestination({ station, lineName });
            setSelecting(false);
        }
    };

    
    const handleConfirmJourney = () => {
        if (!destination) return;
        const message = `Route to ${destination.station}`;
        handleResetJourney();
        if (onConfirmJourney) onConfirmJourney(message);
    };


    const handleResetJourney = () => {
        setDestination(null);
        console.log("Journey planner reset.");
    };

    const clearSelection = () => {
        setDestination(null);
        setSelecting(false);
    };

    const journeyData = {
        currentStation,
        destination,
    };

    return (
        <div className="map-box">
            <div>
                <div className="lrt-title" style={{ background: 'linear-gradient(90deg, #3A86FF 0%, #8338EC 100%)', borderRadius: '0', padding: '22px 32px 18px 32px', marginBottom: '14px', boxShadow: '0 2px 12px rgba(58,134,255,0.10)' }}>
                    <h3 style={{ color: '#fff', fontFamily: 'Inter, Segoe UI, Arial, Helvetica, sans-serif', fontWeight: 700, fontSize: '1.7em', letterSpacing: '1px', marginBottom: '10px', textShadow: '0 2px 8px rgba(58,134,255,0.10)' }}>
                        LRT & MRT Journey Planner
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '48px', marginTop: '4px' }}>
                        <div style={{ width: '180px', minWidth: '140px', height: '54px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, Segoe UI, Arial, Helvetica, sans-serif', fontWeight: 500, fontSize: '0.92em', color: '#fff', background: 'rgba(0,0,0,0.10)', borderRadius: '12px', padding: '6px 0', boxShadow: '0 1px 4px rgba(58,134,255,0.10)' }}>
                            <span style={{ opacity: 0.8, fontSize: '0.92em', marginBottom: '1px' }}>Current Station:</span>
                            <span style={{ color: '#FFBE0B', fontWeight: 700, fontSize: '1em', textAlign: 'center' }}>{currentStation}</span>
                        </div>
                        <div style={{ width: '180px', minWidth: '140px', height: '54px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, Segoe UI, Arial, Helvetica, sans-serif', fontWeight: 500, fontSize: '0.92em', color: '#fff', background: 'rgba(0,0,0,0.10)', borderRadius: '12px', padding: '6px 0', boxShadow: '0 1px 4px rgba(58,134,255,0.10)', cursor: 'pointer', transition: 'background 0.2s' }}
                            onClick={() => setSelecting(true)}
                        >
                            <span style={{ opacity: 0.8, fontSize: '0.92em', marginBottom: '1px' }}>Destination:</span>
                            <span style={{ color: destination ? '#FF006E' : '#ccc', fontWeight: 700, fontSize: '1em', textAlign: 'center' }}>{destination ? destination.station : 'Select Station'}</span>
                        </div>
                    </div>
                </div>
                {/* Station Picker - always rendered below lrt-title, never overlapping */}
                {selecting && (
                    <div className="station-picker" style={{ padding: '6px 20px 18px 20px' }}>
                        <div className="station-picker-header">
                            <h4>
                                Select Destination Station
                            </h4>
                            <div className="station-picker-actions">
                                <button
                                    className="picker-btn clear"
                                    onClick={clearSelection}
                                >
                                    Clear
                                </button>
                                <button
                                    className="picker-btn close"
                                    onClick={() => setSelecting(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <div className="line-list" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                            {Object.entries(linesData).map(([lineName, stations], idx) => {
                                // Assign a color for each line (fallback to palette)
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
                                const lineColor = lineColors[idx % lineColors.length];
                                return (
                                    <div key={lineName} className="line-container">
                                        <div
                                            className="line-box"
                                            style={{ background: lineColor, color: '#fff', fontWeight: 'bold', fontSize: '1.1em', letterSpacing: '0.5px' }}
                                            onClick={() => toggleExpand(lineName)}
                                        >
                                            {lineName}
                                            <span className="expand-icon" style={{ color: '#fff' }}>
                                                {expandedLine === lineName ? '▼' : '▶'}
                                            </span>
                                        </div>
                                        <div className={`station-list-wrapper ${expandedLine === lineName ? 'open' : ''}`}>
                                            <div className="station-list-horizontal" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '220px', paddingRight: '8px' }}>
                                                {stations.map((station, index) => (
                                                    <div
                                                        key={index}
                                                        className="station-box-horizontal"
                                                        style={{ color: '#222', background: '#f7f7f7', border: `2px solid ${lineColor}`, fontWeight: '500', margin: '0 4px', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', minWidth: '90px', textAlign: 'center' }}
                                                        onClick={() => handleStationClick(station, lineName)}
                                                    >
                                                        {station}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Journey Info */}
            {currentStation && destination && (
                <div className="journey-info" style={{ display: 'flex', flexDirection: 'column', width: '340px', maxWidth: '100%', margin: '0 auto' }}>
                    <div className="journey-details" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <h4>Journey Information</h4>
                        <div className="journey-row">
                            <strong>From:</strong> {currentStation} &nbsp; → &nbsp;
                            <strong>To:</strong> {destination.station}
                        </div>
                        <p>
                            <strong>Line:</strong> {destination.lineName}
                        </p>
                        <p className="ready-text">Ready to plan your journey!</p>
                        <div className="journey-actions">
                            <div style={{ display: 'flex', width: '100%' }}>
                                <button
                                    className="confirm-button"
                                    style={{ flex: 1, borderRadius: '12px 0 0 12px', padding: '14px 0', fontSize: '1.08em', fontWeight: 600, background: 'linear-gradient(90deg, #3A86FF 0%, #FFBE0B 100%)', color: '#fff', border: 'none', cursor: 'pointer' }}
                                    onClick={() => handleConfirmJourney()}
                                >
                                    Confirm Journey
                                </button>
                                <button
                                    className="reset-button"
                                    style={{ flex: 1, borderRadius: '0 12px 12px 0', padding: '14px 0', fontSize: '1.08em', fontWeight: 600, background: 'linear-gradient(90deg, #FF006E 0%, #8338EC 100%)', color: '#fff', border: 'none', cursor: 'pointer' }}
                                    onClick={clearSelection}
                                >
                                    Reset Journey
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div style={{ width: '100%', maxWidth: '100%', height: '470px', position: 'relative', overflow: 'hidden', borderRadius: '16px', boxShadow: '0 2px 12px rgba(58,134,255,0.10)', margin: '18px 0' }}>
                {routeDetails && <RouteMap routeDetails={routeDetails} style={{ width: '100%', height: '100%' }} />}
            </div>
        </div>
    );
}