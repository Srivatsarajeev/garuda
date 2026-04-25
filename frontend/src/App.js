import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
const POLL_INTERVAL_MS = 5000;

const demoFeed = [
  {
    id: 'ALPHA-01',
    heart_rate: 92,
    temperature: 37.1,
    location: [34.102, 77.384],
    status: 'SAFE',
  },
  {
    id: 'BRAVO-07',
    heart_rate: 126,
    temperature: 38.4,
    location: [33.921, 76.991],
    status: 'DANGER',
  },
  {
    id: 'CHARLIE-12',
    heart_rate: 108,
    temperature: 37.8,
    location: [34.244, 77.118],
    status: 'SAFE',
  },
  {
    id: 'DELTA-04',
    heart_rate: 132,
    temperature: 39.1,
    location: [33.816, 77.528],
    status: 'DANGER',
  },
];

const statusTone = {
  SAFE: 'stable',
  DANGER: 'critical',
};

const formatTemp = (value) => `${value.toFixed(1)}C`;
const formatHeartbeat = (value) => `${Math.round(value)} bpm`;

function App() {
  const [feed, setFeed] = useState([]);
  const [mode, setMode] = useState('loading');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');

  const refreshFeed = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get-status`, {
        timeout: 4000,
      });

      const incoming = Array.isArray(response.data) ? response.data : [];

      if (incoming.length > 0) {
        setFeed(incoming);
        setMode('live');
        setError('');
      } else {
        setFeed(demoFeed);
        setMode('demo');
        setError('');
      }

      setLastUpdated(new Date());
    } catch (requestError) {
      setFeed(demoFeed);
      setMode('offline');
      setError('Backend unreachable. Showing simulated mission data.');
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    refreshFeed();
    const timer = window.setInterval(refreshFeed, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [refreshFeed]);

  const latestUnits = useMemo(() => {
    const byId = new Map();
    feed.forEach((entry, index) => {
      byId.set(entry.id, {
        ...entry,
        feedIndex: index,
      });
    });
    return [...byId.values()].reverse();
  }, [feed]);

  const summary = useMemo(() => {
    if (latestUnits.length === 0) {
      return {
        activeUnits: 0,
        dangerUnits: 0,
        avgHeartRate: 0,
        avgTemperature: 0,
        readiness: 100,
      };
    }

    const totals = latestUnits.reduce(
      (accumulator, unit) => {
        accumulator.heartRate += unit.heart_rate;
        accumulator.temperature += unit.temperature;
        accumulator.danger += unit.status === 'DANGER' ? 1 : 0;
        return accumulator;
      },
      { heartRate: 0, temperature: 0, danger: 0 }
    );

    const activeUnits = latestUnits.length;
    const readiness = Math.max(
      18,
      Math.round(((activeUnits - totals.danger) / activeUnits) * 100)
    );

    return {
      activeUnits,
      dangerUnits: totals.danger,
      avgHeartRate: totals.heartRate / activeUnits,
      avgTemperature: totals.temperature / activeUnits,
      readiness,
    };
  }, [latestUnits]);

  const hotspots = useMemo(
    () => latestUnits.filter((unit) => unit.status === 'DANGER'),
    [latestUnits]
  );

  return (
    <div className="app-shell">
      <div className="app-backdrop" />

      <main className="dashboard">
        <section className="hero-panel panel">
          <div className="hero-copy">
            <p className="eyebrow">GarudaAI Defense Grid</p>
            <h1>Real-time soldier safety dashboard for high-risk missions.</h1>
            <p className="hero-text">
              Monitor field health telemetry, detect emergencies, and surface
              rescue priorities from one unified operations interface.
            </p>

            <div className="hero-actions">
              <button type="button" className="primary-button" onClick={refreshFeed}>
                Refresh feed
              </button>
              <div className={`mode-pill mode-${mode}`}>
                {mode === 'live' && 'Live telemetry'}
                {mode === 'demo' && 'Demo telemetry'}
                {mode === 'offline' && 'Offline fallback'}
                {mode === 'loading' && 'Connecting'}
              </div>
            </div>
          </div>

          <div className="hero-brief">
            <div className="brief-card">
              <span>Mission readiness</span>
              <strong>{summary.readiness}%</strong>
              <small>Estimated from current active unit health.</small>
            </div>
            <div className="brief-card">
              <span>Last sync</span>
              <strong>
                {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Waiting'}
              </strong>
              <small>{error || 'Polling every 5 seconds.'}</small>
            </div>
          </div>
        </section>

        <section className="metrics-grid">
          <article className="metric-card panel">
            <span>Active units</span>
            <strong>{summary.activeUnits}</strong>
            <small>Unique soldiers currently tracked.</small>
          </article>
          <article className="metric-card panel">
            <span>Critical alerts</span>
            <strong>{summary.dangerUnits}</strong>
            <small>Danger state triggered by vitals threshold.</small>
          </article>
          <article className="metric-card panel">
            <span>Average heart rate</span>
            <strong>{formatHeartbeat(summary.avgHeartRate || 0)}</strong>
            <small>Rolling average across active units.</small>
          </article>
          <article className="metric-card panel">
            <span>Average temperature</span>
            <strong>{formatTemp(summary.avgTemperature || 0)}</strong>
            <small>Core temperature trend from latest packets.</small>
          </article>
        </section>

        <section className="main-grid">
          <article className="panel map-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Threat radar</p>
                <h2>Field positioning and rescue hotspots</h2>
              </div>
              <span className="section-meta">
                {hotspots.length} priority{hotspots.length === 1 ? '' : 'ies'}
              </span>
            </div>

            <div className="radar-surface">
              <div className="radar-rings" />
              {latestUnits.map((unit, index) => {
                const left = 18 + ((index * 17) % 62);
                const top = 20 + ((index * 23) % 58);

                return (
                  <div
                    key={unit.id}
                    className={`radar-point ${statusTone[unit.status]}`}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    title={`${unit.id} • ${unit.status}`}
                  >
                    <span />
                  </div>
                );
              })}
            </div>

            <div className="hotspot-list">
              {hotspots.length > 0 ? (
                hotspots.map((unit) => (
                  <div className="hotspot-row" key={unit.id}>
                    <div>
                      <strong>{unit.id}</strong>
                      <p>
                        {unit.location[0].toFixed(3)}, {unit.location[1].toFixed(3)}
                      </p>
                    </div>
                    <div>
                      <strong>{formatHeartbeat(unit.heart_rate)}</strong>
                      <p>{formatTemp(unit.temperature)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state compact">
                  No danger alerts. All visible units are stable.
                </div>
              )}
            </div>
          </article>

          <article className="panel roster-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Unit roster</p>
                <h2>Latest soldier health status</h2>
              </div>
              <span className="section-meta">Auto-prioritized</span>
            </div>

            <div className="roster-list">
              {latestUnits.length > 0 ? (
                latestUnits.map((unit) => (
                  <div className="roster-card" key={unit.id}>
                    <div className="roster-header">
                      <div>
                        <strong>{unit.id}</strong>
                        <p>
                          Sector {Math.abs(Math.round(unit.location[0] * 10))}-
                          {Math.abs(Math.round(unit.location[1] * 10))}
                        </p>
                      </div>
                      <span className={`status-badge ${statusTone[unit.status]}`}>
                        {unit.status}
                      </span>
                    </div>

                    <div className="vitals-grid">
                      <div>
                        <span>Heart rate</span>
                        <strong>{formatHeartbeat(unit.heart_rate)}</strong>
                      </div>
                      <div>
                        <span>Temperature</span>
                        <strong>{formatTemp(unit.temperature)}</strong>
                      </div>
                    </div>

                    <p className="location-line">
                      GPS {unit.location[0].toFixed(4)}, {unit.location[1].toFixed(4)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  No telemetry packets received yet. Start the FastAPI backend or
                  send data to <code>/send-data</code>.
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="bottom-grid">
          <article className="panel timeline-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Event stream</p>
                <h2>Mission activity timeline</h2>
              </div>
              <span className="section-meta">{feed.length} packets</span>
            </div>

            <div className="timeline-list">
              {[...feed].reverse().slice(0, 6).map((entry, index) => (
                <div className="timeline-row" key={`${entry.id}-${index}`}>
                  <div className={`timeline-dot ${statusTone[entry.status]}`} />
                  <div>
                    <strong>{entry.id}</strong>
                    <p>
                      {entry.status === 'DANGER'
                        ? 'Emergency thresholds exceeded.'
                        : 'Vitals within safe mission band.'}
                    </p>
                  </div>
                  <span>
                    {formatHeartbeat(entry.heart_rate)} / {formatTemp(entry.temperature)}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel protocol-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Response protocol</p>
                <h2>Automated rescue workflow</h2>
              </div>
            </div>

            <div className="protocol-list">
              <div>
                <strong>1. Monitor</strong>
                <p>Collect heart rate, body temperature, and GPS telemetry.</p>
              </div>
              <div>
                <strong>2. Detect</strong>
                <p>Flag danger when health thresholds cross risk limits.</p>
              </div>
              <div>
                <strong>3. Dispatch</strong>
                <p>Prioritize rescue teams using the hotspot and roster panels.</p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default App;
