export class GamificationEngine {
    constructor(analyticsEngine) {
        this.analytics = analyticsEngine;
        this.initializeGamificationData();
        this.loadUserPreferences();
    }
    
    initializeGamificationData() {
        const existingData = this.analytics.data;
        
        if (!existingData.gamification) {
            existingData.gamification = {
                dailyGoals: {
                    consistencyMinutes: 20,
                    clarityGoalAdaptive: true,
                    challengeGoalAdaptive: true
                },
                weeklyGoals: {
                    targetDays: 5,
                    currentWeekStart: this.getWeekStart(new Date()),
                    currentWeekCompletedDays: [],
                    weeklyStreak: 0,
                    streakFreezes: 3,
                    currentWeekTotalMinutes: 0,
                    currentWeekTotalSessions: 0,
                    currentWeekTargetMinutes: 140, // 20 minutes * 7 days
                    longestWeeklyStreak: 0,
                    weeklyGoalsCompletedTotal: 0,
                    lastWeekCompletedDays: [],
                    perfectWeeks: 0,
                    streakFreezeUsed: false
                },
                rings: {
                    today: this.getTodayDateString(),
                    consistency: { progress: 0, goal: 20, completed: false, current: 0 },
                    clarity: { progress: 0, goal: 0.75, completed: false, current: 0 },
                    challenge: { progress: 0, goal: 50, completed: false, current: 0 }
                },
                badges: [],
                listeningStrain: {
                    dailyScore: 0,
                    sessions: [],
                    today: this.getTodayDateString()
                },
                soundGarden: {
                    plants: [],
                    waterReserve: 0,
                    centralTree: { level: 1, lastGrowth: new Date().toISOString() },
                    butterflies: [],
                    pathStones: 0,
                    lastSeasonChange: null,
                    gardenPlacements: this.generateGardenPlacements()
                },
                userPreferences: {
                    dailyGoalMinutes: 20,
                    weeklyTargetDays: 5,
                    weeklyGoalType: 'days',
                    weeklyTargetMinutes: 140,
                    weeklyTargetSessions: 5
                }
            };
            
            this.analytics.data = existingData;
            this.analytics.saveData();
        }
    }
    
    loadUserPreferences() {
        const preferences = localStorage.getItem('hearing_app_preferences');
        if (preferences) {
            const parsed = JSON.parse(preferences);
            Object.assign(this.analytics.data.gamification.userPreferences, parsed);
            // Update daily consistency goal based on preferences
            this.analytics.data.gamification.dailyGoals.consistencyMinutes = this.analytics.data.gamification.userPreferences.dailyGoalMinutes;
            this.analytics.data.gamification.weeklyGoals.targetDays = this.analytics.data.gamification.userPreferences.weeklyTargetDays;
        }
    }
    
    updateRings() {
        const today = this.getTodayDateString();
        const rings = this.analytics.data.gamification.rings;
        
        if (rings.today !== today) {
            rings.today = today;
            rings.consistency = { progress: 0, goal: this.analytics.data.gamification.dailyGoals.consistencyMinutes, completed: false, current: 0 };
            rings.clarity = { progress: 0, goal: this.calculateClarityGoal(), completed: false, current: 0 };
            rings.challenge = { progress: 0, goal: this.calculateChallengeGoal(), completed: false, current: 0 };
        }
        
        this.updateConsistencyRing();
        this.updateClarityRing();
        this.updateChallengeRing();
        
        if (rings.consistency.completed && rings.clarity.completed && rings.challenge.completed) {
            this.unlockBadge('perfect_day');
        }
        
        this.analytics.saveData();
    }
    
    updateConsistencyRing() {
        const today = this.getTodayDateString();
        const todayEvents = this.analytics.data.events.filter(e => 
            e.timestamp.startsWith(today) && e.type === 'EXERCISE_COMPLETED'
        );
        
        const totalMinutesToday = todayEvents.reduce((sum, event) => {
            return sum + (event.payload.durationMs / (1000 * 60));
        }, 0);
        
        const goal = this.analytics.data.gamification.rings.consistency.goal;
        const progress = Math.min(1.0, totalMinutesToday / goal);
        
        this.analytics.data.gamification.rings.consistency.progress = progress;
        this.analytics.data.gamification.rings.consistency.current = totalMinutesToday;
        this.analytics.data.gamification.rings.consistency.completed = progress >= 1.0;
    }
    
    updateClarityRing() {
        const today = this.getTodayDateString();
        const todayEvents = this.analytics.data.events.filter(e => 
            e.timestamp.startsWith(today) && e.type === 'EXERCISE_COMPLETED'
        );
        
        if (todayEvents.length === 0) {
            this.analytics.data.gamification.rings.clarity.progress = 0;
            this.analytics.data.gamification.rings.clarity.current = 0;
            return;
        }
        
        let weightedAccuracySum = 0;
        let weightSum = 0;
        
        todayEvents.forEach(event => {
            const accuracy = event.payload.score;
            const difficultyWeight = this.calculateDifficultyWeight(
                event.payload.activity,
                event.payload.noise
            );
            
            weightedAccuracySum += accuracy * difficultyWeight;
            weightSum += difficultyWeight;
        });
        
        const dailyAccuracy = weightSum > 0 ? weightedAccuracySum / weightSum : 0;
        const goal = this.analytics.data.gamification.rings.clarity.goal;
        const progress = Math.min(1.0, dailyAccuracy / goal);
        
        this.analytics.data.gamification.rings.clarity.progress = progress;
        this.analytics.data.gamification.rings.clarity.current = dailyAccuracy;
        this.analytics.data.gamification.rings.clarity.completed = progress >= 1.0;
    }
    
