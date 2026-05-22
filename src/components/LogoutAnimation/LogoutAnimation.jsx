import React from 'react';
import { LogOut } from 'lucide-react';
import { LOGO_PATHS } from '../../utils/assetPath';
import './LogoutAnimation.css';

const LogoutAnimation = ({ onComplete }) => {
    React.useEffect(() => {
        // Auto-complete after animation (3 seconds)
        const timer = setTimeout(() => {
            if (onComplete) onComplete();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="logout-animation-overlay">
            <div className="logout-animation-container">
                {/* Logo with animation */}
                <div className="logout-logo-wrapper">
                    <div className="logout-logo-circle">
                        <img
                            src={LOGO_PATHS.healit}
                            alt="HEALit Logo"
                            className="logout-logo-image"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                        <span className="logout-logo-fallback" style={{ display: 'none' }}>🏥</span>
                    </div>

                    {/* Logout icon animation */}
                    <div className="logout-icon-animation">
                        <LogOut size={32} />
                    </div>
                </div>

                {/* Laboratory name */}
                <div className="logout-lab-name">
                    <h1 className="logout-title">HEALit Medical Laboratory</h1>
                    <p className="logout-subtitle">Logging out...</p>
                </div>

                {/* Animated dots */}
                <div className="logout-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                </div>

                {/* Success message */}
                <div className="logout-message">
                    <p>Thank you for using HEALit Lab System</p>
                </div>
            </div>
        </div>
    );
};

export default LogoutAnimation;
