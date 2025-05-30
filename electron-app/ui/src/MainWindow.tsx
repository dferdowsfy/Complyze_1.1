import React from 'react';

interface MainWindowProps {
  userEmail: string;
  isMonitoring: boolean;
  onLogout: () => void;
  onToggleMonitoring: () => void;
  onOpenDashboard: () => void;
  recentActivity: {
    timestamp: string;
    action: string;
    riskLevel: 'low' | 'medium' | 'high';
  }[];
}

const MainWindow: React.FC<MainWindowProps> = ({
  userEmail,
  isMonitoring,
  onLogout,
  onToggleMonitoring,
  onOpenDashboard,
  recentActivity,
}) => {
  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ 
      background: '#0E1E36', 
      minHeight: '100vh', 
      color: '#FAF9F6',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          margin: 0,
          letterSpacing: '0.025em'
        }}>
          COMPLYZE
        </h1>
        
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <button style={{
            background: 'transparent',
            border: 'none',
            color: '#FAF9F6',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}>
            Process
          </button>
          <button style={{
            background: 'transparent',
            border: 'none',
            color: '#FAF9F6',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}>
            FAQs
          </button>
          <button style={{
            background: 'transparent',
            border: 'none',
            color: '#FAF9F6',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}>
            Pricing
          </button>
          <button style={{
            background: 'transparent',
            border: '1px solid #FF6F3C',
            color: '#FAF9F6',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}>
            Sign Up
          </button>
          <button style={{
            background: '#FF6F3C',
            border: 'none',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Login
          </button>
        </nav>
      </header>

      {/* Main Section */}
      <main style={{ padding: '3rem 2rem' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            margin: '0 0 1rem 0',
            lineHeight: '1.2'
          }}>
            LLM risk is invisible—until it's not.
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: 'rgba(250, 249, 246, 0.8)',
            margin: 0
          }}>
            Monitor and enhance your AI prompts with real-time compliance protection
          </p>
        </div>

        {/* Dashboard Panel */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.75rem',
          padding: '2rem',
          maxWidth: '800px',
          margin: '0 auto',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {/* User Status */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {userEmail ? (
                <>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#16a34a'
                  }}></div>
                  <span>Logged in as {userEmail}</span>
                </>
              ) : (
                <>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#dc2626'
                  }}></div>
                  <span>Not logged in</span>
                </>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              {userEmail && (
                <button
                  onClick={onLogout}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#FAF9F6',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Logout
                </button>
              )}
              <button
                onClick={onOpenDashboard}
                style={{
                  background: '#FF6F3C',
                  border: 'none',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Open Dashboard
              </button>
            </div>
          </div>

          {/* Monitoring Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>
                Prompt Monitoring
              </h3>
              <p style={{ 
                margin: 0, 
                color: 'rgba(250, 249, 246, 0.7)',
                fontSize: '0.875rem'
              }}>
                {isMonitoring ? 'Active across monitored apps and websites' : 'Currently disabled'}
              </p>
            </div>
            <button
              onClick={onToggleMonitoring}
              style={{
                background: isMonitoring ? '#16a34a' : '#6b7280',
                border: 'none',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
            >
              {isMonitoring ? 'Disable' : 'Enable'}
            </button>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>
              Recent Activity
            </h3>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {recentActivity.length === 0 ? (
                <p style={{
                  margin: 0,
                  color: 'rgba(250, 249, 246, 0.5)',
                  textAlign: 'center',
                  padding: '2rem',
                  fontSize: '0.875rem'
                }}>
                  No recent activity. Start using monitored apps to see prompt processing here.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentActivity.slice(0, 10).map((activity, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '0.375rem',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: getRiskColor(activity.riskLevel)
                        }}></div>
                        <span style={{ fontSize: '0.875rem' }}>
                          {activity.action}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          background: getRiskColor(activity.riskLevel),
                          color: 'white',
                          fontWeight: '500'
                        }}>
                          {activity.riskLevel.toUpperCase()}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'rgba(250, 249, 246, 0.5)'
                        }}>
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainWindow; 