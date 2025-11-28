import { friendlySetNames, sampleStories, enhancedStoryPOC, coffeeShopScenario } from './data.js';
import { AnalyticsEngine } from './analytics.js';
import { GamificationEngine } from './gamification.js';

const analytics = new AnalyticsEngine();
const gamification = new GamificationEngine(analytics);

const GITHUB_USERNAME = "deafjamz";
const GITHUB_REPO_NAME = "hearing-rehab-audio";
const AUDIO_CACHE_SIZE = 50;

let allData = { sentences: [], keywords: [], stories: sampleStories };

let processedQuestions = new Set();
let incorrectAnswerCount = 0;
let storyAudioPlayer = null;
let currentEnhancedStory = null;

let currentScenario = null;
let currentScenarioLevel = null;
let currentInteraction = null;
let currentInteractionIndex = 0;
let scenarioScore = 0;
let scenarioAudioPlayer = null;
const availableScenarios = [coffeeShopScenario];

let currentActivityType = '';
let currentLevelData = [];
let currentQuestionIndex = 0;
let score = 0;
let currentAudio = null;
let selectedVoice = 'sarah';

let currentStory = null;
let selectedCaptionLevel = 25;
let currentQuestion = null;

let practiceMode = 'quiet';
let noiseLevel = 'easy';
let backgroundNoiseAudio = null;

let adminQCMode = localStorage.getItem('adminQCMode') === 'true';
let qualityIssues = JSON.parse(localStorage.getItem('qualityIssues') || '[]');
let exerciseStartTimestamp = null;

let audioCache = new Map();

const noiseFiles = {
    easy: 'noise_files/cafe_light.m4a',
    medium: 'noise_files/office_moderate.m4a',
    hard: 'noise_files/street_busy.m4a'
};

function getAudioUrl(filename) {
    // Use local path for development/testing since files are present locally
    return `hearing-rehab-audio/${filename}`;
    // return `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO_NAME}/main/${filename}`;
}

function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    if (backgroundNoiseAudio) {
        backgroundNoiseAudio.pause();
        backgroundNoiseAudio.currentTime = 0;
    }
}

function loadBackgroundNoise(level) {
    return new Promise((resolve, reject) => {
        if (backgroundNoiseAudio) {
            backgroundNoiseAudio.pause();
            backgroundNoiseAudio = null;
        }

        const noiseUrl = getAudioUrl(noiseFiles[level]);
        console.log(`Loading background noise: ${level} from ${noiseUrl}`);
        backgroundNoiseAudio = new Audio(noiseUrl);
        backgroundNoiseAudio.loop = true;
        backgroundNoiseAudio.volume = getNoiseVolume(level);

        backgroundNoiseAudio.addEventListener('canplaythrough', () => {
            console.log(`Background noise loaded successfully: ${level}`);
            resolve();
        }, { once: true });
        backgroundNoiseAudio.addEventListener('error', (e) => {
            console.error(`Failed to load background noise: ${level}`, e);
            reject(e);
        }, { once: true });
        backgroundNoiseAudio.load();
    });
}

function getNoiseVolume(level) {
    switch(level) {
        case 'easy': return 0.15;
        case 'medium': return 0.25;
        case 'hard': return 0.35;
        default: return 0.15;
    }
}

function playAudioWithNoise(mainAudio) {
    return new Promise((resolve, reject) => {
        stopCurrentAudio();
        
        if (practiceMode === 'noise' && backgroundNoiseAudio) {
            backgroundNoiseAudio.currentTime = 0;
            backgroundNoiseAudio.play().catch(console.error);
            
            setTimeout(() => {
                mainAudio.currentTime = 0;
                mainAudio.play()
                    .then(() => {
                        mainAudio.addEventListener('ended', () => {
                            if (backgroundNoiseAudio) {
                                backgroundNoiseAudio.pause();
                            }
                            resolve();
                        }, { once: true });
                    })
                    .catch(reject);
            }, 200);
        } else {
            mainAudio.currentTime = 0;
            mainAudio.play()
                .then(() => {
                    mainAudio.addEventListener('ended', resolve, { once: true });
                })
                .catch(reject);
        }
    });
}

function randomizeStoryChoices(story) {
    const randomizedStory = { ...story };
    
    const correctAnswerText = story.choices[story.correctAnswer];
    
    const choicesWithIndices = story.choices.map((choice, index) => ({
        text: choice,
        originalIndex: index
    }));
    
    for (let i = choicesWithIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choicesWithIndices[i], choicesWithIndices[j]] = [choicesWithIndices[j], choicesWithIndices[i]];
    }
    
    randomizedStory.choices = choicesWithIndices.map(item => item.text);
    randomizedStory.correctAnswer = choicesWithIndices.findIndex(item => item.text === correctAnswerText);
    
    return randomizedStory;
}

function submitToGoogleForms(qualityIssue) {
    const baseUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdrZdSdORcvQkZm9A_ZWB3J4Q_XOY9HKKpD8GDQiyLEINqu2A/viewform";
    const params = new URLSearchParams({
        'usp': 'pp_url',
        'entry.2092258809': qualityIssue.audioFile,
        'entry.2027416117': qualityIssue.text,
        'entry.2104356900': qualityIssue.voice,
        'entry.1322911479': qualityIssue.activityType,
        'entry.2105236424': qualityIssue.set,
        'entry.64346061': qualityIssue.issueType,
        'entry.1007752238': qualityIssue.severity,
        'entry.215629918': qualityIssue.dateFlagged
    });
    const formUrl = baseUrl + '?' + params.toString();
    window.open(formUrl, '_blank');
    return true;
}

function toggleAdminQCMode() {
    adminQCMode = !adminQCMode;
    localStorage.setItem('adminQCMode', adminQCMode.toString());
    
    const qcIndicator = document.getElementById('qc-mode-indicator');
    const qcControls = document.getElementById('qc-controls');
    
    if (adminQCMode) {
        qcIndicator?.classList.remove('hidden');
        qcControls?.classList.remove('hidden');
        console.log('QC Mode ENABLED');
    } else {
        qcIndicator?.classList.add('hidden');
        qcControls?.classList.add('hidden');
        console.log('QC Mode DISABLED');
    }
}

function flagAudioQuality() {
    if (!currentLevelData[currentQuestionIndex]) return;
    
    const currentQuestion = currentLevelData[currentQuestionIndex];
    const issueType = document.getElementById('issue-type')?.value || 'unclear_pronunciation';
    
    const qualityIssue = {
        audioFile: currentQuestion.audioFilename || currentQuestion.AudioFilename || currentQuestion.audioFile || `${selectedVoice}_${currentActivityType}_${slugify(currentQuestion.Sentence1 || currentQuestion.Sentence || 'unknown')}.mp3`,
        text: currentQuestion.Sentence1 || currentQuestion.Sentence2 || currentQuestion.Sentence || currentQuestion.text || 'N/A',
        voice: selectedVoice,
        activityType: currentActivityType,
        set: currentQuestion.Set || currentQuestion.set || 'Unknown Set',
        issueType: issueType,
        severity: 'Medium',
        dateFlagged: new Date().toISOString(),
        sentToSheets: false,
        sentToForms: false
    };
    
    qualityIssues.push(qualityIssue);
    localStorage.setItem('qualityIssues', JSON.stringify(qualityIssues));
    console.log('Audio flagged:', qualityIssue);
    
    const flagBtn = document.getElementById('flag-audio-btn');
    const originalText = flagBtn.textContent;
    flagBtn.textContent = 'Flagged!';
    flagBtn.classList.add('bg-green-600');
    flagBtn.classList.remove('bg-red-600');
    
    setTimeout(() => {
        flagBtn.textContent = originalText;
        flagBtn.classList.remove('bg-green-600');
        flagBtn.classList.add('bg-red-600');
    }, 1500);
}

async function exportQualityData() {
    console.log('=== EXPORT START ===');
    const unsentIssues = qualityIssues.filter(issue => !issue.sentToSheets);
    console.log('Unsent issues:', unsentIssues.length);
    
    if (unsentIssues.length === 0) {
        const retryAll = confirm('No new issues to submit. Reset all and retry?');
        if (retryAll) {
            qualityIssues.forEach(issue => delete issue.sentToSheets);
            localStorage.setItem('qualityIssues', JSON.stringify(qualityIssues));
            return exportQualityData();
        }
        return;
    }
    
    const message = 'Export ' + unsentIssues.length + ' flagged audio issues directly to Google Sheets?';
    const confirmExport = confirm(message);
    
    if (confirmExport) {
        try {
            await submitToGoogleSheets(unsentIssues);
            unsentIssues.forEach(issue => issue.sentToSheets = true);
            localStorage.setItem('qualityIssues', JSON.stringify(qualityIssues));
            alert('✅ Successfully exported ' + unsentIssues.length + ' issues to Google Sheets!');
        } catch (error) {
            console.error('Export failed:', error);
            const options = 'Direct export failed. Choose fallback option:\n\n' +
                          'OK = Google Forms (opens tabs)\n' +
                          'Cancel = Download CSV file';
            const useForms = confirm(options);
            if (useForms) {
                await exportToForms(unsentIssues);
            } else {
                downloadQCDataAsCSV(unsentIssues);
            }
        }
    }
    console.log('=== EXPORT COMPLETE ===');
}

