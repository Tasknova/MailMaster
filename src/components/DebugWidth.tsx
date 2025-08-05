import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface DebugWidthProps {
  onBack: () => void;
}

const DebugWidth = ({ onBack }: DebugWidthProps) => {
  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        marginBottom: '2rem',
        backgroundColor: '#ff0000',
        padding: '1rem',
        color: 'white'
      }}>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2>Debug Width Test - RED BACKGROUND</h2>
          <p>This should show the actual available width</p>
        </div>
      </div>

      {/* Full Width Test Div */}
      <div style={{ 
        backgroundColor: '#00ff00', 
        height: '100px',
        color: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        <h3>GREEN DIV - No width constraints</h3>
      </div>

      {/* 100% Width Test */}
      <div style={{ 
        backgroundColor: '#0000ff', 
        height: '100px',
        width: '100%',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        <h3>BLUE DIV - width: 100%</h3>
      </div>

      {/* 100vw Width Test */}
      <div style={{ 
        backgroundColor: '#ff00ff', 
        height: '100px',
        width: '100vw',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        marginLeft: '-1.5rem', // Compensate for parent padding
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        boxSizing: 'border-box'
      }}>
        <h3>MAGENTA DIV - width: 100vw (should be full screen width)</h3>
      </div>

      {/* Flexbox Test */}
      <div style={{ 
        display: 'flex',
        backgroundColor: '#ffff00',
        height: '100px',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        <h3>YELLOW DIV - flex container</h3>
      </div>

      {/* Grid Test */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div style={{ 
          backgroundColor: '#00ffff', 
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h4>CYAN - Grid 1</h4>
        </div>
        <div style={{ 
          backgroundColor: '#ffa500', 
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h4>ORANGE - Grid 2</h4>
        </div>
      </div>

      {/* Debug Information */}
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f0f0f0',
        border: '1px solid #ccc',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <h4>Real-time Width Debug:</h4>
        <div id="debug-info">
          <p>Loading measurements...</p>
        </div>
        
        <script dangerouslySetInnerHTML={{
          __html: `
            function updateDebugInfo() {
              const debugDiv = document.getElementById('debug-info');
              if (debugDiv) {
                const windowWidth = window.innerWidth;
                const bodyWidth = document.body.offsetWidth;
                const rootWidth = document.getElementById('root').offsetWidth;
                const mainElement = document.querySelector('main');
                const mainWidth = mainElement ? mainElement.offsetWidth : 'N/A';
                
                debugDiv.innerHTML = \`
                  <p>Window width: \${windowWidth}px</p>
                  <p>Body width: \${bodyWidth}px</p>
                  <p>Root element width: \${rootWidth}px</p>
                  <p>Main element width: \${mainWidth}px</p>
                  <p>Available space: \${mainWidth !== 'N/A' ? mainWidth - 48 : 'N/A'}px (minus padding)</p>
                \`;
              }
            }
            
            setTimeout(updateDebugInfo, 100);
            window.addEventListener('resize', updateDebugInfo);
          `
        }} />
      </div>
    </div>
  );
};

export default DebugWidth;