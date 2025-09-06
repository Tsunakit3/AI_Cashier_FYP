import '../styles/Boot.css';
import { useNavigate } from "react-router-dom";
import { IoPower } from "react-icons/io5";
import { useState } from 'react';

export default function Boot() {
    const navigate = useNavigate();

    const [startTrain, setStartTrain] = useState(false);
    const handleClick = () => {
        setStartTrain(true);
        setTimeout(() => {
            navigate("/main");
        }, 2000);
    }

    return (
        <div className="boot-page">
            <div className="boot-background"></div>
            <div className="boot-container">
                <img src="/images/mflag.png" alt="flag" className="flag" />
                <h1 className="title"> LRT AI CASHIER </h1>
                <div className="power-container">
                    <p className="subtitle"> Press To Power On The System</p>
                    <button className="power-btn" onClick={handleClick}><IoPower /></button>
                </div>
                <img src="/images/train.gif" alt="train" className={`train ${startTrain ? "train-move" : ""}`} />
            </div>
        </div>
    );
}