async function submitToGoogleSheets(issues) {
    console.log('Attempting Google Apps Script submission...');
    
    try {
        await submitViaGoogleAppsScript(issues);
        console.log('Apps Script submission succeeded!');
    } catch (error) {
        console.error('Apps Script submission failed:', error.message);
        throw error;
    }
}

function convertIssuesToCSV(issues) {
    const headers = ['Audio File', 'Text', 'Voice', 'Activity Type', 'Set', 'Issue Type', 'Severity', 'Date Flagged', 'Status'];
    const rows = [headers];
    
    issues.forEach(issue => {
        rows.push([
            issue.audioFile || 'N/A',
            issue.text || 'N/A', 
            issue.voice || 'sarah',
            issue.activityType || 'N/A',
            issue.set || 'N/A',
            issue.issueType || 'unclear_pronunciation',
            issue.severity || 'Medium',
            issue.dateFlagged || new Date().toISOString(),
            'New'
        ]);
    });
    
    return rows.map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n');
}

function downloadQCDataAsCSV(issues) {
    const csvContent = convertIssuesToCSV(issues);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'qc-issues-' + new Date().toISOString().split('T')[0] + '.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        issues.forEach(issue => issue.sentToSheets = true);
        localStorage.setItem('qualityIssues', JSON.stringify(qualityIssues));
        alert('Downloaded ' + issues.length + ' QC issues as CSV file!');
    }
}

async function submitViaDirectPost(sheetId, sheetName, csvData) {
    throw new Error('Direct POST method not yet implemented');
}

async function submitViaFormEndpoint(csvData) {
    throw new Error('Form endpoint method not yet implemented'); 
}

async function submitViaGoogleAppsScript(issues) {
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbynjk1Lu8Gq_z60ZbcOnJpfLYAFSE7rV4S2OCxJvX35AFNe-iyRUaE5-6QfI2Gi-VS1/exec';
    
    console.log('Submitting to Apps Script via GET:', issues);
    
    const params = new URLSearchParams({
        action: 'addQCIssues',
        data: JSON.stringify(issues)
    });
    
    const fullUrl = `${appsScriptUrl}?${params.toString()}`;
    
    const response = await fetch(fullUrl, {
        method: 'GET',
        mode: 'no-cors' 
    });
    
    console.log('Submitted to Apps Script (no-cors mode)');
    
    return { success: true, message: 'Submitted via GET request' };
}

async function createQCSheet(sheetId, apiKey) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            requests: [{
                addSheet: {
                    properties: {
                        title: 'QC_Issues',
                        gridProperties: {
                            rowCount: 1000,
                            columnCount: 10
                        }
                    }
                }
            }]
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sheet creation failed: ${response.status} - ${errorText}`);
    }
    
    console.log('QC_Issues sheet created successfully');
}

async function exportToForms(unsentIssues) {
    console.log('Falling back to Google Forms...');
    for (let i = 0; i < unsentIssues.length; i++) {
        const issue = unsentIssues[i];
        submitToGoogleForms(issue);
        issue.sentToForms = true;
        if (i < unsentIssues.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    localStorage.setItem('qualityIssues', JSON.stringify(qualityIssues));
    alert('Opened ' + unsentIssues.length + ' Google Forms! Please submit each form tab.');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase().replaceAll('...', '').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
}

async function loadCSVData(url) {
    try {
        console.log('Loading CSV from:', url);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        
        const csvText = await response.text();
        console.log('CSV response length:', csvText.length);
        console.log('CSV first 200 chars:', csvText.substring(0, 200));
        
        const lines = csvText.split('\n');
        if (lines.length < 2) throw new Error('CSV has no data rows');
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        console.log('CSV headers:', headers);
        
        const data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                const values = [];
                let current = '';
                let inQuotes = false;
                
                for (let char of line) {
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(current.trim().replace(/"/g, ''));
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current.trim().replace(/"/g, ''));
                
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index] || '';
                });
                return obj;
            });
        
        console.log(`CSV parsed: ${data.length} rows`);
        return data;
    } catch (error) {
        console.error('CSV loading error for', url, ':', error);
        throw error;
    }
}

async function loadAllData() {
    console.log('loadAllData() called - starting initialization');
    document.getElementById('loading-status').textContent = 'Starting initialization...';
    
    try {
        console.log('Attempting to load exercise data from Google Sheets');
        document.getElementById('loading-status').textContent = 'Loading exercise data...';
        
        const [sentencesData, keywordsData] = await Promise.all([
            loadCSVData('https://docs.google.com/spreadsheets/d/1CNDRfgqSdMEyc0JgW6DerCRX1jUftWSX49nsiBPUbek/gviz/tq?tqx=out:csv&sheet=Sentences'),
            loadCSVData('https://docs.google.com/spreadsheets/d/1CNDRfgqSdMEyc0JgW6DerCRX1jUftWSX49nsiBPUbek/gviz/tq?tqx=out:csv&sheet=Keywords')
        ]);
        
        allData = { sentences: sentencesData, keywords: keywordsData, stories: sampleStories };
        
        document.getElementById('loading-progress-bar').style.width = '100%';
        document.getElementById('loading-status').textContent = 'Ready!';
        
        setTimeout(() => {
            console.log('Success path: hiding loading, showing activity selection');
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('activity-selection-screen').classList.remove('hidden');
            
            try {
                setupCaptionButtons();
                console.log('Caption buttons initialized');
            } catch (e) {
                console.error('Caption buttons failed:', e);
            }
            
            try {
                selectVoice('sarah');
                console.log('Voice selection initialized');
            } catch (e) {
                console.error('Voice selection failed:', e);
            }
            
            try {
                if (adminQCMode) {
                    toggleAdminQCMode();
                }
                console.log('Admin QC mode checked');
            } catch (e) {
                console.error('Admin QC mode failed:', e);
            }
            
            console.log('Initialization completed successfully');
        }, 500);
        
    } catch (error) {
        console.error('Data loading failed:', error);
        document.getElementById('loading-status').textContent = 'Using offline mode...';
        
        allData = {
            sentences: [
                { set_name: 'Test Set', sentence1: 'Hello world', sentence2: 'Hello there' },
                { set_name: 'Test Set', sentence1: 'Good morning', sentence2: 'Good evening' }
            ],
            keywords: [
                { set_name: 'Colors', sentence: 'The sky is blue', keyword: 'blue' },
                { set_name: 'Numbers', sentence: 'I have three cats', keyword: 'three' }
            ],
            stories: sampleStories
        };
        
        setTimeout(() => {
            console.log('Fallback path: hiding loading, showing activity selection');
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('activity-selection-screen').classList.remove('hidden');
            
            try {
                setupCaptionButtons();
                console.log('Fallback: Caption buttons initialized');
            } catch (e) {
                console.error('Fallback: Caption buttons failed:', e);
            }
            
            try {
                selectVoice('sarah');
                console.log('Fallback: Voice selection initialized');
            } catch (e) {
                console.error('Fallback: Voice selection failed:', e);
            }
            
            try {
                if (adminQCMode) {
                    toggleAdminQCMode();
                }
                console.log('Fallback: Admin QC mode checked');
            } catch (e) {
                console.error('Fallback: Admin QC mode failed:', e);
            }
            
            console.log('Fallback initialization completed');
        }, 1000);
    }
}

function showActivitySelection() {
    stopCurrentAudio();
    
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('level-selection-screen').classList.add('hidden');
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('activity-selection-screen').classList.remove('hidden');
    
    updateCIRingsDisplay(); 
    updateSoundGardenDisplay();
}

function showLevelSelection(activityType) {
    stopCurrentAudio();
    
    currentActivityType = activityType;
    
    analytics.trackEvent('ACTIVITY_SELECTED', {
        activityType: activityType
    });
    document.getElementById('activity-selection-screen').classList.add('hidden');
    document.getElementById('level-selection-screen').classList.remove('hidden');
    
    const levelButtonsContainer = document.getElementById('level-buttons-container');
    levelButtonsContainer.innerHTML = '';
    
    if (activityType === 'stories') {
        const enhancedButton = document.createElement('button');
        enhancedButton.className = 'w-full py-4 px-5 text-xl font-semibold rounded-lg border-2 border-gradient-to-r from-purple-400 to-pink-400 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition shadow-md';
        enhancedButton.innerHTML = `
            <div class="flex items-center justify-between">
                <span>✨ Enhanced Story Experience</span>
                <span class="text-sm bg-purple-100 px-2 py-1 rounded text-purple-700">NEW</span>
            </div>
            <div class="text-sm text-gray-600 mt-1">Multiple questions • Adaptive difficulty</div>
        `;
        enhancedButton.onclick = () => startEnhancedStory();
        levelButtonsContainer.appendChild(enhancedButton);
        
        const separator = document.createElement('div');
        separator.className = 'text-center text-gray-400 text-sm py-2';
        separator.textContent = '— Regular Stories —';
        levelButtonsContainer.appendChild(separator);
        
        sampleStories.forEach((story, index) => {
            const button = document.createElement('button');
            button.className = 'w-full py-4 px-5 text-xl font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-100 transition';
            button.textContent = story.title;
            button.onclick = () => startStory(story);
            levelButtonsContainer.appendChild(button);
        });
    } else if (activityType === 'scenarios') {
        availableScenarios.forEach(scenario => {
            const button = document.createElement('button');
            button.className = 'w-full py-4 px-5 text-xl font-semibold rounded-lg border-2 border-green-300 bg-green-50 hover:bg-green-100 transition';
            button.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${scenario.icon}</span>
                        <div class="text-left">
                            <div class="font-bold">${scenario.name}</div>
                            <div class="text-sm text-gray-600">${scenario.description}</div>
                        </div>
                    </div>
                    <div class="text-sm bg-green-100 px-2 py-1 rounded text-green-700">
                        ${scenario.levels.length} levels
                    </div>
                </div>
            `;
            button.onclick = () => showScenarioLevels(scenario);
            levelButtonsContainer.appendChild(button);
        });
    } else {
        const dataForActivity = allData[activityType];
        const sets = [...new Set(dataForActivity.map(item => item.Set))];
        
        sets.forEach(setName => {
            const button = document.createElement('button');
            button.className = 'w-full py-4 px-5 text-xl font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-100 transition';
            button.textContent = friendlySetNames[setName] || setName;
            button.onclick = () => startLevel(setName);
            levelButtonsContainer.appendChild(button);
        });
    }
}

