import React from 'react';

console.log('🔍 TestNotification: File loaded');

const TestNotification = ({ children }) => {
    console.log('🔍 TestNotification: Component mounted');
    
    return (
        <div>
            {children}
            <div style={{ 
                position: 'fixed', 
                top: '10px', 
                left: '10px', 
                background: 'green', 
                color: 'white', 
                padding: '10px',
                zIndex: 9999
            }}>
                🔍 TestNotification is working!
            </div>
        </div>
    );
};

export default TestNotification; 