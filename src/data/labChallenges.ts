import { LabChallenge } from "../types";

export const labChallenges: LabChallenge[] = [
  {
    id: "sql-injection",
    title: "SQL Injection in Raw Database Query",
    shortDescription: "Constructing raw database query strings with unescaped user inputs, enabling authentication bypass and full data leaks.",
    detailedDescription: "When user inputs are directly concatenated into SQL query strings rather than bound as parameters, the database engine executes strings as command statements. Attackers can provide specially crafted values that rewrite the entire database logic, letting them bypass password checks or drop tables.",
    category: "security",
    difficulty: "beginner",
    vulnerableCode: `// Express API endpoint constructing unsafe raw SQL query
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  
  // DANGER: Constructing queries via direct string concatenation
  const query = \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\`;
  console.log("Executing Query:", query);
  
  try {
    const users = await db.executeRaw(query);
    if (users.length > 0) {
      res.json({ success: true, user: users[0] });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});`,
    securedCode: `// Secure implementation using SQL Parameterized Queries (Prepared Statements)
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // SECURE: Inputs are passed separately as query parameters ($1, $2)
    // The database treats these values strictly as data, never executable SQL code
    const query = 'SELECT id, username, email, role FROM users WHERE username = $1 AND password = $2';
    const users = await db.query(query, [username, password]);
    
    if (users.length > 0) {
      res.json({ success: true, user: users[0] });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});`,
    exploitSteps: [
      "Type `' OR '1'='1` in the Username input field.",
      "Leave the Password field empty.",
      "Click 'Simulate Exploit' to execute.",
      "See how the resulting query evaluates to true for all records, logging you in as the Admin!"
    ]
  },
  {
    id: "xss-vulnerability",
    title: "Reflected XSS via Unescaped innerHTML",
    shortDescription: "Injecting unescaped text directly into component HTML, letting malicious scripts execute in user browser sessions.",
    detailedDescription: "Cross-Site Scripting (XSS) occurs when client-side frameworks render dynamic text as raw HTML using properties like dangerouslySetInnerHTML without proper sanitization. Attackers can craft query parameters or user profiles containing <script> or image onerror payloads to execute arbitrary scripts and steal session cookies.",
    category: "security",
    difficulty: "beginner",
    vulnerableCode: `import React from 'react';

// React Component displaying query search result
export function SearchResults({ searchQuery }) {
  // DANGER: Rendering raw user input as HTML without sanitization!
  // Any script tags or onerror attributes in searchQuery will execute.
  return (
    <div className="p-4 border rounded bg-slate-50">
      <h3 className="text-sm font-medium text-slate-500">Search Results</h3>
      <div 
        className="mt-2 text-lg font-semibold"
        dangerouslySetInnerHTML={{ __html: \`Results for: \${searchQuery}\` }} 
      />
    </div>
  );
}`,
    securedCode: `import React from 'react';
import DOMPurify from 'dompurify';

export function SearchResults({ searchQuery }) {
  // SECURE OPTION A: Render as plain text inside normal React children nodes.
  // React automatically escapes strings rendered inside tags, preventing script injection.
  return (
    <div className="p-4 border rounded bg-slate-50">
      <h3 className="text-sm font-medium text-slate-500">Search Results</h3>
      <div className="mt-2 text-lg font-semibold">
        Results for: <span className="text-primary">{searchQuery}</span>
      </div>
    </div>
  );
}

// SECURE OPTION B (If rich HTML rendering is absolutely required):
// Sanitize inputs using DOMPurify before rendering it via dangerouslySetInnerHTML
/*
export function RichSearchResults({ searchQuery }) {
  const sanitizedHTML = DOMPurify.sanitize(\`Results for: \${searchQuery}\`);
  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  );
}
*/`,
    exploitSteps: [
      "Type `<img src=x onerror=\"alert('Malicious Script Executed! Cookie Stolen: ' + document.cookie)\">` as the search term.",
      "Click 'Simulate Exploit'.",
      "Watch the image render, fail to load, trigger the onerror hook, and execute the script to read private documents!"
    ]
  },
  {
    id: "race-condition",
    title: "Async API Fetch Race Condition",
    shortDescription: "Failing to clean up or discard outdated async responses, causing slow requests to overwrite active page state.",
    detailedDescription: "When trigger events (like changing tabs or typing in search bars) fire in rapid succession, they initiate overlapping asynchronous network requests. Because network latency varies, a slow request triggered *first* may finish *last*, overwriting the state populated by a fast request triggered *second*, displaying wrong data.",
    category: "logic",
    difficulty: "intermediate",
    vulnerableCode: `import React, { useState, useEffect } from 'react';

export function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    // DANGER: Lacks cleanup logic. If user changes the tab quickly,
    // this response might arrive after the next user's response is already loaded.
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]);

  return (
    <div>
      {loading ? "Loading profile..." : \`Viewing Profile: \${user?.name}\`}
    </div>
  );
}`,
    securedCode: `import React, { useState, useEffect } from 'react';

export function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true; // Track if this specific fetch context is still valid
    setLoading(true);
    
    // SECURE: Use AbortController or local booleans to prevent state overwrites
    const controller = new AbortController();
    
    fetch(\`/api/users/\${userId}\`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (active) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
          setLoading(false);
        }
      });

    // Cleanup executes immediately when userId changes or component unmounts
    return () => {
      active = false;
      controller.abort(); // Cancel the actual network fetch safely
    };
  }, [userId]);

  return (
    <div>
      {loading ? "Loading profile..." : \`Viewing Profile: \${user?.name}\`}
    </div>
  );
}`,
    exploitSteps: [
      "Click 'Switch to Tab A (Slow Connection: 2000ms latency)' first.",
      "Quickly, click 'Switch to Tab B (Fast Connection: 400ms latency)'.",
      "Observe that Tab B finishes immediately. Then, 1.5s later, Tab A finishes and overrides Tab B's active view!",
      "You are left looking at Tab A's data while the interface highlights 'Tab B'!"
    ]
  },
  {
    id: "memory-leak",
    title: "Resource Memory Leak in Timers",
    shortDescription: "Forgetting to clear active intervals or listeners on component unmount, draining memory and crashing apps.",
    detailedDescription: "Any background timer (setInterval), subscription, or global DOM event listener established inside an effect continues running in background memory even after the component mounts/unmounts. Repeated unmounting creates duplicates of these background loops, causing memory consumption to climb exponentially and freezing the system.",
    category: "performance",
    difficulty: "intermediate",
    vulnerableCode: `import React, { useState, useEffect } from 'react';

export function MetricTracker() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // DANGER: Creating a background interval timer but never clearing it!
    // Every single time this component mounts, a new active timer is created.
    // When the component is unmounted, the old timer stays active in browser memory.
    setInterval(() => {
      console.log("Timer ticking for instance...");
      setCount(c => c + 1);
    }, 1000);
  }, []); // Empty dependency array

  return <div>Active Ticks: {count}</div>;
}`,
    securedCode: `import React, { useState, useEffect } from 'react';

export function MetricTracker() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // SECURE: Assign the interval reference ID to a constant
    const intervalId = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);

    // SECURE: Always return a cleanup function that disposes of the interval!
    return () => {
      console.log("Timer cleared successfully on component unmount.");
      clearInterval(intervalId);
    };
  }, []);

  return <div>Active Ticks: {count}</div>;
}`,
    exploitSteps: [
      "Click the 'Mount / Unmount Component' button repeatedly (e.g. 10 times).",
      "Look at the active ticks simulator count, and notice that the ticking process speed multiplies by 10x!",
      "See how CPU load spikes and background listeners leak into the console, simulating a slow browser page crash."
    ]
  },
  {
    id: "api-timeout",
    title: "Unchecked Async Timeout & Frozen UI",
    shortDescription: "Making async calls without catch hooks or response timeouts, resulting in infinite loading loops.",
    detailedDescription: "In real-world networks, queries can stall indefinitely due to poor signal, packet loss, or server load. Making network calls without setting explicit timeouts or catching exceptions leaves user interfaces frozen in an infinite spinner loop, with zero recovery action available.",
    category: "architecture",
    difficulty: "intermediate",
    vulnerableCode: `import React, { useState, useEffect } from 'react';

export function ReportDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // DANGER: No timeout configuration, and no catch block for errors!
    // If the network connection goes offline or the server hangs, 
    // the UI is permanently stuck showing the 'Loading' text with no retry option.
    fetch("/api/reports/heavy")
      .then(res => res.json())
      .then(result => setData(result));
  }, []);

  if (!data) {
    return <div className="loader">Loading reports, please wait...</div>;
  }

  return <ReportView data={data} />;
}`,
    securedCode: `import React, { useState, useEffect } from 'react';

export function ReportDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // SECURE: Implement helper that aborts fetch requests after set milliseconds
  const fetchWithTimeout = async (url, options = {}) => {
    const { timeout = 5000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  };

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout("/api/reports/heavy", { timeout: 3000 });
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      // AbortError is raised when the request exceeds our custom timeout limit
      if (err.name === 'AbortError') {
        setError("Network request timed out. Please try again.");
      } else {
        setError("Failed to fetch reports. Verify connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="mt-2 text-sm text-gray-500">Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50 text-center">
        <p className="text-red-700 font-medium">{error}</p>
        <button 
          onClick={loadReport}
          className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return <ReportView data={data} />;
}`,
    exploitSteps: [
      "Click 'Simulate Hanging Network' to mimic a broken API endpoint.",
      "See how the Vulnerable Component hangs on 'Loading reports...' forever, completely frozen.",
      "See how the Secure Component Aborts the stalled fetch after 3 seconds, displays a detailed error banner, and provides a fully interactive 'Retry Connection' button!"
    ]
  },
  {
    id: "jwt-bypass",
    title: "Broken JWT Session & Default Secret Bypass",
    shortDescription: "Using a hardcoded, weak developer secret key to sign session tokens, enabling users to forge admin accounts.",
    detailedDescription: "Websites often use JWTs (JSON Web Tokens) to securely track logged-in users. However, if the server signs these tokens with a default developer key (like 'secret123') instead of a secure key from a random environment variable, anyone can sign their own fake tokens, change their role to 'admin', and bypass entire API authorization walls.",
    category: "security",
    difficulty: "advanced",
    vulnerableCode: `import jwt from 'jsonwebtoken';

// DANGER: Using a hardcoded, static developer fallback secret key!
// Anyone can view this key in the source code, forge a custom token, 
// and grant themselves administrator credentials on the app.
const JWT_SECRET = "dev-secret-key-do-not-use-in-prod-123";

app.get("/api/admin/system-logs", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token missing" });
  }

  try {
    // Decodes the token using the vulnerable developer key
    const user = jwt.verify(token, JWT_SECRET);
    if (user.role === "admin") {
      res.json({ logs: ["SERVER_LOG: User root login succeeded", "PORT_CONNECT: Port 3000 online"] });
    } else {
      res.status(403).json({ error: "Requires administrator role" });
    }
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
});`,
    securedCode: `import jwt from 'jsonwebtoken';

app.get("/api/admin/system-logs", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token missing" });
  }

  // SECURE: Only retrieve JWT secret from safe Server Environment Variables
  const secureSecret = process.env.JWT_SECRET_KEY;
  
  // Guard clause against missing configuration or weak default fallbacks
  if (!secureSecret || secureSecret === "dev-secret-key-do-not-use-in-prod-123") {
    return res.status(500).json({ error: "Server authentication misconfiguration" });
  }

  try {
    // SECURE: Enforce verification checks and explicitly restrict expected algorithms
    const user = jwt.verify(token, secureSecret, {
      algorithms: ["HS256"],
      issuer: "auth.mysecureapp.com"
    });
    
    if (user.role === "admin") {
      res.json({ logs: ["SERVER_LOG: User root login succeeded", "PORT_CONNECT: Port 3000 online"] });
    } else {
      res.status(403).json({ error: "Requires administrator role" });
    }
  } catch (err) {
    res.status(403).json({ error: "Token signature validation failed" });
  }
});`,
    exploitSteps: [
      "View the hardcoded vulnerable JWT key ('dev-secret-key-do-not-use-in-prod-123').",
      "Click 'Forge Admin Token' to generate a simulated malicious token with payload `{ \"username\": \"hacker\", \"role\": \"admin\" }`.",
      "Click 'Send Exploit Request' to dispatch the forged token to the auth API.",
      "See how the server verifies it successfully using the weak dev key, giving you unauthorized access to critical system logs!"
    ]
  }
];
