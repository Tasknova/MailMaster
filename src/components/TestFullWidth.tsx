import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface TestFullWidthProps {
  onBack: () => void;
}

const TestFullWidth = ({ onBack }: TestFullWidthProps) => {
  return (
    <div style={{ 
      width: '100vw', 
      maxWidth: 'none', 
      backgroundColor: '#f0f0f0',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        marginBottom: '2rem',
        backgroundColor: '#e0e0e0',
        padding: '1rem',
        width: '100%'
      }}>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
            Full Width Test Page
          </h2>
          <p style={{ color: '#666', margin: 0 }}>
            This should take the full available width
          </p>
        </div>
      </div>

      {/* Test Card 1 - Full Width */}
      <div style={{ 
        width: '100%', 
        backgroundColor: '#d0d0d0', 
        padding: '1rem', 
        marginBottom: '1rem',
        border: '2px solid red'
      }}>
        <h3>Test Container 1 - Should be full width (red border)</h3>
        <p>This container uses inline styles with width: 100%</p>
      </div>

      {/* Test Card 2 - Using Card Component */}
      <Card style={{ 
        width: '100%', 
        maxWidth: 'none', 
        backgroundColor: '#c0c0c0',
        border: '2px solid blue'
      }}>
        <CardHeader>
          <CardTitle>Test Card 2 - Card Component (blue border)</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This uses the Card component with inline styles</p>
          <div style={{ 
            width: '100%', 
            height: '200px', 
            backgroundColor: '#a0a0a0',
            border: '2px solid green',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <p>Inner content area (green border) - should also be full width</p>
          </div>
        </CardContent>
      </Card>

      {/* Test Card 3 - CSS Classes */}
      <Card className="w-full max-w-none" style={{ 
        backgroundColor: '#b0b0b0',
        border: '2px solid purple',
        marginTop: '1rem'
      }}>
        <CardHeader>
          <CardTitle>Test Card 3 - CSS Classes (purple border)</CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <p>This uses CSS classes: w-full max-w-none</p>
          <div className="w-full h-48 bg-gray-300 border-2 border-orange-500 flex items-center justify-center">
            <p>Inner content with CSS classes (orange border)</p>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f9f9f9',
        border: '1px solid #ccc',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <h4>Debug Information:</h4>
        <p>Window width: <span id="window-width">Loading...</span>px</p>
        <p>Container width: <span id="container-width">Loading...</span>px</p>
        <p>Available width: <span id="available-width">Loading...</span>px</p>
        
        <script dangerouslySetInnerHTML={{
          __html: `
            setTimeout(() => {
              document.getElementById('window-width').textContent = window.innerWidth;
              const container = document.querySelector('[style*="width: 100vw"]');
              if (container) {
                document.getElementById('container-width').textContent = container.offsetWidth;
                document.getElementById('available-width').textContent = container.clientWidth;
              }
            }, 100);
          `
        }} />
      </div>
    </div>
  );
};

export default TestFullWidth;