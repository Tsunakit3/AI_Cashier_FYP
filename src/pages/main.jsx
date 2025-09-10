import '../styles/Main.css';
import InfoBox from '../components/info-box';
import ChatBox from '../components/chat-box';
import MapBox from '../components/map-box';
import Avatar from '../components/avatar';
import { useState } from 'react';


export default function Main() {
    const [status, setStatus] = useState("chat");

    return (
        <div className="main-page">
            <div className="main-background"></div>
            <div className="info-container">
                <InfoBox />
            </div>
            <div className="main-container">
                <div className="avatar-container">
                    <Avatar />
                </div>
                <div className="chat-container">
                    <ChatBox />
                </div>
                <div className="map-container">
                    <MapBox />
                </div>
            </div>

        </div>
    )
}