    updateChallengeRing() {
        const today = this.getTodayDateString();
        const todayEvents = this.analytics.data.events.filter(e => 
            e.timestamp.startsWith(today) && e.type === 'EXERCISE_COMPLETED'
        );
        
        const totalChallengePoints = todayEvents.reduce((sum, event) => {
            const duration = event.payload.durationMs / (1000 * 60); // Convert to minutes
            const challengeMultiplier = this.calculateChallengeMultiplier(
                event.payload.activity,
                event.payload.noise
            );
            
            return sum + (duration * challengeMultiplier);
        }, 0);
        
        const goal = this.analytics.data.gamification.rings.challenge.goal;
        const progress = Math.min(1.0, totalChallengePoints / goal);
        
        this.analytics.data.gamification.rings.challenge.progress = progress;
        this.analytics.data.gamification.rings.challenge.current = totalChallengePoints;
        this.analytics.data.gamification.rings.challenge.completed = progress >= 1.0;
    }
    
    calculateDifficultyWeight(activity, noise) {
        const exerciseWeights = {
            'keywords': 1.0,
            'sentences': 1.2,
            'stories': 1.5,
            'scenarios': 1.4
        };
        
        const noiseWeights = {
            'quiet': 1.0,
            'easy': 1.1,
            'medium': 1.3,
            'hard': 1.5
        };
        
        return (exerciseWeights[activity.toLowerCase()] || 1.0) * (noiseWeights[noise.toLowerCase()] || 1.0);
    }
    
    calculateChallengeMultiplier(activity, noise) {
        const noiseMultipliers = {
            'quiet': 1.0,
            'easy': 1.5,
            'medium': 2.0,
            'hard': 2.5
        };
        
        const complexityMultipliers = {
            'keywords': 1.0,
            'sentences': 1.3,
            'stories': 1.6,
            'scenarios': 1.5
        };
        
        return (noiseMultipliers[noise.toLowerCase()] || 1.0) * (complexityMultipliers[activity.toLowerCase()] || 1.0);
    }
    
    calculateClarityGoal() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
        const recentEvents = this.analytics.data.events.filter(e => 
            e.type === 'EXERCISE_COMPLETED' && e.timestamp >= sevenDaysAgo
        );
        
        if (recentEvents.length === 0) {
            return 0.70; // Default 70% for new users
        }
        
        const avgAccuracy = recentEvents.reduce((sum, e) => sum + e.payload.score, 0) / recentEvents.length;
        const adaptiveGoal = Math.min(0.95, Math.max(0.50, avgAccuracy * 1.05)); // 5% improvement, capped at 95%, floor at 50%
        