function startLevel(setName) {
    currentLevelData = allData[currentActivityType].filter(item => item.Set === setName);
    shuffleArray(currentLevelData);
    currentQuestionIndex = 0;
    score = 0;
    exerciseStartTimestamp = Date.now();
    
    analytics.trackEvent('EXERCISE_STARTED', {
        activity: currentActivityType,
        level: setName,
        voice: selectedVoice,
        noise: practiceMode === 'noise' ? noiseLevel : 'quiet',
        totalQuestions: currentLevelData.length
    });
    
    document.getElementById('exercise-title').textContent = friendlySetNames[setName] || setName;
    document.getElementById('level-selection-screen').classList.add('hidden');
    document.getElementById('completion-screen').classList.add('hidden');
    document.querySelector('main').classList.remove('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    
    loadQuestion();
}

function startStory(story) {
    currentStory = randomizeStoryChoices(story);
    currentQuestionIndex = 0;
    score = 0;
    exerciseStartTimestamp = Date.now();
    
    analytics.trackEvent('EXERCISE_STARTED', {
        activity: 'Stories',
        level: story.title,
        voice: selectedVoice,
        noise: practiceMode === 'noise' ? noiseLevel : 'quiet',
        captionLevel: selectedCaptionLevel,
        totalQuestions: 1
    });
    
    document.getElementById('exercise-title').textContent = currentStory.title;
    document.getElementById('level-selection-screen').classList.add('hidden');
    document.getElementById('completion-screen').classList.add('hidden');
    document.querySelector('main').classList.remove('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    
    loadStoryQuestion();
}

function showScenarioLevels(scenario) {
    currentScenario = scenario;
    
    const levelButtonsContainer = document.getElementById('level-buttons-container');
    levelButtonsContainer.innerHTML = '';
    
    const backButton = document.createElement('button');
    backButton.className = 'w-full py-2 px-4 text-blue-600 hover:text-blue-800 font-semibold text-left mb-4';
    backButton.innerHTML = '← Back to Scenarios';
    backButton.onclick = () => showLevelSelection('scenarios');
    levelButtonsContainer.appendChild(backButton);
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'text-center mb-4';
    titleDiv.innerHTML = `
        <h2 class="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <span class="text-3xl">${scenario.icon}</span>
            ${scenario.name}
        </h2>
        <p class="text-gray-600 mt-2">${scenario.description}</p>
    `;
    levelButtonsContainer.appendChild(titleDiv);
    
    scenario.levels.forEach(level => {
        const button = document.createElement('button');
        button.className = 'w-full py-4 px-5 text-xl font-semibold rounded-lg border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 transition mb-2';
        button.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="text-left">
                    <div class="font-bold">Level ${level.level_number}: ${level.name}</div>
                    <div class="text-sm text-gray-600">${level.description}</div>
                </div>
                <div class="text-sm bg-blue-100 px-2 py-1 rounded text-blue-700">
                    ${level.interactions.length} interactions
                </div>
            </div>
        `;
        button.onclick = () => startScenarioLevel(level);
        levelButtonsContainer.appendChild(button);
    });
}

function startScenarioLevel(level) {
    currentScenarioLevel = level;
    currentInteractionIndex = 0;
    scenarioScore = 0;
    exerciseStartTimestamp = Date.now();
    
    analytics.trackEvent('EXERCISE_STARTED', {
        activity: 'Scenarios',
        level: `${currentScenario.name} - ${level.name}`,
        voice: selectedVoice,
        noise: practiceMode === 'noise' ? noiseLevel : 'quiet',
        totalQuestions: level.interactions.length
    });
    
    currentActivityType = 'scenarios';
    
    document.getElementById('exercise-title').textContent = `${currentScenario.name} - ${level.name}`;
    document.getElementById('level-selection-screen').classList.add('hidden');
    document.getElementById('completion-screen').classList.add('hidden');
    document.querySelector('main').classList.remove('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    
    document.getElementById('current-question').textContent = '1';
    document.getElementById('total-questions').textContent = level.interactions.length;
    document.getElementById('current-score').textContent = '0';
    document.getElementById('progress-bar').style.width = '0%';
    
    loadScenarioInteraction();
}

function loadScenarioInteraction() {
    if (currentInteractionIndex >= currentScenarioLevel.interactions.length) {
        showCompletionScreen();
        return;
    }
    
    currentInteraction = currentScenarioLevel.interactions[currentInteractionIndex];
    
    document.getElementById('choice-container').classList.remove('hidden');
    document.getElementById('keyword-question-container').classList.add('hidden');
    document.getElementById('story-interface').classList.add('hidden');
    
    document.getElementById('feedback-message').className = 'mt-6 text-xl font-semibold h-8';
    document.getElementById('play-sound-btn').disabled = false;
    
    document.getElementById('choice1-btn').textContent = currentInteraction.question.choices[0].text;
    document.getElementById('choice2-btn').textContent = currentInteraction.question.choices[1].text;
    
    document.getElementById('choice1-btn').disabled = true; 
    document.getElementById('choice2-btn').disabled = true;
    
    loadScenarioAudio(currentInteraction);
}

function loadScenarioAudio(interaction) {
    const voiceFolderMap = {
        'sarah': 'female_audio',
        'emma': 'female_audio',
        'david': 'male_audio', 
        'marcus': 'male_audio'
    };
    
    const audioFolder = voiceFolderMap[selectedVoice] || `${selectedVoice}_audio`;
    const primaryAudioUrl = getAudioUrl(`${audioFolder}/${interaction.primary_audio_url}`);
    
    console.log(`Loading scenario audio: ${primaryAudioUrl} (Voice: ${selectedVoice})`);
    console.log(`Background noise: ${interaction.background_noise_id}`);
    
    if (scenarioAudioPlayer) {
        scenarioAudioPlayer.pause();
    }
    
    scenarioAudioPlayer = new Audio(primaryAudioUrl);
    currentAudio = scenarioAudioPlayer;
    
    if (practiceMode === 'noise') {
        loadBackgroundNoise(interaction.background_noise_id).then(() => {
            console.log('Background noise loaded for scenario');
        }).catch(console.error);
    }
}

function loadStoryQuestion() {
    document.getElementById('choice-container').classList.add('hidden');
    document.getElementById('keyword-question-container').classList.add('hidden');
    document.getElementById('story-interface').classList.remove('hidden');
    
    document.getElementById('feedback-message').className = 'mt-6 text-xl font-semibold h-8';
    document.getElementById('play-sound-btn').disabled = false;
    
    updateStoryCaption();
    
    document.getElementById('story-question-text').textContent = currentStory.question;
    
    const choicesContainer = document.getElementById('story-choices');
    choicesContainer.innerHTML = '';
    
    currentStory.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'w-full py-3 px-4 text-left font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-100 transition disabled:bg-gray-200 disabled:cursor-not-allowed';
        button.textContent = choice;
        button.disabled = true;
        button.onclick = () => handleStoryAnswer(index);
        button.id = `story-choice-${index}`;
        choicesContainer.appendChild(button);
    });
    
    const voiceFolderMap = {
        'sarah': 'female_audio',
        'emma': 'female_audio',
        'david': 'male_audio', 
        'marcus': 'male_audio'
    };
    console.log('Selected voice for story:', selectedVoice, 'Type:', typeof selectedVoice);
    console.log('Voice folder map lookup:', voiceFolderMap[selectedVoice]);
    const audioFolder = voiceFolderMap[selectedVoice] || `${selectedVoice}_audio`;
    console.log('Audio folder determined:', audioFolder);
    const audioUrl = getAudioUrl(`${audioFolder}/${currentStory.audioFile}`);
    
    currentAudio = new Audio(audioUrl);
    currentAudio.onerror = (e) => {
        console.error("Story audio loading error:", audioUrl, e);
        document.getElementById('feedback-message').textContent = `Story audio not available. You can still read the story and answer questions.`;
        document.getElementById('play-sound-btn').disabled = true;
        document.getElementById('play-sound-btn').textContent = 'Audio Unavailable';
    };

    document.getElementById('current-question').textContent = '1';
    document.getElementById('total-questions').textContent = '1';
    document.getElementById('progress-bar').style.width = '0%';
}

function loadQuestion() {
    if (currentQuestionIndex >= currentLevelData.length) {
        showCompletionScreen();
        return;
    }
    
    document.getElementById('choice-container').classList.remove('hidden');
    document.getElementById('story-interface').classList.add('hidden');
    
    document.getElementById('feedback-message').className = 'mt-6 text-xl font-semibold h-8';
    document.getElementById('choice1-btn').className = 'w-full py-3 px-4 text-lg font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-100 transition disabled:bg-gray-200 disabled:cursor-not-allowed';
    document.getElementById('choice2-btn').className = 'w-full py-3 px-4 text-lg font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-100 transition disabled:bg-gray-200 disabled:cursor-not-allowed';
    document.getElementById('choice1-btn').disabled = true;
    document.getElementById('choice2-btn').disabled = true;
    document.getElementById('play-sound-btn').disabled = false;
    document.getElementById('keyword-question-container').classList.add('hidden');

    const currentItem = currentLevelData[currentQuestionIndex];
    let audioText = '';
    
    if (currentActivityType === 'sentences') {
        const options = [currentItem.Sentence1, currentItem.Sentence2];
        shuffleArray(options);
        document.getElementById('choice1-btn').textContent = (options[0] || '').replaceAll('...', '');
        document.getElementById('choice2-btn').textContent = (options[1] || '').replaceAll('...', '');
        audioText = Math.random() > 0.5 ? options[0] : options[1];
    } else if (currentActivityType === 'keywords') {
        document.getElementById('keyword-question-container').textContent = currentItem.Question;
        document.getElementById('keyword-question-container').classList.remove('hidden');
        const options = [currentItem.Keyword1, currentItem.Keyword2];
        shuffleArray(options);
        document.getElementById('choice1-btn').textContent = (options[0] || '').replaceAll('...', '');
        document.getElementById('choice2-btn').textContent = (options[1] || '').replaceAll('...', '');
        audioText = currentItem.Sentence;
    }
    
    const voiceFolderMap = {
        'sarah': 'female_audio',
        'emma': 'female_audio',
        'david': 'male_audio', 
        'marcus': 'male_audio'
    };
    const audioFolder = voiceFolderMap[selectedVoice] || `${selectedVoice}_audio`;
    const audioFileName = slugify(audioText) + '.mp3';
    const audioUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO_NAME}/main/${audioFolder}/${audioFileName}`;
    
    currentAudio = new Audio(audioUrl);
    currentAudio.onerror = (e) => {
        console.error("Audio loading error:", audioUrl, e);
        document.getElementById('feedback-message').textContent = `Audio file not available. You can still read the text and select your answer.`;
        document.getElementById('play-sound-btn').disabled = true;
        document.getElementById('play-sound-btn').textContent = 'Audio Unavailable';
    };

    document.getElementById('total-questions').textContent = currentLevelData.length;
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('current-score').textContent = score;
    document.getElementById('progress-bar').style.width = `${((currentQuestionIndex + 1) / currentLevelData.length) * 100}%`;
}

function handleAnswer(selectedButton) {
    document.getElementById('play-sound-btn').disabled = true;
    document.getElementById('choice1-btn').disabled = true;
    document.getElementById('choice2-btn').disabled = true;
    
    let isCorrect = false;
    const selectedText = selectedButton.textContent;
    
    if (currentActivityType === 'scenarios') {
        const selectedIndex = selectedButton.id === 'choice1-btn' ? 0 : 1;
        const correctChoice = currentInteraction.question.choices.find(choice => choice.is_correct);
        isCorrect = selectedText === correctChoice.text;
        
        handleScenarioAnswer(selectedIndex, isCorrect);
        return;
    } else if (currentActivityType === 'keywords') {
        const correctKeywordClean = currentLevelData[currentQuestionIndex].Keyword1.replaceAll('...', '');
        isCorrect = selectedText === correctKeywordClean;
    } else if (currentActivityType === 'sentences') {
        const currentItem = currentLevelData[currentQuestionIndex];
        isCorrect = selectedText === (currentItem.Sentence1 || '').replaceAll('...', '');
    }

    if (isCorrect) {
        score++;
        const correctMessages = [
            'Excellent!', 'Perfect!', 'Great job!', 'Well done!', 'Nice work!', 
            'Outstanding!', 'Fantastic!', 'You got it!', 'Brilliant!', 'Superb!'
        ];
        const randomCorrect = correctMessages[Math.floor(Math.random() * correctMessages.length)];
        document.getElementById('feedback-message').textContent = randomCorrect;
        document.getElementById('feedback-message').classList.add('text-green-500');
        selectedButton.classList.add('correct-answer');
    } else {
        const encouragingMessages = [
            'Keep practicing!', 'Almost there!', 'Good effort!', 'You\'re learning!', 
            'Nice try!', 'Getting closer!', 'Keep going!', 'Stay focused!', 
            'You\'re improving!', 'Practice makes progress!', 'Keep listening!', 
            'You\'ve got this!', 'Learning in progress!'
        ];
        const randomEncouraging = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
        document.getElementById('feedback-message').textContent = randomEncouraging;
        document.getElementById('feedback-message').classList.add('text-orange-500');
        selectedButton.classList.add('wrong-answer');
        
        if (currentActivityType === 'sentences') {
            const currentItem = currentLevelData[currentQuestionIndex];
            const correctSentenceClean = (currentItem.Sentence1 || '').replaceAll('...', '');
            if (document.getElementById('choice1-btn').textContent === correctSentenceClean) {
                document.getElementById('choice1-btn').classList.add('correct-answer');
            } else if (document.getElementById('choice2-btn').textContent === correctSentenceClean) {
                document.getElementById('choice2-btn').classList.add('correct-answer');
            }
        } else if (currentActivityType === 'keywords') {
            const correctKeywordClean = currentLevelData[currentQuestionIndex].Keyword1.replaceAll('...', '');
            if (document.getElementById('choice1-btn').textContent === correctKeywordClean) {
                document.getElementById('choice1-btn').classList.add('correct-answer');
            } else if (document.getElementById('choice2-btn').textContent === correctKeywordClean) {
                document.getElementById('choice2-btn').classList.add('correct-answer');
            }
        }
    }

    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 1500);
}

function handleScenarioAnswer(selectedIndex, isCorrect) {
    stopCurrentAudio();
    
    if (isCorrect) {
        scenarioScore++;
        const feedbackText = currentInteraction.question.feedback_correct || 'Excellent! You understood that perfectly.';
        document.getElementById('feedback-message').textContent = feedbackText;
        document.getElementById('feedback-message').classList.add('text-green-500');
        document.getElementById(selectedIndex === 0 ? 'choice1-btn' : 'choice2-btn').classList.add('correct-answer');
    } else {
        const feedbackText = currentInteraction.question.feedback_incorrect || 'Not quite right. Listen again carefully.';
        document.getElementById('feedback-message').textContent = feedbackText;
        document.getElementById('feedback-message').classList.add('text-orange-500');
        document.getElementById(selectedIndex === 0 ? 'choice1-btn' : 'choice2-btn').classList.add('wrong-answer');
        
        const correctChoice = currentInteraction.question.choices.find(choice => choice.is_correct);
        const correctIndex = currentInteraction.question.choices.indexOf(correctChoice);
        document.getElementById(correctIndex === 0 ? 'choice1-btn' : 'choice2-btn').classList.add('correct-answer');
    }
    
    document.getElementById('current-score').textContent = scenarioScore;
    const progressPercent = ((currentInteractionIndex + 1) / currentScenarioLevel.interactions.length) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
    document.getElementById('current-question').textContent = currentInteractionIndex + 1;
    
    setTimeout(() => {
        currentInteractionIndex++;
        
        document.getElementById('choice1-btn').classList.remove('correct-answer', 'wrong-answer');
        document.getElementById('choice2-btn').classList.remove('correct-answer', 'wrong-answer');
        document.getElementById('feedback-message').className = 'mt-6 text-xl font-semibold h-8';
        
        loadScenarioInteraction();
    }, 2500);
}

function showCompletionScreen() {
    document.querySelector('main').classList.add('hidden');
    document.getElementById('completion-screen').classList.remove('hidden');
    
    let finalScore, totalQuestions, levelName;
    if (currentActivityType === 'scenarios') {
        finalScore = scenarioScore;
        totalQuestions = currentScenarioLevel.interactions.length;
        levelName = `${currentScenario.name} - ${currentScenarioLevel.name}`;
    } else if (currentActivityType === 'enhanced-stories') {
        finalScore = score;
        totalQuestions = processedQuestions.size; 
        levelName = currentEnhancedStory.title + ' (Enhanced)';
    } else if (currentActivityType === 'stories') {
        finalScore = score;
        totalQuestions = 1; 
        levelName = currentStory.title;
    } else {
        finalScore = score;
        totalQuestions = currentLevelData.length; 
        levelName = document.getElementById('exercise-title').textContent;
    }
    
    const exerciseDuration = exerciseStartTimestamp ? Date.now() - exerciseStartTimestamp : 0;
    const completionData = {
        activity: currentActivityType,
        level: levelName,
        voice: selectedVoice,
        noise: practiceMode === 'noise' ? noiseLevel : 'quiet',
        score: totalQuestions > 0 ? finalScore / totalQuestions : 0,
        itemsCorrect: finalScore,
        itemsTotal: totalQuestions,
        durationMs: exerciseDuration
    };
    
    analytics.trackEvent('EXERCISE_COMPLETED', completionData);
    
    gamification.onExerciseCompleted(completionData);
    
    document.getElementById('final-score').textContent = finalScore;
    document.getElementById('total-score').textContent = totalQuestions;
    document.getElementById('final-progress-bar').style.width = `${(finalScore / totalQuestions) * 100}%`;
}

function updateStoryCaption() {
    const captionElement = document.getElementById('story-caption');
    if (captionElement && currentStory && currentStory.captions) {
        captionElement.textContent = currentStory.captions[selectedCaptionLevel] || currentStory.fullText;
    }
}

function handleStoryAnswer(selectedIndex) {
    stopCurrentAudio();
    
    currentStory.choices.forEach((_, index) => {
        document.getElementById(`story-choice-${index}`).disabled = true;
    });
    
    const selectedButton = document.getElementById(`story-choice-${selectedIndex}`);
    const isCorrect = selectedIndex === currentStory.correctAnswer;
    
    if (isCorrect) {
        score++;
        const correctMessages = [
            'Excellent!', 'Perfect!', 'Great job!', 'Well done!', 'Nice work!', 
            'Outstanding!', 'Fantastic!', 'You got it!', 'Brilliant!', 'Superb!'
        ];
        const randomCorrect = correctMessages[Math.floor(Math.random() * correctMessages.length)];
        document.getElementById('feedback-message').textContent = randomCorrect;
        document.getElementById('feedback-message').classList.add('text-green-500');
        selectedButton.classList.add('correct-answer');
    } else {
        const encouragingMessages = [
            'Keep practicing!', 'Almost there!', 'Good effort!', 'You\'re learning!', 
            'Nice try!', 'Getting closer!', 'Keep going!', 'Stay focused!', 
            'You\'re improving!', 'Practice makes progress!', 'Keep listening!', 
            'You\'ve got this!', 'Learning in progress!'
        ];
        const randomEncouraging = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
        document.getElementById('feedback-message').textContent = randomEncouraging;
        document.getElementById('feedback-message').classList.add('text-orange-500');
        selectedButton.classList.add('wrong-answer');
        
        document.getElementById(`story-choice-${currentStory.correctAnswer}`).classList.add('correct-answer');
    }
    
    setTimeout(() => {
        showCompletionScreen();
    }, 2000);
}

function setupCaptionButtons() {
    document.querySelectorAll('.caption-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedCaptionLevel = parseInt(btn.dataset.captionLevel);
            
            document.querySelectorAll('.caption-btn').forEach(b => {
                b.className = 'caption-btn px-3 py-1 text-xs rounded-full border border-gray-300';
            });
            btn.className = 'caption-btn px-3 py-1 text-xs rounded-full border bg-blue-600 text-white';
            
            if (currentStory) {
                updateStoryCaption();
            }
        });
    });
}

