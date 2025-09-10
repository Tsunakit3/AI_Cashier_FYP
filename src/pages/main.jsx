import '../styles/Main.css';
import InfoBox from '../components/info-box';
import ChatBox from '../components/chat-box';
import MapBox from '../components/map-box';
import TicketBox from '../components/ticket-box';
import PopOut from '../components/pop-out';
import { useState } from 'react';

export default function Main() {
    const [chatMessage, setChatMessage] = useState(null);
    const [routeDetails, setRouteDetails] = useState(null);

    // Called by MapBox when journey is confirmed
    const handleJourneyConfirm = (message) => {
        setChatMessage(message);
    };

    // Called by ChatBox when response is received
    const handleChatResponse = (response) => {
        if (response.route_details) {
            setRouteDetails(response.route_details);
        }
    };

    return (
        <div className="main-page">
            <div className="main-background"></div>
            <div className="info-container">
                <InfoBox />
            </div>
            <div className="main-container">
                <div className="video-container">
                </div>
                <div className="chat-container">
                    <ChatBox
                        message={chatMessage}
                        onResponse={handleChatResponse}
                    />
                </div>
                <div className="map-container">
                    <MapBox
                        onConfirmJourney={handleJourneyConfirm}
                        routeDetails={routeDetails}
                    />
                </div>
            </div>
        </div>
    );
}