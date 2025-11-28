const ANALYTICS_STORAGE_KEY = 'cochlearRehabAnalytics';

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

    trackEvent(type, payload) {
        const event = {
            eventId: crypto.randomUUID ? crypto.randomUUID() : 'event-' + Date.now() + '-' + Math.random(),
            sessionId: this.currentSessionId,
            timestamp: new Date().toISOString(),
            type,
            payload
        };

        this.data.events.push(event);
        
        const currentSession = this.data.sessions.find(s => s.sessionId === this.currentSessionId);
        if(currentSession) currentSession.endTime = event.timestamp;

        this.updateSummary(event);

        analyticsStorage.setData(this.data);
        console.log("📊 Event tracked:", type, payload);
    }

    updateSummary(event) {
        this.data.summary.overall.lastActivityDate = event.timestamp;
        if (!this.data.summary.overall.firstActivityDate) {
            this.data.summary.overall.firstActivityDate = event.timestamp;
        }

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
                break;
        }
    }

    updateExerciseCompletionSummary(event) {
        const { activity, voice, noise, durationMs, score, itemsCorrect, itemsTotal } = event.payload;

        let summaryNode = this.data.summary.byActivity;
        
        if (!summaryNode[activity]) {
            summaryNode[activity] = { byVoice: {} };
        }
        
        if (!summaryNode[activity].byVoice[voice]) {
            summaryNode[activity].byVoice[voice] = { byNoise: {} };
        }
        
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

        const node = summaryNode[activity].byVoice[voice].byNoise[noise];
        node.completions += 1;
        node.totalTimeMs += durationMs;
        node.totalCorrect += itemsCorrect;
        node.totalItems += itemsTotal;
        node.bestScore = Math.max(node.bestScore, score);
        node.averageScore = node.totalItems > 0 ? node.totalCorrect / node.totalItems : 0;

        this.data.summary.overall.totalTimeMs += durationMs;
    }

    getCurrentSession() {
        return this.data.sessions.find(s => s.sessionId === this.currentSessionId);
    }

    getAccuracyTrend(activity = null, days = 30) {
        const trend = {};
        const now = new Date();
        const startDate = new Date(now.setDate(now.getDate() - days));

        const relevantEvents = this.data.events.filter(event =>
            event.type === 'EXERCISE_COMPLETED' &&
            (!activity || event.payload.activity === activity) &&
            new Date(event.timestamp) >= startDate
        );

        for (const event of relevantEvents) {
            const day = event.timestamp.substring(0, 10);
            trend[day] = trend[day] || { correct: 0, total: 0 };
            trend[day].correct += event.payload.itemsCorrect;
            trend[day].total += event.payload.itemsTotal;
        }

        return Object.entries(trend).map(([date, data]) => ({
            date,
            accuracy: data.total > 0 ? data.correct / data.total : 0
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

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

    saveData() {
        analyticsStorage.setData(this.data);
    }
}