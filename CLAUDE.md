# CLAUDE.md - Hearing Rehabilitation App

## Project Overview
This is a web-based hearing rehabilitation application designed specifically for cochlear implant users and people with hearing loss. The app provides auditory training exercises using AI-generated speech from ElevenLabs, with features for progress tracking, audio preloading, and personalized voice training.

**Target Users:** Cochlear implant recipients, audiologists, family members helping with hearing rehabilitation

**Core Purpose:** Improve speech recognition and auditory processing through systematic exercises

## Project Structure

### Key Files
- `hearing_app_clean.html` - Main application file (single-page app)
- `index.html` - Original version (reference only)
- `index_with_preloading.html` - Enhanced version with audio caching
- Audio files: Hosted in separate GitHub repo `hearing-rehab-audio`

### External Dependencies
- **Google Sheets:** Exercise data source (words, sentences, keywords)
- **ElevenLabs API:** Voice generation for custom voices
- **GitHub/jsDelivr CDN:** Audio file hosting
- **Tailwind CSS:** Styling framework

## Technical Architecture

### Frontend Stack
- Pure HTML/CSS/JavaScript (no frameworks - keep it simple!)
- Single-page application with screen-based navigation
- LocalStorage for progress persistence
- Audio API with custom caching and preloading

### Data Flow
1. Load exercise data from Google Sheets CSV export
2. Cache audio files from GitHub repository
3. Preload next questions for seamless user experience
4. Save progress to localStorage for session persistence

## Code Conventions

### HTML Structure
- Component-based screens: loading, activity selection, level selection, exercise interface
- Semantic class names: Use descriptive classes like `audio-ready`, `level-completed`
- Accessibility: Proper ARIA labels and keyboard navigation

### JavaScript Patterns
- **ES6+ features:** Use modern JavaScript (const/let, arrow functions, async/await)
- **Modular functions:** Keep functions focused and single-purpose
- **Error handling:** Always wrap audio operations in try/catch
- **Performance:** Efficient DOM queries, minimal reflows

### CSS Guidelines
- Tailwind utility classes for rapid styling
- Custom CSS only for complex animations or states
- Mobile-first responsive design
- Smooth transitions for better UX

## How Claude Should Help

### 🔍 Before Making Changes
- Read and understand the current code structure
- Identify the specific functionality being modified
- Consider impact on audio caching, progress tracking, and user experience
- Check for mobile responsiveness implications

### 📋 Planning Process
- Outline the change and discuss potential approaches
- Consider user experience - how will this affect CI users?
- Plan testing strategy - how to verify the change works
- Identify any breaking changes to existing functionality

### 💻 Implementation Guidelines
- Maintain single-file architecture - keep everything in one HTML file
- Preserve audio caching system - don't break preloading functionality
- Keep progress persistence - maintain localStorage compatibility
- Test on mobile - ensure responsive design stays intact
- Maintain accessibility - preserve screen reader compatibility

### 🧪 Testing Requirements
- **Manual testing steps:** Provide clear instructions for testing changes
- **Audio functionality:** Ensure preloading and caching still work
- **Progress persistence:** Verify localStorage saves/loads correctly
- **Cross-browser:** Test in Safari, Chrome, and mobile browsers
- **Performance:** Check for memory leaks with audio objects

### 📝 Documentation
- Comment complex audio logic clearly
- Update this CLAUDE.md if architecture changes
- Document new features with usage examples
- Maintain friendly function names and clear variable names

## Current Known Issues

### High Priority
- Redundant "Back to Levels" button appears on level selection screen
- Audio cache management could be more efficient
- Mobile audio playback sometimes has delays

### Medium Priority
- Exercise completion analytics could be more detailed
- Error recovery for failed audio loads needs improvement
- Voice switching clears entire cache (could be smarter)

## Future Enhancements
- Custom voice cloning integration with ElevenLabs
- Therapist dashboard for progress monitoring
- Adaptive difficulty based on user performance
- Exercise customization for specific hearing profiles

## Development Workflow

### Typical Session
1. **Explore:** "Read the audio caching system and explain how it works"
2. **Plan:** "How should we add a volume control feature?"
3. **Code:** "Implement the volume control with localStorage persistence"
4. **Test:** "Provide testing steps for the volume control feature"
5. **Commit:** "Create a clear commit message for this change"

