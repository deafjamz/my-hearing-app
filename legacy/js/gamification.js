        export class GamificationEngine {
            constructor(analyticsEngine) {
                this.analytics = analyticsEngine;
                this.initializeGamificationData();
                this.loadUserPreferences();
            }
            
            initializeGamificationData() {
                const existingData = this.analytics.data;
                
                // Add gamification data to analytics structure if not present
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
                            consistency: { progress: 0, goal: 20, completed: false },
                            clarity: { progress: 0, goal: 0.75, completed: false },
                            challenge: { progress: 0, goal: 50, completed: false }
                        },
                        badges: [],
                        listeningStrain: {
                            dailyScore: 0,
                            sessions: []
                        },
                        soundGarden: {
                            elements: [],
                            lastUpdated: new Date().toISOString()
                        }
                    };
                    
                    // Save updated data
                    this.analytics.data = existingData;
                    analyticsStorage.setData(existingData);
                }
            }
            
            loadUserPreferences() {
                // Allow users to customize their daily goals
                const preferences = localStorage.getItem('hearing_app_preferences');
                if (preferences) {
                    const parsed = JSON.parse(preferences);
                    if (parsed.dailyGoalMinutes) {
                        this.analytics.data.gamification.dailyGoals.consistencyMinutes = parsed.dailyGoalMinutes;
                    }
                    if (parsed.weeklyTargetDays) {
                        this.analytics.data.gamification.weeklyGoals.targetDays = parsed.weeklyTargetDays;
                    }
                }
            }
            
            // === CI RINGS SYSTEM ===
            
            updateRings() {
                const today = this.getTodayDateString();
                const rings = this.analytics.data.gamification.rings;
                
                // Reset rings if it's a new day
                if (rings.today !== today) {
                    rings.today = today;
                    rings.consistency = { progress: 0, goal: this.analytics.data.gamification.dailyGoals.consistencyMinutes, completed: false };
                    rings.clarity = { progress: 0, goal: this.calculateClarityGoal(), completed: false };
                    rings.challenge = { progress: 0, goal: this.calculateChallengeGoal(), completed: false };
                }
                
                // Update each ring
                this.updateConsistencyRing();
                this.updateClarityRing();
                this.updateChallengeRing();
                
                // Check for perfect day achievement
                if (rings.consistency.completed && rings.clarity.completed && rings.challenge.completed) {
                    this.unlockBadge('perfect_day');
                }
                
                // Save updated data
                analyticsStorage.setData(this.analytics.data);
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
                this.analytics.data.gamification.rings.consistency.completed = progress >= 1.0;
            }
            
            updateClarityRing() {
                const today = this.getTodayDateString();
                const todayEvents = this.analytics.data.events.filter(e => 
                    e.timestamp.startsWith(today) && e.type === 'EXERCISE_COMPLETED'
                );
                
                if (todayEvents.length === 0) {
                    this.analytics.data.gamification.rings.clarity.progress = 0;
                    return;
                }
                
                // Calculate weighted accuracy
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
                // Calculate adaptive goal based on last 7 days
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
                // Calculate adaptive goal based on last 7 days
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
                const recentEvents = this.analytics.data.events.filter(e => 
                    e.type === 'EXERCISE_COMPLETED' && e.timestamp >= sevenDaysAgo
                );
                
                if (recentEvents.length === 0) {
                    return 50; // Default 50 points for new users
                }
                
                // Calculate average daily challenge points
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
            
            // === LISTENING STRAIN ALGORITHM ===
            
            calculateListeningStrain(sessionData) {
                const { durationMs, activity, noise, score } = sessionData;
                const sessionDurationMinutes = durationMs / (1000 * 60);
                
                // Get multipliers
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
                
                // Performance factor increases strain as accuracy drops
                const performanceFactor = 1 + (1 - score); // Ranges from 1.0 (at 100%) to 2.0 (at 0%)
                
                const sessionStrain = sessionDurationMinutes * noiseMultiplier * complexityMultiplier * performanceFactor;
                
                return sessionStrain;
            }
            
            updateListeningStrain(sessionData) {
                const strain = this.calculateListeningStrain(sessionData);
                const today = this.getTodayDateString();
                
                // Reset daily strain if new day
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
                    return { level: 'none', message: "Ready to start your hearing practice!" };
                } else if (dailyStrain < 50) {
                    return { level: 'low', message: "You're having a gentle practice day. Great work building consistency!" };
                } else if (dailyStrain < 100) {
                    return { level: 'moderate', message: "You're putting in solid effort today. Your brain is working hard!" };
                } else if (dailyStrain < 150) {
                    return { level: 'high', message: "Wow! You're really challenging yourself today. That's how improvement happens." };
                } else {
                    return { level: 'intense', message: "Your effort today has been incredible. Consider taking a gentler session next to help your brain recover." };
                }
            }
            
            // === BADGES SYSTEM ===
            
            unlockBadge(badgeId) {
                // Check if badge already unlocked
                if (this.analytics.data.gamification.badges.includes(badgeId)) {
                    return false;
                }
                
                const badge = this.getBadgeDefinition(badgeId);
                if (!badge) return false;
                
                // Add to unlocked badges
                this.analytics.data.gamification.badges.push(badgeId);
                
                // Track badge unlock event
                this.analytics.trackEvent('BADGE_UNLOCKED', {
                    badgeId: badgeId,
                    badgeName: badge.name,
                    category: badge.category
                });
                
                // Show celebration UI
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
                // Check various badge conditions
                this.checkFirstStepsBadge();
                this.checkConsistentWeekBadge();
                this.checkNoiseNavigatorBadge();
                this.checkClarityChampionBadge();
                this.checkMonthlyMilestoneBadge();
                
                // Check new clinical badge system
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
                // Check if user met their weekly goal
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
                // Check for 3 consecutive days of closing clarity ring
                const last3Days = [];
                for (let i = 0; i < 3; i++) {
                    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                    last3Days.push(date.toISOString().substring(0, 10));
                }
                
                // This is a simplified check - in practice you'd want to store daily ring completion data
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
                
                // Count unique days
                const uniqueDays = new Set(monthlyEvents.map(e => e.timestamp.substring(0, 10)));
                if (uniqueDays.size >= 20) {
                    this.unlockBadge('monthly_milestone');
                }
            }
            
            // Clinical Badge System Checking Methods
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
                
                // Check for level up (harder difficulty)
                const levelUpEvents = events.filter(e => 
                    e.type === 'EXERCISE_COMPLETED' && 
                    (e.payload.noise === 'medium' || e.payload.noise === 'hard')
                );
                if (levelUpEvents.length >= 1 && !this.analytics.data.gamification.badges.includes('level_up')) {
                    this.unlockBadge('level_up');
                }
                
                // Check activity exploration badges
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
                
                // Check for perfect score
                const perfectScores = events.filter(e => e.payload.score === 1.0);
                if (perfectScores.length >= 1 && !this.analytics.data.gamification.badges.includes('perfect_score')) {
                    this.unlockBadge('perfect_score');
                }
                
                // Check for personal best (simplified - would need more sophisticated tracking in real implementation)
                if (events.length >= 2) {
                    const recentEvent = events[events.length - 1];
                    const previousBest = Math.max(...events.slice(0, -1).map(e => e.payload.score || 0));
                    if (recentEvent.payload.score > previousBest && !this.analytics.data.gamification.badges.includes('personal_best')) {
                        this.unlockBadge('personal_best');
                    }
                }
                
                // Check accuracy badges - get recent 10 sessions average
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
                // Create a modal to celebrate the badge unlock
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                
                // Determine tier display
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
                
                // Auto-remove after 12 seconds (slightly longer for reading the clinical message)
                setTimeout(() => {
                    if (modal.parentElement) {
                        modal.remove();
                    }
                }, 12000);
            }
            
            // === UTILITY FUNCTIONS ===
            
            getTodayDateString() {
                return new Date().toISOString().substring(0, 10);
            }
            
            getWeekStart(date) {
                const start = new Date(date);
                const day = start.getDay();
                const diff = start.getDate() - day; // Adjust to start on Sunday
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                return start.toISOString().substring(0, 10);
            }
            
            // Main update function - call this after each exercise completion
            onExerciseCompleted(sessionData) {
                this.updateListeningStrain(sessionData);
                this.updateRings();
                this.updateWeeklyGoals(sessionData);
                this.checkForBadgeUnlocks();
                
                // Save all changes
                analyticsStorage.setData(this.analytics.data);
            }
            
            // === WEEKLY GOALS SYSTEM ===
            
            updateWeeklyGoals(sessionData) {
                const today = this.getTodayDateString();
                const currentWeekStart = this.getWeekStart(new Date());
                const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
                
                // Check if we need to roll over to a new week
                if (weeklyGoals.currentWeekStart !== currentWeekStart) {
                    this.rolloverWeek();
                }
                
                // Add today to completed days if not already added
                if (!weeklyGoals.currentWeekCompletedDays.includes(today)) {
                    weeklyGoals.currentWeekCompletedDays.push(today);
                    
                    // Check if weekly goal is achieved
                    if (weeklyGoals.currentWeekCompletedDays.length >= weeklyGoals.targetDays) {
                        this.onWeeklyGoalAchieved();
                    }
                }
                
                // Update weekly totals for different goal types
                this.updateWeeklyTotals(sessionData);
            }
            
            rolloverWeek() {
                const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
                const newWeekStart = this.getWeekStart(new Date());
                
                // Check if last week's goal was met for streak tracking
                const lastWeekGoalMet = weeklyGoals.currentWeekCompletedDays.length >= weeklyGoals.targetDays;
                
                if (lastWeekGoalMet) {
                    weeklyGoals.weeklyStreak += 1;
                    this.celebrateWeeklyStreak(weeklyGoals.weeklyStreak);
                } else {
                    // Check for streak freeze usage
                    if (weeklyGoals.streakFreezes > 0 && weeklyGoals.useStreakFreeze) {
                        weeklyGoals.streakFreezes -= 1;
                        weeklyGoals.useStreakFreeze = false; // Reset flag
                        // Don't break streak, just use a freeze
                        this.showStreakFreezeUsed();
                    } else {
                        weeklyGoals.weeklyStreak = 0; // Reset streak
                    }
                }
                
                // Start new week
                weeklyGoals.currentWeekStart = newWeekStart;
                weeklyGoals.currentWeekCompletedDays = [];
                weeklyGoals.currentWeekTotalMinutes = 0;
                weeklyGoals.currentWeekTotalSessions = 0;
            }
            
            updateWeeklyTotals(sessionData) {
                const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
                
                // Update session count
                weeklyGoals.currentWeekTotalSessions = (weeklyGoals.currentWeekTotalSessions || 0) + 1;
                
                // Update total minutes
                const sessionMinutes = (sessionData.durationMs || 0) / (1000 * 60);
                weeklyGoals.currentWeekTotalMinutes = (weeklyGoals.currentWeekTotalMinutes || 0) + sessionMinutes;
                
                // Check additional goal types
                this.checkAdditionalWeeklyGoals();
            }
            
            checkAdditionalWeeklyGoals() {
                const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
                const preferences = this.analytics.data.gamification.userPreferences;
                
                // Check minutes-based goal
                if (preferences.weeklyGoalType === 'minutes' && preferences.weeklyTargetMinutes) {
                    if (weeklyGoals.currentWeekTotalMinutes >= preferences.weeklyTargetMinutes) {
                        this.onWeeklyGoalAchieved('minutes');
                    }
                }
                
                // Check sessions-based goal  
                if (preferences.weeklyGoalType === 'sessions' && preferences.weeklyTargetSessions) {
                    if (weeklyGoals.currentWeekTotalSessions >= preferences.weeklyTargetSessions) {
                        this.onWeeklyGoalAchieved('sessions');
                    }
                }
            }
            
            onWeeklyGoalAchieved(goalType = 'days') {
                // Prevent duplicate celebrations
                const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
                if (weeklyGoals.currentWeekGoalAchieved) return;
                
                weeklyGoals.currentWeekGoalAchieved = true;
                
                // Award streak freeze for goal achievement
                weeklyGoals.streakFreezes = Math.min(3, (weeklyGoals.streakFreezes || 0) + 1);
                
                // Show celebration
                this.showWeeklyGoalCelebration(goalType);
                
                // Check for weekly goal badges
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
                
                // Create celebration modal
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
                
                // Weekly streak badges
                if (weeklyGoals.weeklyStreak >= 4 && !this.analytics.data.gamification.badges.includes('monthly_consistency')) {
                    this.unlockBadge('monthly_consistency');
                }
                if (weeklyGoals.weeklyStreak >= 12 && !this.analytics.data.gamification.badges.includes('quarterly_consistency')) {
                    this.unlockBadge('quarterly_consistency');
                }
            }
            
            // User customization methods
            setWeeklyGoal(goalType, targetValue) {
                const preferences = this.analytics.data.gamification.userPreferences;
                
                preferences.weeklyGoalType = goalType; // 'days', 'minutes', 'sessions'
                
                if (goalType === 'days') {
                    this.analytics.data.gamification.weeklyGoals.targetDays = targetValue;
                } else if (goalType === 'minutes') {
                    preferences.weeklyTargetMinutes = targetValue;
                } else if (goalType === 'sessions') {
                    preferences.weeklyTargetSessions = targetValue;
                }
                
                analyticsStorage.setData(this.analytics.data);
            }
            
            getWeeklyProgress() {
                const weeklyGoals = this.analytics.data.gamification.weeklyGoals;
                const preferences = this.analytics.data.gamification.userPreferences;
                
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
                    streakFreezes: weeklyGoals.streakFreezes || 0
                };
            }
            
            // Get current rings status for UI display
            getRingsStatus() {
                this.updateRings(); // Ensure current
                return this.analytics.data.gamification.rings;
            }
            
            // Get badges for display
            getUnlockedBadges() {
                return this.analytics.data.gamification.badges.map(badgeId => {
                    return {
                        id: badgeId,
                        ...this.getBadgeDefinition(badgeId)
                    };
                });
            }

            // Sound Garden System
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
                const currentStreak = weeklyGoals.currentStreak;
                
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
                const monthsSinceStart = Math.floor(
                    (new Date() - new Date(this.analytics.data.firstSessionDate)) / (1000 * 60 * 60 * 24 * 30)
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
                setTimeout(() => {
                    this.updateSoundGardenDisplay?.();
                }, 100);
            }

            triggerNewPlantCelebration(plant) {
                this.showCelebrationModal({
                    title: '🌱 New Plant Unlocked!',
                    message: `Your consistency has earned you a ${plant.name}! Keep practicing to help it grow.`,
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
        }
        
        // Initialize gamification engine
