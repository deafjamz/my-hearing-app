        const ANALYTICS_STORAGE_KEY = 'cochlearRehabAnalytics';

        // Analytics Storage Helper
        const analyticsStorage = {
            getData: () => {
                try {
                    const data = localStorage.getItem(ANALYTICS_STORAGE_KEY);
                    return data ? JSON.parse(data) : null;
                } catch (error) {
                    console.error("Error reading analytics from localStorage", error);
                    return null;
                }
            },
            setData: (data) => {
                try {
                    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data));
                } catch (error) {
                    console.error("Error writing analytics to localStorage. Data may be too large.", error);
                }
            }
        };

        // Main Analytics Engine
        export class AnalyticsEngine {
            constructor() {
                this.data = analyticsStorage.getData();
                if (!this.data) {
                    this.initializeData();
                }
                this.startNewSession();
                console.log("📊 Analytics Engine initialized");
            }

            initializeData() {
                this.data = {
                    version: "1.0.0",
                    user: { 
                        id: crypto.randomUUID ? crypto.randomUUID() : 'user-' + Date.now(), 
                        createdAt: new Date().toISOString() 
                    },
                    sessions: [],
                    events: [],
                    summary: { 
                        byActivity: {}, 
                        overall: {
                            totalTimeMs: 0,
                            totalSessions: 0,
                            totalExercises: 0,
                            firstActivityDate: null,
                            lastActivityDate: null
                        }
                    }
                };
                analyticsStorage.setData(this.data);
            }

            startNewSession() {
                const now = new Date();
                const lastSession = this.data.sessions[this.data.sessions.length - 1];
                // Start new session if no last session or if it's been over 30 mins
                if (!lastSession || (now - new Date(lastSession.endTime)) > 30 * 60 * 1000) {
                    this.currentSessionId = crypto.randomUUID ? crypto.randomUUID() : 'session-' + Date.now();
                    this.data.sessions.push({
                        sessionId: this.currentSessionId,
                        startTime: now.toISOString(),
                        endTime: now.toISOString()
                    });
                    this.data.summary.overall.totalSessions++;
                    analyticsStorage.setData(this.data);
                    console.log("📊 New session started:", this.currentSessionId);
                } else {
                    this.currentSessionId = lastSession.sessionId;
                    console.log("📊 Continuing session:", this.currentSessionId);
                }
            }

            // The primary method for all tracking
            trackEvent(type, payload) {
                const event = {
                    eventId: crypto.randomUUID ? crypto.randomUUID() : 'event-' + Date.now() + '-' + Math.random(),
                    sessionId: this.currentSessionId,
                    timestamp: new Date().toISOString(),
                    type,
                    payload
                };

                this.data.events.push(event);
                
                // Update session endTime
                const currentSession = this.data.sessions.find(s => s.sessionId === this.currentSessionId);
                if(currentSession) currentSession.endTime = event.timestamp;

                // Update summary based on event type
                this.updateSummary(event);

                analyticsStorage.setData(this.data);
                console.log("📊 Event tracked:", type, payload);
            }

            updateSummary(event) {
                // Update overall stats
                this.data.summary.overall.lastActivityDate = event.timestamp;
                if (!this.data.summary.overall.firstActivityDate) {
                    this.data.summary.overall.firstActivityDate = event.timestamp;
                }

                // Handle different event types
                switch(event.type) {
                    case 'EXERCISE_COMPLETED':
                        this.updateExerciseCompletionSummary(event);
                        break;
                    case 'EXERCISE_STARTED':
                        this.data.summary.overall.totalExercises++;
                        break;
                    case 'VOICE_CHANGED':
                    case 'NOISE_LEVEL_CHANGED':
                    case 'ACTIVITY_SELECTED':
                        // These are tracked in events but don't need summary updates
                        break;
                }
            }

            updateExerciseCompletionSummary(event) {
                const { activity, voice, noise, durationMs, score, itemsCorrect, itemsTotal } = event.payload;

                // Ensure path exists in summary object
                let summaryNode = this.data.summary.byActivity;
                
                // Create activity level
                if (!summaryNode[activity]) {
                    summaryNode[activity] = { byVoice: {} };
                }
                
                // Create voice level
                if (!summaryNode[activity].byVoice[voice]) {
                    summaryNode[activity].byVoice[voice] = { byNoise: {} };
                }
                
                // Create noise level
                if (!summaryNode[activity].byVoice[voice].byNoise[noise]) {
                    summaryNode[activity].byVoice[voice].byNoise[noise] = {
                        totalTimeMs: 0,
                        totalCorrect: 0,
                        totalItems: 0,
                        completions: 0,
                        bestScore: 0,
                        averageScore: 0
                    };
                }

                // Update the specific leaf node
                const node = summaryNode[activity].byVoice[voice].byNoise[noise];
                node.completions += 1;
                node.totalTimeMs += durationMs;
                node.totalCorrect += itemsCorrect;
                node.totalItems += itemsTotal;
                node.bestScore = Math.max(node.bestScore, score);
                node.averageScore = node.totalItems > 0 ? node.totalCorrect / node.totalItems : 0;

                // Update overall time
                this.data.summary.overall.totalTimeMs += durationMs;
            }

            // Get current session analytics
            getCurrentSession() {
                return this.data.sessions.find(s => s.sessionId === this.currentSessionId);
            }

            // Get accuracy trend for the last N days
            getAccuracyTrend(activity = null, days = 30) {
                const trend = {}; // { 'YYYY-MM-DD': { correct: 0, total: 0 } }
                const now = new Date();
                const startDate = new Date(now.setDate(now.getDate() - days));

                const relevantEvents = this.data.events.filter(event =>
                    event.type === 'EXERCISE_COMPLETED' &&
                    (!activity || event.payload.activity === activity) &&
                    new Date(event.timestamp) >= startDate
                );

                for (const event of relevantEvents) {
                    const day = event.timestamp.substring(0, 10); // 'YYYY-MM-DD'
                    trend[day] = trend[day] || { correct: 0, total: 0 };
                    trend[day].correct += event.payload.itemsCorrect;
                    trend[day].total += event.payload.itemsTotal;
                }

                // Convert to a chart-friendly format
                return Object.entries(trend).map(([date, data]) => ({
                    date,
                    accuracy: data.total > 0 ? data.correct / data.total : 0
                })).sort((a, b) => new Date(a.date) - new Date(b.date));
            }

            // Get overall statistics
            getOverallStats() {
                const totalSessions = this.data.sessions.length;
                const totalEvents = this.data.events.length;
                const completedExercises = this.data.events.filter(e => e.type === 'EXERCISE_COMPLETED').length;
                
                let totalCorrect = 0;
                let totalItems = 0;
                let totalTime = 0;
                
                this.data.events
                    .filter(e => e.type === 'EXERCISE_COMPLETED')
                    .forEach(e => {
                        totalCorrect += e.payload.itemsCorrect;
                        totalItems += e.payload.itemsTotal;
                        totalTime += e.payload.durationMs;
                    });

                return {
                    totalSessions,
                    totalEvents,
                    completedExercises,
                    overallAccuracy: totalItems > 0 ? totalCorrect / totalItems : 0,
                    totalTimeMs: totalTime,
                    averageSessionTime: totalSessions > 0 ? totalTime / totalSessions : 0
                };
            }

            // Export data as CSV
            exportToCSV() {
                const data = this.data.summary.byActivity;
                let csvContent = "data:text/csv;charset=utf-8,";
                csvContent += "Activity,Voice,Noise,Completions,Avg Accuracy,Best Score,Total Time (min),Avg Duration (s)\n";

                for (const activity in data) {
                    for (const voice in data[activity].byVoice) {
                        for (const noise in data[activity].byVoice[voice].byNoise) {
                            const node = data[activity].byVoice[voice].byNoise[noise];
                            const avgAccuracy = (node.averageScore * 100).toFixed(1);
                            const bestScore = (node.bestScore * 100).toFixed(1);
                            const totalTimeMin = (node.totalTimeMs / 60000).toFixed(1);
                            const avgDuration = node.completions > 0 ? (node.totalTimeMs / 1000 / node.completions).toFixed(1) : 'N/A';
                            
                            const row = [activity, voice, noise, node.completions, avgAccuracy + '%', bestScore + '%', totalTimeMin, avgDuration].join(",");
                            csvContent += row + "\r\n";
                        }
                    }
                }

                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "hearing_progress_report.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }

        // Initialize analytics engine
