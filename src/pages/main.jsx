import '../styles/Main.css';
import InfoBox from '../components/info-box';
import ChatBox from '../components/chat-box';
import MapBox from '../components/map-box';
import Avatar from '../components/avatar';
import { useState, useRef } from 'react';

export default function Main() {
    const [chatMessage, setChatMessage] = useState(null);
    const [routeDetails, setRouteDetails] = useState(null);
    const [mouthCues, setMouthCues] = useState([]);
    const audioRef = useRef(null);
    const [isTalking, setIsTalking] = useState(false);
    const [triggerWave, setTriggerWave] = useState(false);
    const [triggerBow, setTriggerBow] = useState(false);

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
                <div className="avatar-container">
                    <Avatar audioRef={audioRef} mouthCues={mouthCues} isTalking={isTalking} triggerWave={triggerWave} triggerBow={triggerBow}/>
                </div>
                <div className="chat-container">
                    <ChatBox
                        message={chatMessage}
                        onResponse={handleChatResponse}
                        setMouthCues = {setMouthCues}
                        audioRef={audioRef}
                        setIsTalking={setIsTalking}
                        setTriggerWave={setTriggerWave}
                        setTriggerBow={setTriggerBow}
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