document.getElementById('flag-audio-btn')?.addEventListener('click', flagAudioQuality);
document.getElementById('disable-qc-btn')?.addEventListener('click', toggleAdminQCMode);
document.getElementById('export-qc-btn')?.addEventListener('click', exportQualityData);

document.querySelectorAll('.activity-btn').forEach(btn => {
    btn.addEventListener('click', () => showLevelSelection(btn.dataset.activity));
});

document.getElementById('voice-sarah').addEventListener('click', () => selectVoice('sarah'));
document.getElementById('voice-emma').addEventListener('click', () => selectVoice('emma'));
document.getElementById('voice-david').addEventListener('click', () => selectVoice('david'));
document.getElementById('voice-marcus').addEventListener('click', () => selectVoice('marcus'));

function selectVoice(voiceName) {
    const previousVoice = selectedVoice;
    selectedVoice = voiceName;
    
    analytics.trackEvent('VOICE_CHANGED', {
        previousVoice: previousVoice,
        newVoice: voiceName
    });
    
    document.querySelectorAll('.voice-btn').forEach(btn => {
        btn.classList.remove('selected', 'female');
        btn.classList.add('border-gray-300', 'text-gray-700');
        btn.classList.remove('border-pink-500', 'bg-pink-500', 'border-blue-500', 'bg-blue-500', 'text-white');
    });
    
    const selectedBtn = document.getElementById(`voice-${voiceName}`);
    selectedBtn.classList.add('selected');
    selectedBtn.classList.remove('border-gray-300', 'text-gray-700');
    
    if (voiceName === 'sarah' || voiceName === 'emma') {
        selectedBtn.classList.add('female', 'border-pink-500', 'bg-pink-500', 'text-white');
    } else {
        selectedBtn.classList.add('border-blue-500', 'bg-blue-500', 'text-white');
    }
    
    console.log(`Voice selected: ${voiceName}`);
}

