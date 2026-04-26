import { useState, useEffect } from 'react';
import { BookOpen, Clock, Settings, FileText, CheckCircle2, AlertTriangle, XCircle, Sparkles, Beaker, DollarSign, Calendar, Edit3, Save, Check, Trash2, Download, BarChart3, TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import './index.css';
import logo from './assets/logo.png';
import { Streamlit } from "streamlit-component-lib";

interface QCReference {
  title: string;
  url: string;
  authors: string;
}

interface QCResponse {
  status: string;
  references: QCReference[];
}

interface ProtocolStep {
  step_number: number;
  title: string;
  description: string;
  duration: string;
}

interface MaterialItem {
  name: string;
  supplier: string;
  catalog_number: string;
  quantity: string;
  cost: number;
}

interface TimelinePhase {
  phase_name: string;
  duration_weeks: number;
  description: string;
}

interface ExperimentPlan {
  protocol: ProtocolStep[];
  materials: MaterialItem[];
  total_budget: number;
  timeline: TimelinePhase[];
}

const mockCostData = [
  { name: 'Materials', value: 4500, color: '#87cfff' },
  { name: 'Labor', value: 3200, color: '#bbc7db' },
  { name: 'Overhead', value: 1200, color: '#d6bee5' },
  { name: 'Logistics', value: 800, color: '#ffb4ab' },
];

const mockTimelineData = [
  { month: 'Jan', plans: 4, success: 3 },
  { month: 'Feb', plans: 7, success: 6 },
  { month: 'Mar', plans: 5, success: 4 },
  { month: 'Apr', plans: 12, success: 10 },
  { month: 'May', plans: 8, success: 7 },
  { month: 'Jun', plans: 15, success: 14 },
];

const mockSampleSizeData = [
  { range: '0-50', count: 12 },
  { range: '51-200', count: 25 },
  { range: '201-500', count: 18 },
  { range: '501-1000', count: 8 },
  { range: '1000+', count: 5 },
];

function App(props: any) {
  // Check if we are running inside Streamlit
  const isStreamlit = props.theme !== undefined;

  const [hypothesis, setHypothesis] = useState('');
  const [loadingQC, setLoadingQC] = useState(false);
  const [qcResult, setQcResult] = useState<QCResponse | null>(null);

  const [loadingPlan, setLoadingPlan] = useState(false);
  const [plan, setPlan] = useState<ExperimentPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'protocol' | 'materials' | 'timeline'>('protocol');

  // Review Loop State
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [feedbackSaved, setFeedbackSaved] = useState<number | null>(null);

  const [qcError, setQcError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  // New features state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<'new_experiment' | 'library' | 'past_plans' | 'settings' | 'insights'>('new_experiment');

  // Currency state
  const [currency, setCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 });

  // Persistent States
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const [savedPapers, setSavedPapers] = useState<QCReference[]>(() => {
    const saved = localStorage.getItem('savedPapers');
    return saved ? JSON.parse(saved) : [];
  });

  const [pastPlans, setPastPlans] = useState<{ id: string, hypothesis: string, date: string, plan: ExperimentPlan }[]>(() => {
    const saved = localStorage.getItem('pastPlans');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('savedPapers', JSON.stringify(savedPapers));
  }, [savedPapers]);

  useEffect(() => {
    if (isStreamlit) {
      Streamlit.setComponentReady();
      Streamlit.setFrameHeight();
    }
  }, [isStreamlit]);

  // Handle incoming data from Streamlit
  useEffect(() => {
    if (props.args) {
      const { type, data, error } = props.args;
      if (type === 'qc_result') {
        setQcResult(data);
        setLoadingQC(false);
      } else if (type === 'plan_result') {
        setPlan(data);
        setLoadingPlan(false);
        setActiveTab('protocol');
      } else if (type === 'error') {
        setQcError(error);
        setPlanError(error);
        setLoadingQC(false);
        setLoadingPlan(false);
      }
    }
  }, [props.args]);

  const savePaper = (ref: QCReference) => {
    if (!savedPapers.some(p => p.url === ref.url)) {
      setSavedPapers([...savedPapers, ref]);
    }
  };

  const removePaper = (url: string) => {
    setSavedPapers(savedPapers.filter(p => p.url !== url));
  };

  const saveCurrentPlan = () => {
    if (plan) {
      const newPlan = {
        id: Date.now().toString(),
        hypothesis,
        date: new Date().toLocaleDateString(),
        plan
      };
      setPastPlans([...pastPlans, newPlan]);
    }
  };

  const removePlan = (id: string) => {
    setPastPlans(pastPlans.filter(p => p.id !== id));
  };

  const loadPlan = (id: string) => {
    const saved = pastPlans.find(p => p.id === id);
    if (saved) {
      setHypothesis(saved.hypothesis);
      setPlan(saved.plan);
      setCurrentView('new_experiment');
    }
  };

  useEffect(() => {
    // Fetch live currency rates
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setExchangeRates(data.rates);
        }
      })
      .catch(err => console.error("Failed to fetch exchange rates:", err));
  }, []);

  const formatCurrency = (amountInUSD: number) => {
    const rate = exchangeRates[currency] || 1;
    const converted = amountInUSD * rate;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(converted);
  };

  const handleQC = async () => {
    if (!hypothesis.trim()) return;
    setLoadingQC(true);
    setQcResult(null);
    setQcError(null);
    setPlan(null);

    if (isStreamlit) {
      Streamlit.setComponentValue({ action: 'qc', hypothesis });
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/literature-qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hypothesis }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        let errMsg = errorData.detail;
        if (Array.isArray(errMsg)) errMsg = errMsg[0].msg;
        throw new Error(errMsg || `HTTP Error ${res.status}`);
      }
      const data = await res.json();
      setQcResult(data);
    } catch (err: any) {
      console.error(err);
      setQcError(err.message || "Failed to connect to the server.");
    }
    setLoadingQC(false);
  };

  const handleGeneratePlan = async () => {
    if (!hypothesis.trim()) return;
    setLoadingPlan(true);
    setPlanError(null);

    if (isStreamlit) {
      Streamlit.setComponentValue({ action: 'generate_plan', hypothesis });
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hypothesis }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        let errMsg = errorData.detail;
        if (Array.isArray(errMsg)) errMsg = errMsg[0].msg;
        throw new Error(errMsg || `HTTP Error ${res.status}`);
      }
      const data = await res.json();
      setPlan(data);
      setActiveTab('protocol');
    } catch (err: any) {
      console.error(err);
      setPlanError(err.message || "Failed to generate plan.");
    }
    setLoadingPlan(false);
  };

  const submitCorrection = (stepNumber: number) => {
    if (!plan) return;
    // In a real app, this would send a POST request to the backend to store feedback
    const updatedProtocol = plan.protocol.map(step =>
      step.step_number === stepNumber ? { ...step, description: editValue } : step
    );
    setPlan({ ...plan, protocol: updatedProtocol });
    setEditingStep(null);
    setFeedbackSaved(stepNumber);
    setTimeout(() => setFeedbackSaved(null), 3000);
  };

  const renderQCStatus = (status: string) => {
    switch (status) {
      case 'not found':
        return <span className="md-chip success"><CheckCircle2 size={16} /> Novel Protocol</span>;
      case 'similar work exists':
        return <span className="md-chip warning"><AlertTriangle size={16} /> Similar Work Exists</span>;
      case 'exact match found':
        return <span className="md-chip error"><XCircle size={16} /> Exact Match Found</span>;
      default:
        return <span className="md-chip"><AlertTriangle size={16} /> Error Check Connection</span>;
    }
  };

  return (
    <div className="layout-container">
      {/* Top Bar for Mobile/Retracted Sidebar */}
      <div className="top-bar">
        <div className="menu-bg menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <div className="menu__icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div 
          onClick={() => setCurrentView('new_experiment')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'white', 
            padding: '4px 12px', 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img src={logo} alt="VeloLabs Logo" style={{ height: '35px', width: 'auto' }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label className="theme-switch" htmlFor="theme-switch-checkbox">
            <input 
              type="checkbox" 
              id="theme-switch-checkbox" 
              className="theme-switch__checkbox" 
              checked={theme === 'dark'}
              onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            />
            <div className="theme-switch__container">
              <div className="theme-switch__stars-container">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 144 55" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M111.454 44.8697L114.654 46.5516C115.118 46.7954 115.659 46.4026 115.571 45.8858L114.96 42.3196L117.553 39.7915C117.929 39.4244 117.72 38.7831 117.2 38.7075L113.619 38.1874L112.016 34.94C111.784 34.4695 111.124 34.4695 110.892 34.94L109.289 38.1874L105.708 38.7075C105.188 38.7831 104.979 39.4244 105.355 39.7915L107.948 42.3196L107.337 45.8858C107.249 46.4026 107.79 46.7954 108.254 46.5516L111.454 44.8697Z" fill="currentColor"/><path fillRule="evenodd" clipRule="evenodd" d="M33.4542 39.8697L36.6542 41.5516C37.1184 41.7954 37.6592 41.4026 37.571 40.8858L36.9599 37.3196L39.5532 34.7915C39.9292 34.4244 39.7203 33.7831 39.2005 33.7075L35.6194 33.1874L34.0164 29.94C33.7836 29.4695 33.1249 29.4695 32.892 29.94L31.289 33.1874L27.708 33.7075C27.1881 33.7831 26.9793 34.4244 27.3553 34.7915L29.9486 37.3196L29.3375 40.8858C29.2492 41.4026 29.79 41.7954 30.2543 41.5516L33.4542 39.8697Z" fill="currentColor"/><path fillRule="evenodd" clipRule="evenodd" d="M102.454 14.8697L105.654 16.5516C106.118 16.7954 106.659 16.4026 106.571 15.8858L105.96 12.3196L108.553 9.79148C108.929 9.42436 108.72 8.7831 108.2 8.70749L104.619 8.18738L103.016 4.93998C102.784 4.46955 102.125 4.46955 101.892 4.93998L100.289 8.18738L96.708 8.70749C96.1881 8.7831 95.9793 9.42436 96.3553 9.79148L98.9486 12.3196L98.3375 15.8858C98.2492 16.4026 98.79 16.7954 99.2543 16.5516L102.454 14.8697Z" fill="currentColor"/><path fillRule="evenodd" clipRule="evenodd" d="M12.4542 12.8697L15.6542 14.5516C16.1184 14.7954 16.6592 14.4026 16.571 13.8858L15.9599 10.3196L18.5532 7.79148C18.9292 7.42436 18.7203 6.7831 18.2005 6.70749L14.6194 6.18738L13.0164 2.93998C12.7836 2.46955 12.1249 2.46955 11.892 2.93998L10.289 6.18738L6.70801 6.70749C6.18814 6.7831 5.97926 7.42436 6.35529 7.79148L8.9486 10.3196L8.33748 13.8858C8.24924 14.4026 8.79002 14.7954 9.25425 14.5516L12.4542 12.8697Z" fill="currentColor"/><path fillRule="evenodd" clipRule="evenodd" d="M73.4542 6.86968L76.6542 8.55157C77.1184 8.79538 77.6592 8.40261 77.571 7.88577L76.9599 4.31959L79.5532 1.79148C79.9292 1.42436 79.7203 0.783103 79.2005 0.707491L75.6194 0.18738L74.0164 -3.06002C73.7836 -3.53045 73.1249 -3.53045 72.892 -3.06002L71.289 0.18738L67.708 0.707491C67.1881 0.783103 66.9793 1.42436 67.3553 1.79148L69.9486 4.31959L69.3375 7.88577C69.2492 8.40261 69.79 8.79538 70.2543 8.55157L73.4542 6.86968Z" fill="currentColor"/></svg>
              </div>
              <div className="theme-switch__circle-container">
                <div className="theme-switch__sun-moon-container">
                  <div className="theme-switch__moon">
                    <div className="theme-switch__spot"></div>
                    <div className="theme-switch__spot"></div>
                    <div className="theme-switch__spot"></div>
                  </div>
                </div>
              </div>
              <div className="theme-switch__clouds"></div>
            </div>
          </label>
          <a href="https://github.com/tyagism" target="_blank" rel="noopener noreferrer" className="btn-github" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg> GitHub
          </a>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="neu-card">
          <button
            className={`neu-btn neu-experiment ${currentView === 'new_experiment' ? 'active' : ''}`}
            onClick={() => setCurrentView('new_experiment')}
          >
            <FileText size={18} className="neu-icon" />
            <span>New Experiment</span>
          </button>
          <button
            className={`neu-btn neu-library ${currentView === 'library' ? 'active' : ''}`}
            onClick={() => setCurrentView('library')}
          >
            <BookOpen size={18} className="neu-icon" />
            <span>Literature Library</span>
          </button>
          <button
            className={`neu-btn neu-plans ${currentView === 'past_plans' ? 'active' : ''}`}
            onClick={() => setCurrentView('past_plans')}
          >
            <Clock size={18} className="neu-icon" />
            <span>Past Plans</span>
          </button>
          <button
            className={`neu-btn neu-insights ${currentView === 'insights' ? 'active' : ''}`}
            onClick={() => setCurrentView('insights')}
          >
            <BarChart3 size={18} className="neu-icon" />
            <span>Insights</span>
          </button>
          <button
            className={`neu-btn neu-settings ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentView('settings')}
          >
            <Settings size={18} className="neu-icon" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {currentView === 'new_experiment' && (
          <>
            <h1 className="section-title">Accelerate Your Discovery</h1>
            <p className="section-subtitle">
              Engineered for precision. Define your hypothesis and let VeloLabs orchestrate a high-fidelity, operationally realistic experiment protocol.
            </p>

            {/* Input Card */}
            <div className="search-orb-container" style={{ margin: '0 auto 32px auto', maxWidth: '100%' }}>
              <div className="gooey-background-layer">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
                <div className="blob-bridge"></div>
              </div>
              <div className="input-overlay" style={{ width: '100%', maxWidth: '600px' }}>
                <input
                  type="text"
                  className="modern-input"
                  placeholder="e.g., Supplementing C57BL/6 mice with Lactobacillus..."
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQC();
                  }}
                  disabled={loadingQC}
                />
                <button
                  className="search-icon-wrapper"
                  onClick={handleQC}
                  disabled={loadingQC || !hypothesis.trim()}
                >
                  {loadingQC ? <svg viewBox="0 0 24 24" className="spin search-icon"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg> : <svg viewBox="0 0 24 24" className="search-icon"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="white"/></svg>}
                </button>
              </div>
              <div className="focus-indicator"></div>
              <svg className="gooey-svg-filter">
                <filter id="enhanced-goo">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                  <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                  <feBlend in="SourceGraphic" in2="goo" />
                </filter>
              </svg>
            </div>

            {/* Global Errors */}
            {(qcError || planError) && (
              <div className="md-card slide-up" style={{ backgroundColor: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
                <AlertTriangle size={24} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>Validation Error</h3>
                  <p>{qcError || planError}</p>
                </div>
                <button className="icon-button" onClick={() => { setQcError(null); setPlanError(null); }} style={{ color: 'inherit' }}>
                  <XCircle size={20} />
                </button>
              </div>
            )}

            {/* Literature QC Result */}
            {qcResult && !plan && !qcError && !planError && (
              <div className="md-card slide-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px' }}>Literature QC Result</h2>
                  {renderQCStatus(qcResult.status)}
                </div>

                {qcResult.references.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '14px' }}>Found {qcResult.references.length} related publications:</p>
                    {qcResult.references.map((ref, idx) => (
                      <div key={idx} style={{ padding: '12px', border: '1px solid var(--md-sys-color-outline)', borderRadius: '8px', backgroundColor: 'var(--md-sys-color-background)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <a href={ref.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontWeight: 500, marginBottom: '4px', color: 'var(--md-sys-color-primary)' }}>
                            {ref.title}
                          </a>
                          <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>{ref.authors}</span>
                        </div>
                        <button
                          className="icon-button"
                          onClick={() => savePaper(ref)}
                          title={savedPapers.some(p => p.url === ref.url) ? "Saved" : "Save to Library"}
                        >
                          {savedPapers.some(p => p.url === ref.url) ? <CheckCircle2 size={20} style={{ color: 'green' }} /> : <Download size={20} />}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>No exact matches found. You are breaking new ground!</p>
                )}

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--md-sys-color-outline)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="md-button"
                    style={{ backgroundColor: 'var(--md-sys-color-tertiary)', color: 'var(--md-sys-color-on-tertiary)' }}
                    onClick={handleGeneratePlan}
                    disabled={loadingPlan}
                  >
                    {loadingPlan ? <Clock size={18} className="spin" /> : <Sparkles size={18} />}
                    {loadingPlan ? 'Generating Full Plan...' : 'Generate Experiment Plan'}
                  </button>
                </div>
              </div>
            )}

            {/* Generated Experiment Plan */}
            {plan && (
              <div className="md-card slide-up" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px', backgroundColor: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Sparkles size={24} />
                      <h2 style={{ fontSize: '24px' }}>Generated Experiment Plan</h2>
                    </div>
                    <button className="md-button" onClick={saveCurrentPlan} style={{ backgroundColor: 'var(--md-sys-color-surface)', color: 'var(--md-sys-color-on-surface)' }}>
                      <Save size={18} /> Save Plan
                    </button>
                  </div>
                  <p style={{ opacity: 0.8 }}>Ready for execution. Review and adjust parameters as needed.</p>
                </div>

                {/* Tabs */}
                <div className="tabs">
                  <button className={`tab ${activeTab === 'protocol' ? 'active' : ''}`} onClick={() => setActiveTab('protocol')}>
                    <Beaker size={18} /> Protocol
                  </button>
                  <button className={`tab ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>
                    <DollarSign size={18} /> Materials & Budget
                  </button>
                  <button className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
                    <Calendar size={18} /> Timeline
                  </button>
                </div>

                {/* Tab Content */}
                <div style={{ padding: '24px' }}>

                  {/* Protocol Tab */}
                  {activeTab === 'protocol' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {plan.protocol.map((step) => (
                        <div key={step.step_number} className="protocol-step">
                          <div className="step-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className="step-number">{step.step_number}</div>
                              <h3 style={{ fontSize: '18px', fontWeight: 500 }}>{step.title}</h3>
                            </div>
                            <span className="md-chip" style={{ backgroundColor: 'var(--md-sys-color-surface-variant)' }}>
                              <Clock size={14} /> {step.duration}
                            </span>
                          </div>

                          {editingStep === step.step_number ? (
                            <div style={{ marginTop: '12px' }}>
                              <textarea
                                className="md-input"
                                rows={3}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                              />
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="md-button outlined" onClick={() => setEditingStep(null)}>Cancel</button>
                                <button className="md-button" onClick={() => submitCorrection(step.step_number)}>
                                  <Save size={16} /> Save Correction
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <p style={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.6, flex: 1 }}>{step.description}</p>
                              <button
                                className="icon-button"
                                title="Correct this step (Trains the model)"
                                onClick={() => {
                                  setEditingStep(step.step_number);
                                  setEditValue(step.description);
                                }}
                              >
                                {feedbackSaved === step.step_number ? <Check size={18} color="green" /> : <Edit3 size={18} />}
                              </button>
                            </div>
                          )}
                          {feedbackSaved === step.step_number && (
                            <p style={{ color: 'var(--md-sys-color-primary)', fontSize: '12px', marginTop: '8px' }}>✓ Feedback captured to improve future plans.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Materials Tab */}
                  {activeTab === 'materials' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 500 }}>Required Materials & Supply Chain</h3>
                        <div className="md-chip" style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', fontSize: '16px' }}>
                          Estimated Total: {formatCurrency(plan.total_budget)}
                        </div>
                      </div>

                      <div className="table-container">
                        <table className="md-table">
                          <thead>
                            <tr>
                              <th>Item Name</th>
                              <th>Supplier</th>
                              <th>Catalog #</th>
                              <th>Qty</th>
                              <th style={{ textAlign: 'right' }}>Est. Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plan.materials.map((item, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: 500 }}>{item.name}</td>
                                <td>{item.supplier}</td>
                                <td style={{ fontFamily: 'monospace' }}>{item.catalog_number}</td>
                                <td>{item.quantity}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.cost)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Timeline Tab */}
                  {activeTab === 'timeline' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Total Estimated Duration: <strong>{plan.timeline.reduce((acc, p) => acc + p.duration_weeks, 0)} weeks</strong></p>

                      <div className="timeline">
                        {plan.timeline.map((phase, idx) => (
                          <div key={idx} className="timeline-item">
                            <div className="timeline-marker">
                              <div className="timeline-dot"></div>
                              {idx !== plan.timeline.length - 1 && <div className="timeline-line"></div>}
                            </div>
                            <div className="timeline-content">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{phase.phase_name}</h3>
                                <span className="md-chip">{phase.duration_weeks} {phase.duration_weeks === 1 ? 'week' : 'weeks'}</span>
                              </div>
                              <p style={{ color: 'var(--md-sys-color-on-surface-variant)', marginTop: '8px' }}>{phase.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </>
        )}

        {currentView === 'library' && (
          <div className="slide-up">
            <h1 className="section-title">Literature Library</h1>
            <p className="section-subtitle">
              Your saved publications and reference materials.
            </p>
            {savedPapers.length > 0 ? (
              <div className="modern-list-container">
                {savedPapers.map((ref, idx) => (
                  <div key={idx} className="modern-list-card accent-library" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="modern-item-title">
                        {ref.title}
                      </a>
                      <div className="modern-item-meta">
                        <span>{ref.authors}</span>
                      </div>
                    </div>
                    <button className="icon-button" onClick={() => removePaper(ref.url)} title="Remove from Library">
                      <Trash2 size={22} style={{ color: 'var(--md-sys-color-error)' }} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-container">
                <BookOpen size={64} className="empty-state-icon" />
                <h3 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: 600 }}>Your library is empty</h3>
                <p style={{ maxWidth: '400px', margin: '0 auto', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Save papers from your QC results to access them here later.
                </p>
              </div>
            )}
          </div>
        )}

        {currentView === 'past_plans' && (
          <div className="slide-up">
            <h1 className="section-title">Past Plans</h1>
            <p className="section-subtitle">
              History of your generated experiment protocols.
            </p>
            {pastPlans.length > 0 ? (
              <div className="modern-list-container">
                {pastPlans.map((p) => (
                  <div key={p.id} className="modern-list-card accent-plans">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Calendar size={14} style={{ color: 'var(--md-sys-color-primary)' }} />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{p.date}</span>
                        </div>
                        <h3 className="modern-item-title" style={{ display: 'block', cursor: 'default' }}>{p.hypothesis}</h3>
                      </div>
                      <div className="modern-card-actions">
                        <button className="md-button" onClick={() => loadPlan(p.id)} style={{ padding: '8px 16px' }}>
                          <Clock size={16} /> Load
                        </button>
                        <button className="icon-button" onClick={() => removePlan(p.id)} title="Delete Plan">
                          <Trash2 size={22} style={{ color: 'var(--md-sys-color-error)' }} />
                        </button>
                      </div>
                    </div>
                    <div className="modern-item-meta">
                      <span className="md-chip" style={{ backgroundColor: 'var(--md-sys-color-surface-variant)', borderRadius: '8px' }}>
                        <Sparkles size={14} /> {p.plan.protocol.length} Steps
                      </span>
                      <span className="md-chip" style={{ backgroundColor: 'var(--md-sys-color-surface-variant)', borderRadius: '8px' }}>
                        <DollarSign size={14} /> {p.plan.materials.length} Materials
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-container">
                <Clock size={64} className="empty-state-icon" />
                <h3 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: 600 }}>No past plans found</h3>
                <p style={{ maxWidth: '400px', margin: '0 auto', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Generate your first experiment plan to see it here.
                </p>
              </div>
            )}
          </div>
        )}

        {currentView === 'insights' && (
          <div className="slide-up">
            <h1 className="section-title">Research Insights</h1>
            <p className="section-subtitle">
              Comprehensive analytics on your research trajectory, efficiency, and project metrics.
            </p>

            <div className="dashboard-grid">
              {/* Summary Stats */}
              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-title">Global Efficiency</span>
                  <Activity size={20} className="neu-insights" />
                </div>
                <div className="stat-value">92.4%</div>
                <div className="stat-label">Success Rate</div>
                <div style={{ height: '60px', marginTop: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockTimelineData.slice(-4)}>
                      <Area type="monotone" dataKey="success" stroke="#a855f7" fill="#a855f7" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-title">Active Projects</span>
                  <TrendingUp size={20} className="neu-insights" />
                </div>
                <div className="stat-value">{pastPlans.length + 3}</div>
                <div className="stat-label">In Pipeline</div>
                <div style={{ height: '60px', marginTop: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockTimelineData.slice(-4)}>
                      <Bar dataKey="plans" fill="#87cfff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-title">Avg. Plan Cost</span>
                  <PieIcon size={20} className="neu-insights" />
                </div>
                <div className="stat-value">{formatCurrency(2450)}</div>
                <div className="stat-label">Per Experiment</div>
                <div style={{ height: '60px', marginTop: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockTimelineData}>
                      <Line type="monotone" dataKey="plans" stroke="#d9a04a" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="dashboard-grid" style={{ marginTop: '24px' }}>
              {/* Detailed Charts */}
              <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                <div className="chart-header">
                  <span className="chart-title">Research Velocity & Milestone Completion</span>
                </div>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockTimelineData}>
                      <defs>
                        <linearGradient id="colorPlans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--md-sys-color-primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--md-sys-color-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--md-sys-color-surface)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
                        itemStyle={{ color: 'var(--md-sys-color-primary)' }}
                      />
                      <Area type="monotone" dataKey="plans" stroke="var(--md-sys-color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorPlans)" />
                      <Area type="monotone" dataKey="success" stroke="#a855f7" strokeWidth={2} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-title">Budget Allocation</span>
                </div>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockCostData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {mockCostData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="dashboard-grid" style={{ marginTop: '24px' }}>
              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-title">Study Sample Size Distribution</span>
                </div>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockSampleSizeData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 12}} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                      <Bar dataKey="count" fill="#2aa198" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                <div className="chart-header">
                  <span className="chart-title">Failure Rate Analysis (By Phase)</span>
                </div>
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center', height: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <div className="stat-label" style={{ marginBottom: '16px' }}>Protocol Complexity vs Error Margin</div>
                    <div style={{ height: '180px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockTimelineData}>
                          <Line type="stepAfter" dataKey="plans" stroke="#ffb4ab" strokeWidth={2} dot={true} />
                          <Line type="stepAfter" dataKey="success" stroke="#2aa198" strokeWidth={2} dot={true} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div style={{ width: '200px', textAlign: 'center' }}>
                    <div className="stat-value" style={{ color: '#ffb4ab' }}>7.6%</div>
                    <div className="stat-label">Critical Failure Rate</div>
                    <p style={{ fontSize: '12px', marginTop: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Primarily occurring in Logistics & Reagent acquisition phases.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'settings' && (
          <div className="slide-up">
            <h1 className="section-title">Settings</h1>
            <p className="section-subtitle">
              Manage your application preferences and defaults.
            </p>
            <div className="modern-list-card">
              <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Pricing & Currency</h3>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px', color: 'var(--md-sys-color-on-surface)' }}>
                Display Currency
              </label>
              <div className="radio-group" style={{ marginBottom: '16px' }}>
                {['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'].map((curr) => (
                  <div className="radio-option" key={curr}>
                    <input 
                      type="radio" 
                      id={`currency-${curr}`} 
                      name="currency" 
                      value={curr}
                      checked={currency === curr}
                      onChange={(e) => setCurrency(e.target.value)}
                    />
                    <label className="radio-label" htmlFor={`currency-${curr}`}>
                      {curr}
                    </label>
                  </div>
                ))}
                <div className="slider"></div>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '8px' }}>
                All material costs and total budgets will be displayed in {currency}. Rates are updated live.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