        return adaptiveGoal;
    }
    
    calculateChallengeGoal() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
        const recentEvents = this.analytics.data.events.filter(e => 
            e.type === 'EXERCISE_COMPLETED' && e.timestamp >= sevenDaysAgo
        );
        
        if (recentEvents.length === 0) {
            return 50; // Default 50 points for new users
        }
        
        const dailyTotals = {};
        recentEvents.forEach(event => {
            const day = event.timestamp.substring(0, 10);
            const duration = event.payload.durationMs / (1000 * 60);
            const multiplier = this.calculateChallengeMultiplier(event.payload.activity, event.payload.noise);
            
            if (!dailyTotals[day]) dailyTotals[day] = 0;
            dailyTotals[day] += duration * multiplier;
        });
        
        const avgDailyChallengePoints = Object.values(dailyTotals).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(dailyTotals).length);
        const adaptiveGoal = Math.max(25, avgDailyChallengePoints * 1.10); // 10% improvement, minimum 25 points
        
        return adaptiveGoal;
    }
    
    calculateListeningStrain(sessionData) {
        const { durationMs, activity, noise, score } = sessionData;
        const sessionDurationMinutes = durationMs / (1000 * 60);
        
        const noiseMultiplier = {
            'quiet': 1.0,
            'easy': 1.2,
            'medium': 1.6,
            'hard': 2.2
        }[noise.toLowerCase()] || 1.0;
        
        const complexityMultiplier = {
            'keywords': 1.0,
            'sentences': 1.3,
            'stories': 1.6,
            'scenarios': 1.5
        }[activity.toLowerCase()] || 1.0;
        
        const performanceFactor = 1 + (1 - score); // Ranges from 1.0 (at 100%) to 2.0 (at 0%)
        
        const sessionStrain = sessionDurationMinutes * noiseMultiplier * complexityMultiplier * performanceFactor;
        
        return sessionStrain;
    }
    
    updateListeningStrain(sessionData) {
        const strain = this.calculateListeningStrain(sessionData);
        const today = this.getTodayDateString();
        
        if (this.analytics.data.gamification.listeningStrain.today !== today) {
            this.analytics.data.gamification.listeningStrain.dailyScore = 0;
            this.analytics.data.gamification.listeningStrain.sessions = [];
            this.analytics.data.gamification.listeningStrain.today = today;
        }
        
        this.analytics.data.gamification.listeningStrain.dailyScore += strain;
        this.analytics.data.gamification.listeningStrain.sessions.push({
            timestamp: new Date().toISOString(),
            strain: strain,
            activity: sessionData.activity,
            duration: sessionData.durationMs / (1000 * 60)
        });
    }
    
    getListeningStrainFeedback() {
        const dailyStrain = this.analytics.data.gamification.listeningStrain.dailyScore;
        
        if (dailyStrain === 0) {
            return { level: 'none', message: "Ready to start your hearing practice!", color: 'text-gray-600' };
        } else if (dailyStrain < 50) {
            return { level: 'low', message: "You're having a gentle practice day. Great work building consistency!", color: 'text-green-600' };
        } else if (dailyStrain < 100) {
            return { level: 'moderate', message: "You're putting in solid effort today. Your brain is working hard!", color: 'text-blue-600' };
        } else if (dailyStrain < 150) {
            return { level: 'high', message: "Wow! You're really challenging yourself today. That's how improvement happens.", color: 'text-orange-600' };
        } else {
            return { level: 'intense', message: "Your effort today has been incredible. Consider taking a gentler session next to help your brain recover.", color: 'text-red-600' };
        }
    }
    
    unlockBadge(badgeId) {
        if (this.analytics.data.gamification.badges.includes(badgeId)) {
            return false;
        }
        
        const badge = this.getBadgeDefinition(badgeId);
        if (!badge) return false;
        
        this.analytics.data.gamification.badges.push(badgeId);
        
        this.analytics.trackEvent('BADGE_UNLOCKED', {
            badgeId: badgeId,
            badgeName: badge.name,
            category: badge.category
        });
        
        this.showBadgeCelebration(badge);
        
        return true;
    }
    
    getBadgeDefinition(badgeId) {
        const badges = {
            'first_steps': {
                name: 'First Steps',
                message: "You've taken the first step on your new hearing journey. We're here with you!",
                category: 'Onboarding',
                icon: '👣'
            },
            'goal_setter': {
                name: 'Goal Setter',
                message: "A goal is the first step to success. You're on your way!",
                category: 'Onboarding',
                icon: '🎯'
            },
            'consistent_week': {
                name: 'Consistent Week',
                message: "One week down! That consistency is how you build lasting progress. Amazing work.",
                category: 'Consistency',
                icon: '🗺️'
            },
            'noise_navigator': {
                name: 'Noise Navigator',
                message: "You faced the noise and came out on top! That's a huge milestone.",
                category: 'Challenge',
                icon: '🎧'
            },
            'clarity_champion': {
                name: 'Clarity Champion',
                message: "Your focus is paying off. Three days of clear listening is fantastic progress!",
                category: 'Performance',
                icon: '🌟'
            },
            'perfect_day': {
                name: 'Perfect Day',
                message: "Consistency, Clarity, and Challenge—you mastered them all today. Incredible effort!",
                category: 'Milestone',
                icon: '🏆'
            },
            'monthly_milestone': {
                name: 'Monthly Milestone',
                message: "An entire month of dedication. Look how far you've come. Be proud of this achievement.",
                category: 'Consistency',
                icon: '📅'
            },
            
            // Clinical Badge System - Dedication Category
            'streak_bronze': {
                name: 'Practice Streak',
                message: 'Three days of consistent practice! You\'re building the foundation for a strong rehabilitation habit.',
                category: 'Dedication',
                icon: '🔥',
                tier: 'bronze'
            },
            'streak_silver': {
                name: 'Weekly Warrior',
                message: 'One week of consistent practice is a significant milestone. This dedication builds the foundation for clearer hearing.',
                category: 'Dedication', 
                icon: '🔥',
                tier: 'silver'
            },
            'streak_gold': {
                name: 'Habit Master',
                message: 'Twenty-one days of dedication! You\'ve established a powerful rehabilitation habit that will serve you well.',
                category: 'Dedication',
                icon: '🔥',
                tier: 'gold'
            },
            'committed_bronze': {
                name: 'Committed Learner',
                message: 'Ten sessions completed! Your commitment to practice is building neural pathways for better hearing.',
                category: 'Dedication',
                icon: '📚',
                tier: 'bronze'
            },
            'committed_silver': {
                name: 'Dedicated Practitioner', 
                message: 'Fifty sessions is a remarkable achievement! Your persistence is rewiring your brain for improved sound processing.',
                category: 'Dedication',
                icon: '📚',
                tier: 'silver'
            },
            'committed_gold': {
                name: 'Rehabilitation Champion',
                message: 'One hundred sessions! You\'ve demonstrated extraordinary commitment to your hearing journey.',
                category: 'Dedication',
                icon: '📚',
                tier: 'gold'
            },
            
            // Clinical Badge System - Advancement Category
            'level_up': {
                name: 'Level Up',
                message: 'Moving to a new challenge level takes courage. By pushing your boundaries, you are actively training your hearing for more complex listening situations.',
                category: 'Advancement',
                icon: '⬆️'
            },
            'explorer_keywords': {
                name: 'Keyword Explorer',
                message: 'You\'ve explored keyword training! This focused practice helps sharpen your ability to catch important words in conversations.',
                category: 'Advancement',
                icon: '🔍'
            },
            'explorer_sentences': {
                name: 'Sentence Navigator',
                message: 'Sentence practice unlocked! You\'re training your brain to process complete thoughts and natural speech patterns.',
                category: 'Advancement',
                icon: '📝'
            },
            'explorer_stories': {
                name: 'Story Adventurer',
                message: 'Stories are complex listening challenges! You\'re building skills for following extended conversations and narratives.',
                category: 'Advancement',
                icon: '📖'
            },
            'explorer_scenarios': {
                name: 'Real-World Ready',
                message: 'You\'ve entered real-world training! These scenarios prepare you for actual conversations in everyday situations.',
                category: 'Advancement',
                icon: '🌍'
            },
            
            // Clinical Badge System - Precision Category
            'perfect_score': {
                name: 'Perfect Score',
                message: 'A perfect score! Your focused listening and neural adaptation are clearly paying off.',
                category: 'Precision',
                icon: '💯'
            },
            'personal_best': {
                name: 'Personal Best',
                message: 'You\'ve surpassed your previous best! This shows your brain is adapting and building new pathways for sound.',
                category: 'Precision',
                icon: '🎯'
            },
            'sharp_bronze': {
                name: 'Sharp Listener',
                message: 'Consistently sharp listening! You\'re developing reliable accuracy in your hearing practice.',
                category: 'Precision',
                icon: '👂',
                tier: 'bronze'
            },
            'sharp_silver': {
                name: 'Precise Listener',
                message: 'Excellent precision! Your consistent high accuracy shows remarkable progress in sound discrimination.',
                category: 'Precision',
                icon: '👂',
                tier: 'silver'
            },
            'sharp_gold': {
                name: 'Master Listener',
                message: 'Outstanding precision! You\'ve achieved master-level consistency in your hearing exercises.',
                category: 'Precision',
                icon: '👂',
                tier: 'gold'
            },
            
            // Weekly Goals System Badges
            'monthly_consistency': {
                name: 'Monthly Consistency',
                message: 'Four weeks of meeting your weekly goals! This sustained effort is building lasting hearing improvement.',
                category: 'Weekly Goals',
                icon: '📅'
            },
            'quarterly_consistency': {
                name: 'Quarterly Champion',
                message: 'Twelve weeks of weekly goal success! Your dedication over three months is truly exceptional.',
                category: 'Weekly Goals',
                icon: '🏆'
            }
        };
        
        return badges[badgeId];
    }
    
    checkForBadgeUnlocks() {
        this.checkFirstStepsBadge();
        this.checkConsistentWeekBadge();
        this.checkNoiseNavigatorBadge();
        this.checkClarityChampionBadge();
        this.checkMonthlyMilestoneBadge();
        
        this.checkStreakBadges();
        this.checkCommittedBadges();
        this.checkAdvancementBadges();
        this.checkPrecisionBadges();
    }
    
    checkFirstStepsBadge() {
        const completedExercises = this.analytics.data.events.filter(e => e.type === 'EXERCISE_COMPLETED');
        if (completedExercises.length >= 1) {
            this.unlockBadge('first_steps');
        }
    }
    
    checkConsistentWeekBadge() {
        const currentWeek = this.analytics.data.gamification.weeklyGoals;
        if (currentWeek.currentWeekCompletedDays.length >= currentWeek.targetDays) {
            this.unlockBadge('consistent_week');
        }
    }
    
    checkNoiseNavigatorBadge() {
        const hardNoiseEvents = this.analytics.data.events.filter(e => 
            e.type === 'EXERCISE_COMPLETED' && e.payload.noise === 'hard'
        );
        if (hardNoiseEvents.length >= 1) {
            this.unlockBadge('noise_navigator');
        }
    }
    
    checkClarityChampionBadge() {
        const last3Days = [];
        for (let i = 0; i < 3; i++) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            last3Days.push(date.toISOString().substring(0, 10));
        }
        
        const clarityRingCompleted = this.analytics.data.gamification.rings.clarity.completed;
        if (clarityRingCompleted) {
            this.unlockBadge('clarity_champion');
        }
    }
    
    checkMonthlyMilestoneBadge() {
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const monthlyEvents = this.analytics.data.events.filter(e => 
            e.type === 'EXERCISE_COMPLETED' && e.timestamp >= oneMonthAgo
        );
        
        const uniqueDays = new Set(monthlyEvents.map(e => e.timestamp.substring(0, 10)));
        if (uniqueDays.size >= 20) {
            this.unlockBadge('monthly_milestone');
        }
    }
    
    checkStreakBadges() {
        const currentStreak = this.getCurrentStreak();
        
        if (currentStreak >= 3 && !this.analytics.data.gamification.badges.includes('streak_bronze')) {
            this.unlockBadge('streak_bronze');
        }
        if (currentStreak >= 7 && !this.analytics.data.gamification.badges.includes('streak_silver')) {
            this.unlockBadge('streak_silver');
        }
        if (currentStreak >= 21 && !this.analytics.data.gamification.badges.includes('streak_gold')) {
            this.unlockBadge('streak_gold');
        }
    }
    
    checkCommittedBadges() {
        const totalSessions = this.analytics.data.events.filter(e => e.type === 'EXERCISE_COMPLETED').length;
        
        if (totalSessions >= 10 && !this.analytics.data.gamification.badges.includes('committed_bronze')) {
            this.unlockBadge('committed_bronze');
        }
        if (totalSessions >= 50 && !this.analytics.data.gamification.badges.includes('committed_silver')) {
            this.unlockBadge('committed_silver');
        }
        if (totalSessions >= 100 && !this.analytics.data.gamification.badges.includes('committed_gold')) {
            this.unlockBadge('committed_gold');
        }
    }
    
    checkAdvancementBadges() {
        const events = this.analytics.data.events;
        
        const levelUpEvents = events.filter(e => 
            e.type === 'EXERCISE_COMPLETED' && 
            (e.payload.noise === 'medium' || e.payload.noise === 'hard')
        );
        if (levelUpEvents.length >= 1 && !this.analytics.data.gamification.badges.includes('level_up')) {
            this.unlockBadge('level_up');
        }
        
        const activityTypes = ['keywords', 'sentences', 'stories', 'scenarios'];
        const badgeMap = {
            'keywords': 'explorer_keywords',
            'sentences': 'explorer_sentences', 
            'stories': 'explorer_stories',
            'scenarios': 'explorer_scenarios'
        };
        
        activityTypes.forEach(activity => {
            const hasActivity = events.some(e => 
                e.type === 'EXERCISE_COMPLETED' && e.payload.activity === activity
            );
            const badgeId = badgeMap[activity];
            if (hasActivity && !this.analytics.data.gamification.badges.includes(badgeId)) {
                this.unlockBadge(badgeId);
            }
        });
    }
    
    checkPrecisionBadges() {
        const events = this.analytics.data.events.filter(e => e.type === 'EXERCISE_COMPLETED');
        
        const perfectScores = events.filter(e => e.payload.score === 1.0);
        if (perfectScores.length >= 1 && !this.analytics.data.gamification.badges.includes('perfect_score')) {
            this.unlockBadge('perfect_score');
        }
        
        if (events.length >= 2) {
            const recentEvent = events[events.length - 1];
            const previousBest = Math.max(...events.slice(0, -1).map(e => e.payload.score || 0));
            if (recentEvent.payload.score > previousBest && !this.analytics.data.gamification.badges.includes('personal_best')) {
                this.unlockBadge('personal_best');
            }
        }
        
        if (events.length >= 10) {
            const recent10 = events.slice(-10);
            const avgAccuracy = recent10.reduce((sum, e) => sum + (e.payload.score || 0), 0) / recent10.length;
            
            if (avgAccuracy > 0.80 && !this.analytics.data.gamification.badges.includes('sharp_bronze')) {
                this.unlockBadge('sharp_bronze');
            }
            if (avgAccuracy > 0.85 && !this.analytics.data.gamification.badges.includes('sharp_silver')) {
                this.unlockBadge('sharp_silver');
            }
            if (avgAccuracy > 0.90 && !this.analytics.data.gamification.badges.includes('sharp_gold')) {
                this.unlockBadge('sharp_gold');
            }
        }
    }
    
    showBadgeCelebration(badge) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        const tierColors = {
            'bronze': 'text-orange-600 border-orange-200 bg-orange-50',
            'silver': 'text-gray-600 border-gray-300 bg-gray-50', 
            'gold': 'text-yellow-600 border-yellow-300 bg-yellow-50'
        };
        
        const tierDisplay = badge.tier ? `
            <div class="inline-block px-3 py-1 rounded-full text-xs font-medium border ${tierColors[badge.tier]} mb-2">
                ${badge.tier.toUpperCase()} ACHIEVEMENT
            </div>
        ` : '';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-bounce">
                <div class="text-6xl mb-4">${badge.icon}</div>
                ${tierDisplay}
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Achievement Unlocked!</h2>
                <h3 class="text-xl font-semibold text-blue-600 mb-4">${badge.name}</h3>
                <p class="text-gray-600 mb-6">${badge.message}</p>
                <div class="text-xs text-gray-500 mb-4">${badge.category} Progress</div>
                <button onclick="this.parentElement.parentElement.remove()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                    Continue
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 12000);
    }
    
    getTodayDateString() {
        return new Date().toISOString().substring(0, 10);
    }
    
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday being start of week in some locales, here we want Monday
        const weekStart = new Date(d.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        return weekStart.toISOString().substring(0, 10);
    }
    
    onExerciseCompleted(sessionData) {
        this.updateListeningStrain(sessionData);
        this.updateRings();
        this.updateWeeklyGoals(sessionData);
        this.checkForBadgeUnlocks();
        
        this.analytics.saveData();
    }
    
    updateWeeklyGoals(sessionData) {
        const today = this.getTodayDateString();
        const currentWeekStart = this.getWeekStart(new Date());
        const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
        
        if (weeklyGoals.currentWeekStart !== currentWeekStart) {
            this.rolloverWeek();
        }
        
        if (!weeklyGoals.currentWeekCompletedDays.includes(today)) {
            weeklyGoals.currentWeekCompletedDays.push(today);
            
            if (weeklyGoals.currentWeekCompletedDays.length >= weeklyGoals.targetDays) {
                this.onWeeklyGoalAchieved();
            }
        }
        
        this.updateWeeklyTotals(sessionData);
    }
    
    rolloverWeek() {
        const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
        const newWeekStart = this.getWeekStart(new Date());
        
        const lastWeekGoalMet = weeklyGoals.currentWeekCompletedDays.length >= weeklyGoals.targetDays;
        
        if (lastWeekGoalMet) {
            weeklyGoals.weeklyStreak += 1;
            this.celebrateWeeklyStreak(weeklyGoals.weeklyStreak);
        } else {
            if (weeklyGoals.streakFreezes > 0 && weeklyGoals.streakFreezeUsed) { // Only consume freeze if it was used that week
                weeklyGoals.streakFreezes--;
                weeklyGoals.streakFreezeUsed = false; 
                this.showStreakFreezeUsed();
            } else {
                weeklyGoals.weeklyStreak = 0; 
            }
        }
        
        weeklyGoals.currentWeekStart = newWeekStart;
        weeklyGoals.currentWeekCompletedDays = [];
        weeklyGoals.currentWeekTotalMinutes = 0;
        weeklyGoals.currentWeekTotalSessions = 0;
        weeklyGoals.streakFreezeUsed = false;
    }
    
    updateWeeklyTotals(sessionData) {
        const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
        
        weeklyGoals.currentWeekTotalSessions = (weeklyGoals.currentWeekTotalSessions || 0) + 1;
        
        const sessionMinutes = (sessionData.durationMs || 0) / (1000 * 60);
        weeklyGoals.currentWeekTotalMinutes = (weeklyGoals.currentWeekTotalMinutes || 0) + sessionMinutes;
        
        this.checkAdditionalWeeklyGoals();
    }
    
    checkAdditionalWeeklyGoals() {
        const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
        const preferences = this.analytics.data.gamification.userPreferences;
        
        if (preferences.weeklyGoalType === 'minutes' && preferences.weeklyTargetMinutes) {
            if (weeklyGoals.currentWeekTotalMinutes >= preferences.weeklyTargetMinutes) {
                this.onWeeklyGoalAchieved('minutes');
            }
        }
        
        if (preferences.weeklyGoalType === 'sessions' && preferences.weeklyTargetSessions) {
            if (weeklyGoals.currentWeekTotalSessions >= preferences.weeklyTargetSessions) {
                this.onWeeklyGoalAchieved('sessions');
            }
        }
    }
    
    onWeeklyGoalAchieved(goalType = 'days') {
        const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
        // Only celebrate if not already achieved this week
        if (weeklyGoals.currentWeekGoalAchievedForType === goalType) return;

        weeklyGoals.currentWeekGoalAchievedForType = goalType; // Mark this goal type as achieved
        
        weeklyGoals.streakFreezes = Math.min(3, (weeklyGoals.streakFreezes || 0) + 1);
        
        this.showWeeklyGoalCelebration(goalType);
        
        this.checkWeeklyGoalBadges();
    }
    
    celebrateWeeklyStreak(streakCount) {
        const messages = {
            1: "One week down! You're building momentum.",
            2: "Two weeks of success! The habit is forming.",
            4: "One month of weekly goals! Outstanding commitment.",
            8: "Two months of consistency! You're truly dedicated.",
            12: "Three months of weekly success! Incredible achievement."
        };
        
        const message = messages[streakCount] || `${streakCount} weeks of meeting your goals! Amazing consistency.`;
        
        this.showStreakCelebration(streakCount, message);
    }
    
    showWeeklyGoalCelebration(goalType) {
        const goalMessages = {
            'days': 'Weekly practice goal achieved! Your consistency is building stronger hearing skills.',
            'minutes': 'Weekly time goal completed! Every minute of practice strengthens your neural pathways.',
            'sessions': 'Weekly session goal reached! Your dedication to practice is remarkable.'
        };
        
        const message = goalMessages[goalType] || goalMessages['days'];
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                <div class="text-6xl mb-4">🎯</div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Weekly Goal Achieved!</h2>
                <p class="text-gray-600 mb-4">${message}</p>
                <div class="text-sm text-blue-600 mb-4">+1 Streak Freeze earned</div>
                <button onclick="this.parentElement.parentElement.remove()" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                    Continue
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => {
            if (modal.parentElement) modal.remove();
        }, 8000);
    }
    
    showStreakCelebration(streakCount, message) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                <div class="text-6xl mb-4">🔥</div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">${streakCount} Week Streak!</h2>
                <p class="text-gray-600 mb-6">${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" class="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition">
                    Keep Going!
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => {
            if (modal.parentElement) modal.remove();
        }, 8000);
    }
    
    showStreakFreezeUsed() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                <div class="text-6xl mb-4">🛡️</div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Streak Protected!</h2>
                <p class="text-gray-600 mb-6">Your streak freeze kept your weekly goal streak alive. Life happens, and that's okay!</p>
                <button onclick="this.parentElement.parentElement.remove()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                    Back to Practice
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => {
            if (modal.parentElement) modal.remove();
        }, 8000);
    }
    
    checkWeeklyGoalBadges() {
        const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
        
        if (weeklyGoals.weeklyStreak >= 4 && !this.analytics.data.gamification.badges.includes('monthly_consistency')) {
            this.unlockBadge('monthly_consistency');
        }
        if (weeklyGoals.weeklyStreak >= 12 && !this.analytics.data.gamification.badges.includes('quarterly_consistency')) {
            this.unlockBadge('quarterly_consistency');
        }
    }
    
    setWeeklyGoal(goalType, targetValue) {
        const preferences = this.analytics.data.gamification.userPreferences;
        
        preferences.weeklyGoalType = goalType; 
        
        if (goalType === 'days') {
            this.analytics.data.gamification.weeklyGoals.targetDays = targetValue;
            preferences.weeklyTargetDays = targetValue;
            preferences.weeklyTargetMinutes = 0;
            preferences.weeklyTargetSessions = 0;
        } else if (goalType === 'minutes') {
            preferences.weeklyTargetMinutes = targetValue;
            preferences.weeklyTargetDays = 0;
            preferences.weeklyTargetSessions = 0;
        } else if (goalType === 'sessions') {
            preferences.weeklyTargetSessions = targetValue;
            preferences.weeklyTargetDays = 0;
            preferences.weeklyTargetMinutes = 0;
        }
        
        localStorage.setItem('hearing_app_preferences', JSON.stringify(preferences));
        this.analytics.saveData();
    }
    
    getWeeklyProgress() {
        const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
        const preferences = this.analytics.data.gamification.userPreferences;
        
        let currentTarget = 0;
        let currentProgress = 0;

        if (preferences.weeklyGoalType === 'days') {
            currentTarget = weeklyGoals.targetDays;
            currentProgress = weeklyGoals.currentWeekCompletedDays.length;
        } else if (preferences.weeklyGoalType === 'minutes') {
            currentTarget = preferences.weeklyTargetMinutes;
            currentProgress = Math.round(weeklyGoals.currentWeekTotalMinutes);
        } else if (preferences.weeklyGoalType === 'sessions') {
            currentTarget = preferences.weeklyTargetSessions;
            currentProgress = weeklyGoals.currentWeekTotalSessions;
        }

        return {
            goalType: preferences.weeklyGoalType || 'days',
            current: {
                days: weeklyGoals.currentWeekCompletedDays.length,
                minutes: Math.round(weeklyGoals.currentWeekTotalMinutes || 0),
                sessions: weeklyGoals.currentWeekTotalSessions || 0
            },
            target: {
                days: weeklyGoals.targetDays,
                minutes: preferences.weeklyTargetMinutes || 0,
                sessions: preferences.weeklyTargetSessions || 0
            },
            weeklyStreak: weeklyGoals.weeklyStreak || 0,
            streakFreezes: weeklyGoals.streakFreezes || 0,
            currentProgressValue: currentProgress,
            currentTargetValue: currentTarget
        };
    }
    
    getRingsStatus() {
        this.updateRings(); 
        return this.analytics.data.gamification.rings;
    }
    
    getUnlockedBadges() {
        return this.analytics.data.gamification.badges.map(badgeId => {
            return {
                id: badgeId,
                ...this.getBadgeDefinition(badgeId)
            };
        });
    }

    initializeSoundGarden() {
        if (!this.analytics.data.gamification.soundGarden) {
            this.analytics.data.gamification.soundGarden = {
                plants: [],
                waterReserve: 0,
                centralTree: { level: 1, lastGrowth: new Date().toISOString() },
                butterflies: [],
                pathStones: 0,
                lastSeasonChange: null,
                gardenPlacements: this.generateGardenPlacements()
            };
            this.analytics.saveData();
        }
    }

    generateGardenPlacements() {
        const placements = [];
        for (let row = 1; row <= 3; row++) {
            for (let col = 1; col <= 4; col++) {
                placements.push({
                    id: `${row}-${col}`,
                    x: 100 + (col * 120),
                    y: 150 + (row * 100),
                    occupied: false,
                    plantType: null
                });
            }
        }
        return placements;
    }

    updateSoundGarden(dailyStats) {
        const garden = this.analytics.data.gamification.soundGarden;
        
        let waterEarned = 0;
        const rings = this.getRingsStatus();
        
        if (rings.consistency.completed) waterEarned += 10;
        if (rings.clarity.completed) waterEarned += 10;  
        if (rings.challenge.completed) waterEarned += 10;
        
        if (dailyStats.practiceTime > 0) {
            waterEarned += 2;
        }
        
        garden.waterReserve += waterEarned;
        
        this.waterPlants(garden);
        this.checkForNewPlants(garden);
        this.updateButterflies(garden, rings);
        this.updateCentralTree(garden);
        
        this.analytics.saveData();
    }

    waterPlants(garden) {
        const thirstyPlants = garden.plants
            .filter(plant => plant.growthStage < 4)
            .sort((a, b) => a.currentWater - b.currentWater);
        
        for (const plant of thirstyPlants) {
            if (garden.waterReserve <= 0) break;
            
            const waterNeeded = Math.min(garden.waterReserve, 100 - plant.currentWater);
            plant.currentWater += waterNeeded;
            garden.waterReserve -= waterNeeded;
            
            if (plant.currentWater >= 100 && plant.growthStage < 4) {
                this.growPlant(plant);
            }
        }
    }

    growPlant(plant) {
        plant.growthStage++;
        plant.currentWater = 0;
        plant.lastGrowth = new Date().toISOString();
        
        this.triggerGrowthCelebration(plant);
    }

    checkForNewPlants(garden) {
        const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
        const currentStreak = weeklyGoals.weeklyStreak;
        
        const plantsEarned = Math.floor(currentStreak / 2);
        const currentPlantCount = garden.plants.length;
        
        if (plantsEarned > currentPlantCount) {
            this.addNewPlant(garden);
        }
    }

    addNewPlant(garden) {
        const plantTypes = [
            { type: 'sound_flower', name: 'Sound Flower', category: 'clarity' },
            { type: 'clarity_clover', name: 'Clarity Clover', category: 'clarity' },
            { type: 'pitch_tulip', name: 'Pitch Tulip', category: 'pitch' },
            { type: 'melody_rose', name: 'Melody Rose', category: 'challenge' },
            { type: 'harmony_lily', name: 'Harmony Lily', category: 'consistency' },
            { type: 'rhythm_daisy', name: 'Rhythm Daisy', category: 'challenge' }
        ];
        
        const emptyPlacement = garden.gardenPlacements.find(p => !p.occupied);
        if (!emptyPlacement) return;
        
        const plantType = plantTypes[garden.plants.length % plantTypes.length];
        
        const newPlant = {
            id: `plant_${Date.now()}`,
            type: plantType.type,
            name: plantType.name,
            category: plantType.category,
            growthStage: 0,
            currentWater: 0,
            placementId: emptyPlacement.id,
            unlockDate: new Date().toISOString()
        };
        
        garden.plants.push(newPlant);
        emptyPlacement.occupied = true;
        emptyPlacement.plantType = plantType.type;
        
        this.triggerNewPlantCelebration(newPlant);
    }

    updateButterflies(garden, rings) {
        garden.butterflies = garden.butterflies.filter(b => 
            new Date(b.date).toDateString() === new Date().toDateString()
        );
        
        const today = new Date().toDateString();
        
        if (rings.consistency.completed) {
            garden.butterflies.push({ type: 'blue', date: today, activity: 'consistency' });
        }
        if (rings.clarity.completed) {
            garden.butterflies.push({ type: 'yellow', date: today, activity: 'clarity' });
        }
        if (rings.challenge.completed) {
            garden.butterflies.push({ type: 'orange', date: today, activity: 'challenge' });
        }
        
        if (rings.consistency.completed && rings.clarity.completed && rings.challenge.completed) {
            garden.butterflies.push({ type: 'firefly', date: today, activity: 'perfect_day' });
        }
    }

    updateCentralTree(garden) {
        // Calculate months since first activity date, ensure analytics.data.firstSessionDate exists
        const firstSessionDate = this.analytics.data.summary.overall.firstActivityDate;
        if (!firstSessionDate) return; // Cannot grow tree without a start date

        const monthsSinceStart = Math.floor(
            (new Date().getTime() - new Date(firstSessionDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        
        if (monthsSinceStart > garden.centralTree.level - 1) {
            garden.centralTree.level = monthsSinceStart + 1;
            garden.centralTree.lastGrowth = new Date().toISOString();
            this.triggerTreeGrowthCelebration();
        }
    }

    getSoundGardenState() {
        const garden = this.analytics.data.gamification.soundGarden;
        if (!garden) return null;
        
        return {
            plants: garden.plants.map(plant => ({
                ...plant,
                progress: plant.currentWater / 100,
                stageDescription: this.getPlantStageDescription(plant.growthStage)
            })),
            waterReserve: garden.waterReserve,
            centralTree: garden.centralTree,
            butterflies: garden.butterflies,
            pathStones: garden.pathStones,
            seasonTheme: this.getCurrentSeasonTheme()
        };
    }

    getPlantStageDescription(stage) {
        const stages = ['Seed', 'Sprout', 'Budding', 'Blooming', 'Mature'];
        return stages[stage] || 'Seed';
    }

    getCurrentSeasonTheme() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    }

    triggerGrowthCelebration(plant) {
        // This will be handled by UI rendering in main.js, which calls updateSoundGardenDisplay
        console.log(`Plant ${plant.name} grew to stage ${plant.growthStage}!`);
    }

    triggerNewPlantCelebration(newPlant) {
        this.showCelebrationModal({
            title: '🌱 New Plant Unlocked!',
            message: `Your consistency has earned you a ${newPlant.name}! Keep practicing to help it grow.`, 
            type: 'garden_unlock'
        });
    }

    triggerTreeGrowthCelebration() {
        this.showCelebrationModal({
            title: '🌳 Your Tree is Growing!',
            message: 'Another month of dedication! Your central tree grows stronger, representing your lasting progress.',
            type: 'tree_growth'
        });
    }

    showCelebrationModal(options) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-bounce">
                <div class="text-6xl mb-4">${options.type === 'garden_unlock' ? '🌱' : '🌳'}</div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">${options.title}</h2>
                <p class="text-gray-600 mb-6">${options.message}</p>
                <button onclick="this.parentElement.parentElement.remove()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                    Awesome!
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 8000); // Display for 8 seconds
    }

    useStreakFreeze() {
        const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
        if (weeklyGoals.streakFreezes > 0 && !weeklyGoals.streakFreezeUsed) {
            weeklyGoals.streakFreezes--;
            weeklyGoals.streakFreezeUsed = true;
            this.analytics.saveData();
            this.analytics.trackEvent('STREAK_FREEZE_USED', { remaining: weeklyGoals.streakFreezes });
            return true;
        }
        return false;
    }

    getWeeklyGoalsStatus() {
        const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
        const preferences = this.analytics.data.gamification.userPreferences;

        const status = [];

        // Days goal
        if (preferences.weeklyGoalType === 'days') {
            status.push({
                type: 'Practice Days',
                current: weeklyGoals.currentWeekCompletedDays.length,
                target: weeklyGoals.targetDays,
                completed: weeklyGoals.currentWeekCompletedDays.length >= weeklyGoals.targetDays
            });
        }

        // Minutes goal
        if (preferences.weeklyGoalType === 'minutes' && preferences.weeklyTargetMinutes > 0) {
            status.push({
                type: 'Practice Minutes',
                current: Math.round(weeklyGoals.currentWeekTotalMinutes),
                target: preferences.weeklyTargetMinutes,
                completed: weeklyGoals.currentWeekTotalMinutes >= preferences.weeklyTargetMinutes
            });
        }

        // Sessions goal
        if (preferences.weeklyGoalType === 'sessions' && preferences.weeklyTargetSessions > 0) {
            status.push({
                type: 'Practice Sessions',
                current: weeklyGoals.currentWeekTotalSessions,
                target: preferences.weeklyTargetSessions,
                completed: weeklyGoals.currentWeekTotalSessions >= preferences.weeklyTargetSessions
            });
        }

        return status;
    }
}