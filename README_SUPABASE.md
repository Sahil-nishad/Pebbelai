# Migrating ResumeAI to Supabase

To completely remove `localStorage` and migrate your Logins and Resumes to your live Supabase database, you need to replace two specific sections of code in your **`src/App.jsx`** file.

I have already updated your `src/supabaseClient.js` with the needed authentication helpers.

***

### Step 1: Add the Supabase Imports to the top of `App.jsx`

At the very top of `src/App.jsx`, find where `import { enhanceWithGroq... }` is, and add this underneath it:

```javascript
// Add these to line 10
import { 
  supabase, 
  signInUser, 
  signUpUser, 
  signOutUser, 
  signInWithGoogle,
  fetchUserResumes, 
  saveResumeToDB, 
  deleteResumeFromDB 
} from './supabaseClient';
```

***

### Step 2: Update the `LoginPage` component

Find your `LoginPage` function in `src/App.jsx`. Replace the **entire function** with this new Supabase-powered version:

```javascript
function LoginPage({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorStatus, setErrorStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorStatus('');
    setLoading(true);

    try {
      if (isRegistering) {
        const { data, error } = await signUpUser(email, password);
        if (error) throw error;
        alert("Success! Check your email to confirm the account, or sign in now.");
        setIsRegistering(false);
      } else {
        const { data, error } = await signInUser(email, password);
        if (error) throw error;
        // Tell main App.jsx you are logged in
        onLogin(data.user);
      }
    } catch (err) {
      setErrorStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button className="btn-icon back-btn" onClick={onBack}>
        <ArrowLeft size={18} /> Back
      </button>

      <div className="login-card">
        <div className="login-header">
          <div className="login-icon"><Lock size={32} /></div>
          <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
          <p>{isRegistering ? 'Start building your ATS-optimized resume' : 'Log in to access your resumes'}</p>
        </div>

        {errorStatus && (
          <div className="login-error flex-row" style={{ color: 'red', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
            <AlertCircle size={16} /> <span>{errorStatus}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="you@example.com" 
              className="input" 
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="input" 
              minLength={6}
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
            {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In')}
          </button>
          
          <div style={{ textAlign: 'center', margin: '16px 0', fontSize: '14px', color: '#666' }}>
            — OR —
          </div>

          <button 
            type="button" 
            className="btn-outline" 
            onClick={signInWithGoogle} 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 01-2.2 3.33v2.77h3.55c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.77c-.98.66-2.23 1.06-3.73 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
            <button className="btn-text" onClick={() => { setIsRegistering(!isRegistering); setErrorStatus(''); }}>
              {isRegistering ? 'Sign In' : 'Create One'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
```

***

### Step 3: Connect the Main `App` to Supabase

Find the main `function App() { ... }` (around line ~2640).
Replace the entire top setup variables (where `user` and `resumeHistory` are defined) with this:

```javascript
function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); 
  const [postLoginView, setPostLoginView] = useState('gallery');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [backendStatus, setBackendStatus] = useState({ running: false, groqConfigured: false });
  const [resumeHistory, setResumeHistory] = useState([]);
  const [builderDraft, setBuilderDraft] = useState(null);
  const [activeHistoryId, setActiveHistoryId] = useState(null);

  // 1. Setup Auth Listener & Load Data from Supabase
  useEffect(() => {
    // Check if user is already logged in securely
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadSupabaseResumes();
      }
    });

    // Listen for login/logout events dynamically
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadSupabaseResumes();
      } else {
        setUser(null);
        setResumeHistory([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch User Resumes directly from the Supabase Database
  const loadSupabaseResumes = async () => {
    const { data, error } = await fetchUserResumes();
    if (data && !error) {
      setResumeHistory(data);
    }
  };
```

### Step 4: Make the "Save" and "Delete" buttons talk to Supabase

Also inside `function App()`, find the `handleSaveResume` and `handleDeleteResume` functions and update them:

```javascript
  const handleSaveResume = async (item) => {
    // Save to Database
    if (user) {
      const { error } = await saveResumeToDB(item.id, item.templateId, item.formData, item.layoutSettings);
      if (error) {
        // Fallback or error handled here
        return;
      }
    }
    // Update local state instantly so the UI reflects it
    setResumeHistory(prev => {
      const exists = prev.some(r => r.id === item.id);
      if (exists) return prev.map(r => r.id === item.id ? item : r);
      return [item, ...prev].slice(0, 100);
    });
  };

  const handleDeleteResume = async (id) => {
    if (user) {
      const { error } = await deleteResumeFromDB(id);
      if (error) {
        return;
      }
    }
    setResumeHistory(prev => prev.filter(item => item.id !== id));
  };

  // If you have a logout function, make sure it calls Supabase!
  const handleLogout = async () => {
    await signOutUser();
    setView('landing');
  };
```

---

**That is all!** 
Once you apply these changes to your `App.jsx`, your application will successfully use Supabase for authentication and database management, completely replacing your local storage system!