### Best Practices
- **Start small:** Make incremental improvements
- **Test audio thoroughly:** Audio bugs are hard to debug
- **Consider CI users:** Every change should improve their experience
- **Maintain simplicity:** Resist over-engineering
- **Document decisions:** Explain why choices were made

### Git Commit Guidelines
- **UNIVERSAL LAW: NEVER include "Co-Authored-By: Claude" or any Claude attribution in commits, code, or documentation**
- **Author attribution:** All commits must appear as if written entirely by the human developer
- **Commit messages:** Create clear, descriptive commit messages
- **Single developer:** All commits should be attributed to the human developer only

## ElevenLabs Integration

### Current Setup
- **Voice generation:** Uses `eleven_multilingual_v2` model
- **Voice settings:** stability: 0.5, similarity_boost: 0.75
- **Audio format:** MP3 files hosted on GitHub
- **Caching strategy:** 50-file cache with LRU eviction

### Future Voice Cloning
- **Family voice training:** Allow users to clone family member voices
- **Voice management:** Save/switch between multiple custom voices
- **Quality optimization:** Adaptive quality based on connection speed

## Success Metrics

### User Experience
- Audio loading time < 200ms for cached files
- Exercise completion rate > 80%
- Session persistence working 100% of the time
- Mobile responsiveness on all major devices

### Technical Quality
- No JavaScript errors in console
- Memory usage stable during long sessions
- Accessibility score > 95% (WAVE, axe tools)
- Performance > 90% Lighthouse score

## Notion Project Log Integration

### 📝 **Logging Development Sessions to Notion**

**ALWAYS log significant development sessions to maintain project documentation and IP tracking.**

#### **Quick Steps for Claude:**
1. **Create logging script** using the template below
2. **Use existing notion_logger.py system** (located in `/Users/clyle/Desktop/Desktop:Hearing Rehab/`)
3. **Import with dotenv** for environment variables
4. **Call quick_log_session()** with individual parameters (NOT dictionaries)

#### **Template Script Structure:**
```python
#!/usr/bin/env python3
import sys
import os
sys.path.append('/Users/clyle/Desktop/Desktop:Hearing Rehab')
from dotenv import load_dotenv
from notion_logger import quick_log_session

# Load environment variables
load_dotenv('/Users/clyle/Desktop/Desktop:Hearing Rehab/.env')

# Call quick_log_session with individual parameters:
result = quick_log_session(
    title="Session Title Here",
    duration_minutes=180,
    session_type="Development|Bug Fix|Planning|Research", 
    topics=["Topic 1", "Topic 2", "Topic 3"],
    decisions="Key decisions made during session",
    action_items="1. Next step\n2. Another step\n3. Final step",
    conversation_url="https://claude.ai/chat/current-session",
    costs=0.0,  # Any expenses incurred
    notes="Additional context and achievements"
)
```

#### **Success Detection:**
- ✅ **Success**: `result` contains `'id'` field (Notion page ID)
- ❌ **Failure**: `result` is None or missing 'id'
- 📝 **Console**: Look for "✅ Session logged successfully: [title]"

#### **Common Gotchas:**
- ❌ **Don't pass dictionaries** - use individual parameters
- ❌ **Don't use .env in current directory** - use full path to existing .env
- ❌ **Don't expect {'success': True}** - check for 'id' field instead
- ✅ **Do include sys.path.append** for notion_logger import
- ✅ **Do use load_dotenv()** with full path

#### **When to Log:**
- Major feature implementations
- Critical bug fixes and deployments
- Architecture decisions
- Production milestones
- Research breakthroughs
- Any session longer than 2 hours

#### **Session Types:**
- **Development**: Feature implementation, coding
- **Bug Fix**: Critical issue resolution
- **Research**: Analysis, investigation, planning
- **Deployment**: Production releases, infrastructure
- **Planning**: Strategy, architecture decisions

## Contact & Context
- **Developer:** deafjamz (Bruce)
- **Email:** blueairstreet@proton.me
- **Personal Context:** Developer has cochlear implants and understands user needs firsthand
- **Business Context:** Potential SaaS product for hearing rehabilitation market

---

**Remember:** This app serves people working to regain or improve their hearing. Every change should make their rehabilitation journey easier and more effective.