document.getElementById('back-to-activities').addEventListener('click', showActivitySelection);
document.getElementById('back-to-levels').addEventListener('click', () => showLevelSelection(currentActivityType));
document.getElementById('next-level-btn').addEventListener('click', () => showLevelSelection(currentActivityType));
document.getElementById('retry-level-btn').addEventListener('click', () => startLevel(document.getElementById('exercise-title').textContent));
document.getElementById('back-to-activities-from-dashboard').addEventListener('click', () => {
    showActivitySelection();
    updateCIRingsDisplay(); 
    updateSoundGardenDisplay();
});
document.getElementById('weekly-goals-settings').addEventListener('click', () => {
    showWeeklyGoalsSettings();
});

document.getElementById('play-sound-btn').addEventListener('click', async () => {
    if (currentAudio) {
        try {
            await playAudioWithNoise(currentAudio);
            
            if (currentActivityType === 'stories') {
                currentStory.choices.forEach((_, index) => {
                    document.getElementById(`story-choice-${index}`).disabled = false;
                });
            } else if (currentActivityType === 'scenarios') {
                document.getElementById('choice1-btn').disabled = false;
                document.getElementById('choice2-btn').disabled = false;
            } else {
                document.getElementById('choice1-btn').disabled = false;
                document.getElementById('choice2-btn').disabled = false;
            }
        } catch (e) {
            console.error("Error playing audio:", e);
        }
    }
});

document.getElementById('choice1-btn').addEventListener('click', () => handleAnswer(document.getElementById('choice1-btn')));
document.getElementById('choice2-btn').addEventListener('click', () => handleAnswer(document.getElementById('choice2-btn')));

let titleTapCount = 0;
let titleTapTimer = null;
document.getElementById('category-title').addEventListener('click', () => {
    titleTapCount++;
    if (titleTapTimer) clearTimeout(titleTapTimer);
    
    if (titleTapCount === 3) {
        toggleAdminQCMode();
        titleTapCount = 0;
    } else {
        titleTapTimer = setTimeout(() => {
            titleTapCount = 0;
        }, 1000);
    }
});

document.getElementById('quiet-mode').addEventListener('click', () => {
    practiceMode = 'quiet';
    
    analytics.trackEvent('PRACTICE_MODE_CHANGED', {
        mode: 'quiet'
    });
    
    document.getElementById('quiet-mode').classList.add('border-blue-600', 'bg-blue-600', 'text-white');
    document.getElementById('quiet-mode').classList.remove('border-gray-300', 'text-gray-700');
    document.getElementById('noise-mode').classList.remove('border-blue-600', 'bg-blue-600', 'text-white');
    document.getElementById('noise-mode').classList.add('border-gray-300', 'text-gray-700');
    document.getElementById('noise-level-selector').classList.add('hidden');
    console.log('Practice mode set to: quiet');
});

document.getElementById('noise-mode').addEventListener('click', () => {
    practiceMode = 'noise';
    
    analytics.trackEvent('PRACTICE_MODE_CHANGED', {
        mode: 'noise'
    });
    
    document.getElementById('noise-mode').classList.add('border-blue-600', 'bg-blue-600', 'text-white');
    document.getElementById('noise-mode').classList.remove('border-gray-300', 'text-gray-700');
    document.getElementById('quiet-mode').classList.remove('border-blue-600', 'bg-blue-600', 'text-white');
    document.getElementById('quiet-mode').classList.add('border-gray-300', 'text-gray-700');
    document.getElementById('noise-level-selector').classList.remove('hidden');
    console.log('Practice mode set to: noise');
});

document.querySelectorAll('.noise-level-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const level = e.target.getAttribute('data-noise-level');
        const previousLevel = noiseLevel;
        noiseLevel = level;
        
        analytics.trackEvent('NOISE_LEVEL_CHANGED', {
            previousLevel: previousLevel,
            newLevel: level
        });
        
        document.querySelectorAll('.noise-level-btn').forEach(b => {
            b.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500', 'text-white');
            b.classList.add('border-gray-300');
        });
        
        if (level === 'easy') {
            e.target.classList.add('bg-green-500', 'text-white');
        } else if (level === 'medium') {
            e.target.classList.add('bg-yellow-500', 'text-white');
        } else if (level === 'hard') {
            e.target.classList.add('bg-red-500', 'text-white');
        }
        e.target.classList.remove('border-gray-300');
        
        console.log(`Noise level set to: ${level}`);
        
        if (practiceMode === 'noise') {
            loadBackgroundNoise(level).catch(console.error);
        }
    });
});

