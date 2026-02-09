export default function NotFound() {
  return (
    <html>
      <body>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1>404 - Page Not Found</h1>
          <p>The page you&apos;re looking for doesn&apos;t exist.</p>
          <a href="/" style={{ marginTop: '1rem', color: '#32B8C6' }}>
            Go back home
          </a>
        </div>
      </body>
    </html>
  );
}
