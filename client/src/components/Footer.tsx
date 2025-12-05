import React from 'react';

const Footer: React.FC = () => {
    // Read the variable set during the build process
    const versionSha = process.env.REACT_APP_VERSION_SHA;
    const versionText = versionSha ? `Build: ${versionSha}` : 'Local Dev';

    return (
        <footer style={{ 
            marginTop: '20px', 
            padding: '10px 0', 
            textAlign: 'center', 
            fontSize: '0.8rem', 
            color: '#888' 
        }}>
            <p>
                Mafia ToS Game - built by deidarax4
                {versionSha && <span style={{ marginLeft: '15px' }}>| {versionText}</span>}
            </p>
        </footer>
    );
};

export default Footer;