function showQuestion(question) {
    console.log(`Showing question: ${question.id} - ${question.type} - ${question.difficulty}`);
    
    const modalContainer = document.getElementById('question-modal-container');
    const questionTitle = document.getElementById('question-title');
    const questionText = document.getElementById('question-text-element');
    const choicesContainer = document.getElementById('question-choices-container');
    const feedbackContainer = document.getElementById('question-feedback-container');
    
    choicesContainer.innerHTML = '';
    feedbackContainer.classList.add('hidden');
    
    const typeLabel = question.type === 'L3_IDENTIFICATION' ? 'Listening Check' : 'Think About It';
    questionTitle.textContent = `${typeLabel} - ${question.difficulty}`;
    
    questionText.textContent = question.text;
    
    question.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.className = 'w-full px-4 py-3 text-left rounded-lg border-2 border-gray-300 hover:bg-gray-100 transition-colors';
        button.setAttribute('data-choice-index', index);
        
        button.addEventListener('click', () => {
            const isCorrect = index === question.correctIndex;
            
            const allButtons = choicesContainer.querySelectorAll('button');
            allButtons.forEach(btn => btn.disabled = true);
            
            handleQuestionAnswer(question, index, isCorrect);
        });
        
        choicesContainer.appendChild(button);
    });
    
    modalContainer.classList.remove('hidden');
    
    const firstButton = choicesContainer.querySelector('button');
    if (firstButton) firstButton.focus();
}

function showQuestionFeedback(question, isCorrect, selectedChoiceIndex) {
    console.log(`Showing feedback for ${question.id}: ${isCorrect ? 'Correct' : 'Incorrect'}`);
    
    const choicesContainer = document.getElementById('question-choices-container');
    const feedbackContainer = document.getElementById('question-feedback-container');
    const feedbackText = document.getElementById('feedback-text-element');
    
    const allButtons = choicesContainer.querySelectorAll('button');
    allButtons.forEach((button, index) => {
        button.disabled = true;
        
        if (index === question.correctIndex) {
            button.classList.remove('border-gray-300');
            button.classList.add('border-green-500', 'bg-green-100');
        } else if (index === selectedChoiceIndex && !isCorrect) {
            button.classList.remove('border-gray-300');
            button.classList.add('border-red-500', 'bg-red-100');
        } else {
            button.classList.add('opacity-50');
        }
    });
    
    const feedbackPrefix = isCorrect ? '✓ Correct! ' : '✗ Not quite. ';
    feedbackText.textContent = feedbackPrefix + question.feedback;
    
    if (isCorrect) {
        feedbackText.className = 'text-green-700 font-semibold';
    } else {
        feedbackText.className = 'text-red-700 font-semibold';
    }
    
    feedbackContainer.classList.remove('hidden');
}

function hideQuestionModal() {
    const modalContainer = document.getElementById('question-modal-container');
    modalContainer.classList.add('hidden');
    console.log('Question modal hidden');
}

function handleQuestionAnswer(question, selectedChoiceIndex, isCorrect) {
    console.log(`Question answered: ${question.id}, Choice: ${selectedChoiceIndex}, Correct: ${isCorrect}`);
    
    if (!isCorrect) {
        incorrectAnswerCount++;
        
        const fallbackId = question.fallbackQuestion;
        const fallbackKey = fallbackId ? `${currentEnhancedStory.id}-${fallbackId}` : null;

        if (question.type === 'L4_COMPREHENSION' && fallbackKey && !processedQuestions.has(fallbackKey)) {
            const fallbackQ = findQuestionById(fallbackId);
            if (fallbackQ) {
                console.log(`Incorrect L4 answer, showing unprocessed fallback: ${fallbackId}`);
                
                processedQuestions.add(fallbackKey);

                showQuestionFeedback(question, false, selectedChoiceIndex);
                
                setTimeout(() => {
                    showQuestion(fallbackQ);
                }, 2500);
                return; 
            }
        }
        
        if (incorrectAnswerCount >= 3) {
            offerCaptionHelp();
        }
    }
    
    showQuestionFeedback(question, isCorrect, selectedChoiceIndex);
    
    if (currentActivityType === 'enhanced-stories' && isCorrect) {
        score++;
        document.getElementById('current-score').textContent = score;
    }
    
    if (currentActivityType === 'enhanced-stories') {
        const totalQuestions = currentEnhancedStory.questions.length;
        const questionsAnswered = processedQuestions.size;
        document.getElementById('current-question').textContent = questionsAnswered;
        document.getElementById('progress-bar').style.width = `${(questionsAnswered / totalQuestions) * 100}%`;
    }
    
    setTimeout(() => {
        hideQuestionModal();
        resumeStoryPlayback();
    }, 2500);
}

function findQuestionById(questionId) {
    return currentEnhancedStory ? currentEnhancedStory.questions.find(q => q.id === questionId) : null;
}

function playStoryWithQuestions(story) {
    currentEnhancedStory = story;
    processedQuestions.clear();
    incorrectAnswerCount = 0;
    
    storyAudioPlayer = document.getElementById('audio-player') || currentAudio;
    
    const audioUrl = getAudioUrl(story.audioFiles[selectedVoice]);
    console.log(`Loading enhanced story audio: ${audioUrl}`);
    
    if (storyAudioPlayer) {
        storyAudioPlayer.src = audioUrl;
        storyAudioPlayer.currentTime = 0;
    } else {
        storyAudioPlayer = new Audio(audioUrl);
        currentAudio = storyAudioPlayer;
    }
    
    console.log(`Starting enhanced story: ${story.title} with ${story.questions.length} questions`);
    
    storyAudioPlayer.removeEventListener('timeupdate', handleStoryTimeUpdate);
    
    storyAudioPlayer.addEventListener('timeupdate', handleStoryTimeUpdate);
    
    storyAudioPlayer.addEventListener('ended', handleStoryEnded, { once: true });
    
    if (practiceMode === 'noise') {
        playAudioWithNoise(storyAudioPlayer).catch(console.error);
    } else {
        storyAudioPlayer.play().catch(console.error);
    }
}

function handleStoryTimeUpdate() {
    if (!currentEnhancedStory || !storyAudioPlayer) return;
    
    const currentTime = storyAudioPlayer.currentTime;
    
    for (let i = 0; i < currentEnhancedStory.questions.length; i++) {
        const question = currentEnhancedStory.questions[i];
        const questionKey = `${currentEnhancedStory.id}-${question.id}`;
        
        if (currentTime >= question.timestamp && !processedQuestions.has(questionKey)) {
            processedQuestions.add(questionKey);
            
            storyAudioPlayer.pause();
            if (backgroundNoiseAudio) backgroundNoiseAudio.pause();
            
            console.log(`Triggering question at ${currentTime.toFixed(1)}s: ${question.text}`);
            
            showQuestion(question);
            break; 
        }
    }
}

function resumeStoryPlayback() {
    if (storyAudioPlayer && currentEnhancedStory) {
        console.log('Resuming enhanced story playback');
        if (practiceMode === 'noise') {
            playAudioWithNoise(storyAudioPlayer).catch(console.error);
        } else {
            storyAudioPlayer.play().catch(console.error);
        }
    }
}

function handleStoryEnded() {
    console.log(`Enhanced story completed: ${currentEnhancedStory.title}`);
    console.log(`Questions answered: ${processedQuestions.size}/${currentEnhancedStory.questions.length}`);
    console.log(`Incorrect answers: ${incorrectAnswerCount}`);
    
    setTimeout(() => {
        showCompletionScreen();
    }, 1000);
    
    storyAudioPlayer.removeEventListener('timeupdate', handleStoryTimeUpdate);
    currentEnhancedStory = null;
    processedQuestions.clear();
    incorrectAnswerCount = 0;
}

function offerCaptionHelp() {
    const currentCaptionLevel = currentEnhancedStory.currentCaptionLevel;
    const nextLevel = getNextCaptionLevel(currentCaptionLevel);
    
    if (nextLevel > currentCaptionLevel) {
        console.log(`Offering caption help: ${currentCaptionLevel}% → ${nextLevel}%`);
        
        const helpText = `This seems challenging! Would you like to increase captions from ${currentCaptionLevel}% to ${nextLevel}% for more support?`;
        
        if (confirm(helpText)) {
            currentEnhancedStory.currentCaptionLevel = nextLevel;
            console.log(`Caption level increased to ${nextLevel}%`);
        }
        incorrectAnswerCount = 0;
    }
}

function getNextCaptionLevel(current) {
    const levels = [25, 50, 75, 100];
    const currentIndex = levels.indexOf(current);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : current;
}

function showStoryCompletionSummary() {
    const totalQuestionsInStory = currentEnhancedStory.questions.length;
    const questionsPresented = processedQuestions.size;
    
    let accuracy = 0;
    if (questionsPresented > 0) {
        const correctAnswers = questionsPresented - incorrectAnswerCount;
        accuracy = Math.round((correctAnswers / questionsPresented) * 100);
    }

    const summaryText = `Enhanced Story Complete!\n\nQuestions Presented: ${questionsPresented} / ${totalQuestionsInStory}\nAccuracy: ${accuracy}%\n\nGreat listening work!`;
    
    alert(summaryText);
}

function startEnhancedStory() {
    console.log('Starting Enhanced Story Experience');
    
    currentActivityType = 'enhanced-stories';
    currentQuestionIndex = 0;
    score = 0;
    
    document.getElementById('exercise-title').textContent = enhancedStoryPOC.title;
    document.getElementById('level-selection-screen').classList.add('hidden');
    document.getElementById('completion-screen').classList.add('hidden');
    document.querySelector('main').classList.remove('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    
    document.getElementById('choice-container').classList.add('hidden');
    document.getElementById('keyword-question-container').classList.add('hidden');
    document.getElementById('story-interface').classList.add('hidden');
    
    document.getElementById('feedback-message').className = 'mt-6 text-xl font-semibold h-8';
    document.getElementById('play-sound-btn').disabled = false;
    
    const totalQuestions = enhancedStoryPOC.questions.length;
    document.getElementById('current-question').textContent = '0';
    document.getElementById('total-questions').textContent = totalQuestions;
    document.getElementById('current-score').textContent = '0';
    document.getElementById('progress-bar').style.width = '0%';
    
    if (practiceMode === 'noise') {
        loadBackgroundNoise(noiseLevel).then(() => {
            console.log('Background noise loaded for enhanced story');
            playStoryWithQuestions(enhancedStoryPOC);
        }).catch(console.error);
    } else {
        playStoryWithQuestions(enhancedStoryPOC);
    }
}

function showWeeklyGoalsSettings() {
    const currentProgress = gamification.getWeeklyProgress();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md mx-4">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Weekly Goal Settings</h2>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Goal Type</label>
                    <select id="goal-type-select" class="w-full p-2 border border-gray-300 rounded-lg">
                        <option value="days" ${currentProgress.goalType === 'days' ? 'selected' : ''}>Practice Days per Week</option>
                        <option value="minutes" ${currentProgress.goalType === 'minutes' ? 'selected' : ''}>Total Minutes per Week</option>
                        <option value="sessions" ${currentProgress.goalType === 'sessions' ? 'selected' : ''}>Sessions per Week</option>
                    </select>
                </div>
                
                <div id="days-goal" ${currentProgress.goalType !== 'days' ? 'style="display:none"' : ''}>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Days per Week</label>
                    <input type="range" id="days-slider" min="1" max="7" value="${currentProgress.target.days}" class="w-full">
                    <div class="flex justify-between text-sm text-gray-500">
                        <span>1 day</span>
                        <span id="days-value">${currentProgress.target.days} days</span>
                        <span>7 days</span>
                    </div>
                </div>
                
                <div id="minutes-goal" ${currentProgress.goalType !== 'minutes' ? 'style="display:none"' : ''}>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Minutes per Week</label>
                    <input type="range" id="minutes-slider" min="30" max="300" step="10" value="${currentProgress.target.minutes}" class="w-full">
                    <div class="flex justify-between text-sm text-gray-500">
                        <span>30 min</span>
                        <span id="minutes-value">${currentProgress.target.minutes} minutes</span>
                        <span>300 min</span>
                    </div>
                </div>
                
                <div id="sessions-goal" ${currentProgress.goalType !== 'sessions' ? 'style="display:none"' : ''}>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Sessions per Week</label>
                    <input type="range" id="sessions-slider" min="1" max="21" value="${currentProgress.target.sessions}" class="w-full">
                    <div class="flex justify-between text-sm text-gray-500">
                        <span>1 session</span>
                        <span id="sessions-value">${currentProgress.target.sessions} sessions</span>
                        <span>21 sessions</span>
                    </div>
                </div>
                
                <div class="mt-6 flex gap-3">
                    <button id="save-goals" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                        Save Changes
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const goalTypeSelect = modal.querySelector('#goal-type-select');
    const daysSlider = modal.querySelector('#days-slider');
    const minutesSlider = modal.querySelector('#minutes-slider');
    const sessionsSlider = modal.querySelector('#sessions-slider');
    
    goalTypeSelect.addEventListener('change', () => {
        modal.querySelector('#days-goal').style.display = goalTypeSelect.value === 'days' ? 'block' : 'none';
        modal.querySelector('#minutes-goal').style.display = goalTypeSelect.value === 'minutes' ? 'block' : 'none';
        modal.querySelector('#sessions-goal').style.display = goalTypeSelect.value === 'sessions' ? 'block' : 'none';
    });
    
    daysSlider.addEventListener('input', () => {
        modal.querySelector('#days-value').textContent = daysSlider.value + ' days';
    });
    
    minutesSlider.addEventListener('input', () => {
        modal.querySelector('#minutes-value').textContent = minutesSlider.value + ' minutes';
    });
    
    sessionsSlider.addEventListener('input', () => {
        modal.querySelector('#sessions-value').textContent = sessionsSlider.value + ' sessions';
    });
    
    modal.querySelector('#save-goals').addEventListener('click', () => {
        const goalType = goalTypeSelect.value;
        let targetValue;
        
        if (goalType === 'days') {
            targetValue = parseInt(daysSlider.value);
        } else if (goalType === 'minutes') {
            targetValue = parseInt(minutesSlider.value);
        } else {
            targetValue = parseInt(sessionsSlider.value);
        }
        
        gamification.setWeeklyGoal(goalType, targetValue);
        updateWeeklyProgressDisplay();
        modal.remove();
        
        showConfirmation('Weekly goal updated! Your new goal will take effect immediately.');
    });
}

function showConfirmation(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function updateCIRingsDisplay() {
    if (!gamification) return;
    
    const rings = gamification.getRingsStatus();
    const strainFeedback = gamification.getListeningStrainFeedback();
    
    updateRingProgress('consistency', rings.consistency.progress);
    updateRingProgress('clarity', rings.clarity.progress);
    updateRingProgress('challenge', rings.challenge.progress);
    
    document.getElementById('consistency-goal').textContent = 
        `${Math.round(rings.consistency.current)}/${rings.consistency.goal} min`;
    document.getElementById('clarity-goal').textContent = 
        `${Math.round(rings.clarity.current * 100)}%`;
    document.getElementById('challenge-goal').textContent = 
        `${Math.round(rings.challenge.current)}/${rings.challenge.goal}`;
    
    const strainElement = document.getElementById('strain-feedback');
    if (strainElement && strainFeedback) {
        strainElement.innerHTML = `
            <div class="text-sm">
                <span class="font-medium">${strainFeedback.level}:</span>
                <span class="${strainFeedback.color}">${strainFeedback.message}</span>
            </div>
        `;
    }
    
    updateWeeklyProgressDisplay();
}

function updateRingProgress(ringType, progress) {
    const progressElement = document.getElementById(`${ringType}-ring-progress`);
    if (progressElement) {
        const circumference = 2 * Math.PI * 15.91549430918954; 
        const strokeDasharray = `${progress * 100}, 100`;
        progressElement.style.strokeDasharray = strokeDasharray;
    }
}

function updateWeeklyProgressDisplay() {
    if (!gamification) return;
    
    const weeklyProgress = gamification.getWeeklyProgress();
    
    const goalTypes = {
        'days': `Practice ${weeklyProgress.target.days} days this week`,
        'minutes': `Practice ${weeklyProgress.target.minutes} minutes this week`,
        'sessions': `Complete ${weeklyProgress.target.sessions} sessions this week`
    };
    
    document.getElementById('weekly-goal-text').textContent = goalTypes[weeklyProgress.goalType] || goalTypes['days'];
    
    const progressTexts = {
        'days': `${weeklyProgress.current.days} of ${weeklyProgress.target.days} days completed`,
        'minutes': `${weeklyProgress.current.minutes} of ${weeklyProgress.target.minutes} minutes completed`,
        'sessions': `${weeklyProgress.current.sessions} of ${weeklyProgress.target.sessions} sessions completed`
    };
    
    document.getElementById('weekly-progress-text').textContent = progressTexts[weeklyProgress.goalType] || progressTexts['days'];
    
    const streakDisplay = document.getElementById('weekly-streak-display');
    if (weeklyProgress.weeklyStreak > 0) {
        streakDisplay.textContent = `🔥 ${weeklyProgress.weeklyStreak} week streak`;
        streakDisplay.style.display = 'block';
    } else {
        streakDisplay.style.display = 'none';
    }
    
    document.getElementById('streak-freezes-count').textContent = `🛡️ ${weeklyProgress.streakFreezes} available`;
    
    const weeklyData = gamification.analytics.data.gamification.weeklyGoals;
    const today = new Date();
    const weekStart = new Date(weeklyData.currentWeekStart);
    const dots = document.querySelectorAll('#weekly-progress-dots > div');
    
    dots.forEach((dot, index) => {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + index);
        const dayString = dayDate.toISOString().substring(0, 10);
        
        if (weeklyData.currentWeekCompletedDays.includes(dayString)) {
            dot.className = 'w-4 h-4 rounded-full bg-green-500';
        } else if (dayDate.toDateString() === today.toDateString()) {
            dot.className = 'w-4 h-4 rounded-full bg-blue-400'; 
        } else {
            dot.className = 'w-4 h-4 rounded-full bg-gray-200';
        }
    });
}

function updateSoundGardenDisplay() {
    if (!gamification) return;
    
    const gardenState = gamification.getSoundGardenState();
    if (!gardenState) return;
    
    document.getElementById('garden-water-reserve').textContent = `💧 ${gardenState.waterReserve} drops`;
    document.getElementById('garden-plants-count').textContent = `🌱 ${gardenState.plants.length} plants`;
    document.getElementById('garden-season').textContent = getSeasonEmoji(gardenState.seasonTheme);
    document.getElementById('garden-tree-level').textContent = `🌳 Level ${gardenState.centralTree.level}`;
    document.getElementById('daily-butterflies').textContent = `🦋 ${gardenState.butterflies.length} today`;
    
    updateCentralTree(gardenState.centralTree);
    
    renderPlants(gardenState.plants);
    
    renderButterflies(gardenState.butterflies);
}

function getSeasonEmoji(season) {
    const seasonEmojis = {
        'spring': '🌸 Spring',
        'summer': '☀️ Summer', 
        'autumn': '🍂 Autumn',
        'winter': '❄️ Winter'
    };
    return seasonEmojis[season] || '🌸 Spring';
}

function updateCentralTree(tree) {
    const treeElement = document.getElementById('central-tree');
    if (!treeElement) return;

    const baseRadius = 8; 
    const leafRadius = baseRadius + (tree.level * 3); 

    const mainLeaf = treeElement.querySelector('circle:last-child');
    if (mainLeaf) {
        mainLeaf.setAttribute('r', leafRadius);
    }

    treeElement.querySelectorAll('.additional-foliage').forEach(el => el.remove());

    for (let i = 1; i < tree.level; i++) {
        const foliage = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const angle = (i * 90) * Math.PI / 180;
        const offset = leafRadius * 0.7;
        
        foliage.setAttribute('cx', 300 + Math.cos(angle) * offset);
        foliage.setAttribute('cy', 170 + Math.sin(angle) * offset);
        foliage.setAttribute('r', leafRadius * 0.7);
        foliage.setAttribute('fill', '#228B22');
        foliage.setAttribute('opacity', '0.7');
        foliage.classList.add('additional-foliage');
        treeElement.appendChild(foliage);
    }
}

function renderPlants(plants) {
    const plantsContainer = document.getElementById('plants-container');
    plantsContainer.innerHTML = '';
    
    plants.forEach(plant => {
        const placement = gamification.analytics.data.gamification.soundGarden.gardenPlacements.find(p => p.id === plant.placementId);
        if (!placement) return;
        
        const plantGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        plantGroup.setAttribute('transform', `translate(${placement.x}, ${placement.y})`);
        plantGroup.classList.add('plant-group', 'transition-all', 'duration-500');
        
        const plantVisual = createPlantVisual(plant);
        plantGroup.appendChild(plantVisual);
        
        if (plant.growthStage < 4) {
            const progressRing = createProgressRing(plant.progress);
            plantGroup.appendChild(progressRing);
        }
        
        plantsContainer.appendChild(plantGroup);
    });
}

function createPlantVisual(plant) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const stage = plant.growthStage;
    
    if (stage > 0) {
        const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        stem.setAttribute('x1', '0');
        stem.setAttribute('y1', '0');
        stem.setAttribute('x2', '0');
        stem.setAttribute('y2', stage * -8);
        stem.setAttribute('stroke', '#228B22');
        stem.setAttribute('stroke-width', '2');
        group.appendChild(stem);
    }
    
    switch (stage) {
        case 0: 
            const seed = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            seed.setAttribute('cx', '0');
            seed.setAttribute('cy', '0');
            seed.setAttribute('r', '3');
            seed.setAttribute('fill', '#8B4513');
            group.appendChild(seed);
            break;
            
        case 1:   
            const leaf1 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            leaf1.setAttribute('cx', '-3');
            leaf1.setAttribute('cy', '-6');
            leaf1.setAttribute('rx', '3');
            leaf1.setAttribute('ry', '2');
            leaf1.setAttribute('fill', '#90EE90');
            group.appendChild(leaf1);
            break;
            
        case 2: 
            const leaf2 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            leaf2.setAttribute('cx', '3');
            leaf2.setAttribute('cy', '-12');
            leaf2.setAttribute('rx', '4');
            leaf2.setAttribute('ry', '3');
            leaf2.setAttribute('fill', '#32CD32');
            group.appendChild(leaf2);
            
            const bud = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bud.setAttribute('cx', '0');
            bud.setAttribute('cy', '-16');
            bud.setAttribute('r', '2');
            bud.setAttribute('fill', getPlantColor(plant.type));
            group.appendChild(bud);
            break;
            
        case 3: 
        case 4: 
            for (let i = 0; i < 3; i++) {
                const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                leaf.setAttribute('cx', (i - 1) * 4);
                leaf.setAttribute('cy', -8 - (i * 3));
                leaf.setAttribute('rx', '4');
                leaf.setAttribute('ry', '3');
                leaf.setAttribute('fill', '#228B22');
                group.appendChild(leaf);
            }
            
            const flower = createFlower(plant.type);
            flower.setAttribute('transform', 'translate(0, -20)');
            group.appendChild(flower);
            break;
    }
    
    return group;
}

function getPlantColor(plantType) {
    const colors = {
        'sound_flower': '#FF69B4',
        'clarity_clover': '#98FB98', 
        'pitch_tulip': '#FFB6C1',
        'melody_rose': '#FF1493',
        'harmony_lily': '#DDA0DD',
        'rhythm_daisy': '#FFFF00'
    };
    return colors[plantType] || '#FF69B4';
}

function createFlower(plantType) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const color = getPlantColor(plantType);
    
    for (let i = 0; i < 5; i++) {
        const angle = (i * 72) * Math.PI / 180;
        const petal = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        petal.setAttribute('cx', Math.cos(angle) * 6);
        petal.setAttribute('cy', Math.sin(angle) * 6);
        petal.setAttribute('rx', '4');
        petal.setAttribute('ry', '2');
        petal.setAttribute('fill', color);
        petal.setAttribute('transform', `rotate(${i * 72} ${Math.cos(angle) * 6} ${Math.sin(angle) * 6})`);
        group.appendChild(petal);
    }
    
    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('cx', '0');
    center.setAttribute('cy', '0');
    center.setAttribute('r', '3');
    center.setAttribute('fill', '#FFD700');
    group.appendChild(center);
    
    return group;
}

function createProgressRing(progress) {
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('cx', '0');
    ring.setAttribute('cy', '0');
    ring.setAttribute('r', '12');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', '#E0E0E0');
    ring.setAttribute('stroke-width', '2');
    
    const progressRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progressRing.setAttribute('cx', '0');
    progressRing.setAttribute('cy', '0');
    progressRing.setAttribute('r', '12');
    progressRing.setAttribute('fill', 'none');
    progressRing.setAttribute('stroke', '#4CAF50');
    progressRing.setAttribute('stroke-width', '2');
    
    const circumference = 2 * Math.PI * 12;
    const strokeDasharray = `${progress * circumference}, ${circumference}`;
    progressRing.setAttribute('stroke-dasharray', strokeDasharray);
    
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.appendChild(ring);
    group.appendChild(progressRing);
    
    return group;
}

function renderButterflies(butterflies) {
    const butterfliesContainer = document.getElementById('butterflies-container');
    butterfliesContainer.innerHTML = '';
    
    butterflies.forEach((butterfly, index) => {
        const butterflyElement = createButterfly(butterfly.type);
        butterflyElement.setAttribute('transform', `translate(${150 + index * 80}, ${120 + Math.sin(index) * 20})`);
        butterflyElement.classList.add('animate-pulse');
        butterfliesContainer.appendChild(butterflyElement);
    });
}

function createButterfly(type) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    const colors = {
        'blue': '#4169E1',
        'yellow': '#FFD700',
        'orange': '#FF8C00',
        'firefly': '#FFFF00'
    };
    
    const color = colors[type] || '#4169E1';
    
    const wing1 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    wing1.setAttribute('cx', '-3');
    wing1.setAttribute('cy', '-2');
    wing1.setAttribute('rx', '4');
    wing1.setAttribute('ry', '2');
    wing1.setAttribute('fill', color);
    wing1.setAttribute('opacity', type === 'firefly' ? '0.8' : '0.6');
    
    const wing2 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    wing2.setAttribute('cx', '3');
    wing2.setAttribute('cy', '-2');
    wing2.setAttribute('rx', '4');
    wing2.setAttribute('ry', '2');
    wing2.setAttribute('fill', color);
    wing2.setAttribute('opacity', type === 'firefly' ? '0.8' : '0.6');
    
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    body.setAttribute('x1', '0');
    body.setAttribute('y1', '-4');
    body.setAttribute('x2', '0');
    body.setAttribute('y2', '2');
    body.setAttribute('stroke', '#8B4513');
    body.setAttribute('stroke-width', '1');
    
    group.appendChild(wing1);
    group.appendChild(wing2);
    group.appendChild(body);
    
    return group;
}

document.getElementById('tend-garden-btn').addEventListener('click', function() {
    if (!gamification) return;
    
    const dailyStats = {
        practiceTime: 15, 
        ringsCompleted: 2  
    };
    
    gamification.updateSoundGarden(dailyStats);
    updateSoundGardenDisplay();
    
    showWateringAnimation();
});

function showWateringAnimation() {
    const button = document.getElementById('tend-garden-btn');
    const originalText = button.textContent;
    
    button.textContent = '💧 Watering...';
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 1500);
}

loadAllData();