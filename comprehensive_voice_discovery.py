#!/usr/bin/env python3
"""
Comprehensive Voice Discovery for CI Training Optimization
Test 25+ male and 25+ female voices to find optimal F0 gap patterns for progressive training

Target: Create systematic 10Hz, 15Hz, 25Hz F0 gaps for clinical-grade auditory rehabilitation
"""

import requests
import os
import json
import time
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from voice_analysis_system import PraatAnalyzer, VoiceAnalysisResult
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Comprehensive voice list for testing (50 total voices)
COMPREHENSIVE_VOICE_TEST = {
    # MALE VOICES (25 total)
    # Current known voices
    "current_male": "pNInz6obpgDQGcFmaJgB",      # 118.4Hz
    "male_deep": "29vD33N1CtxCmqQRPOHJ",         # 144.4Hz
    "male_narrator": "21m00Tcm4TlvDq8ikWAM",     # 155.8Hz
    
    # Additional male voices to test
    "adam_deep": "pNInz6obpgDQGcFmaJgB",         # Adam (deep male voice)
    "antoni_warm": "ErXwobaYiN019PkySvjV",       # Antoni (warm male narrator)
    "arnold_confident": "VR6AewLTigWG4xSOukaG",  # Arnold (confident narrator)
    "boris_energetic": "YEUXwZHP2GkRkDsWe0kW",   # Boris (energetic broadcaster)
    "brian_calm": "nPczCjzI2devNBz1zQrb",        # Brian (calm narrator)
    "callum_intense": "N2lVS1w4EtoT3dr4eOWO",    # Callum (intense presenter)
    "charlie_casual": "IKne3meq5aSn9XLyUdCD",    # Charlie (casual conversational)
    "clyde_gruff": "2EiwWnXFnvU5JabPnv8n",       # Clyde (gruff narrator)
    "daniel_authoritative": "onwK4e9ZLuTAKqWW03F9", # Daniel (authoritative)
    "dave_conversational": "CYw3kZ02Hs0563khs1Fj", # Dave (conversational)
    "ethan_young": "g5CIjZEefAph4nQFvHAz",       # Ethan (young professional)
    "fin_sailor": "D38z5RcWu1voky8WS1ja",        # Fin (sailor narrator)
    "george_warm": "JBFqnCBsd6RMkjVDRZzb",       # George (warm storyteller)
    "giovanni_smooth": "zcAOhNBS3c14rBihAFp1",   # Giovanni (smooth narrator)
    "harry_anxious": "SOYHLrjzK2X1ezoPC6cr",     # Harry (anxious narrator)
    "james_calm": "ZQe5CqHNLWFWkJZn7c4x",        # James (calm professional)
    "jeremy_american": "bVMeCyTHy58xNoL34h3p",   # Jeremy (American narrator)
    "joseph_british": "Zlb1dXrM653N07WRdFW3",    # Joseph (British narrator)
    "josh_young": "TxGEqnHWrfWFTfGW9XjX",        # Josh (young energetic)
    "liam_articulate": "TX3LPaxmHKxFdv7VOQHJ",   # Liam (articulate narrator)
    "marcus_professional": "YEUXwZHP2GkRkDsWe0kW", # Marcus (professional)
    "michael_storyteller": "flq6f7yk4E4fJM5XTYuZ", # Michael (storyteller)
    "ryan_energetic": "wViXBPUzp2ZZixB1xQuM",    # Ryan (energetic presenter)
    "sam_serious": "yoZ06aMxZJJ28mfd3POQ",       # Sam (serious narrator)
    "thomas_smooth": "GBv7mTt0atIp3Br8iCZE",     # Thomas (smooth broadcaster)
    
    # FEMALE VOICES (25 total)
    # Current known optimal voices
    "current_female": "EXAVITQu4vr4xnSDxMaL",    # 147.4Hz (suboptimal reference)
    "eryn_friendly": "dj3G1R1ilKoFKhBnWOzG",     # 186.9Hz
    "hope_bright": "OYTbf65OHHFELVut7v2H",       # 183.4Hz
    "alexandra_young": "kdmDKE6EkgrWrrykO9Qt",    # 171.6Hz
    "jessica_expressive": "g6xIsTj2HwM6VR4iXFCw", # 176.9Hz
    "cassidy_energetic": "56AoDkrOh6qfVPDXZ7Pt", # 174.4Hz
    "dorothy_warm": "ThT5KcBeYPX3keUQqHPh",      # 173.2Hz
    
    # Additional female voices to test
    "alice_conversational": "Xb7hH8MSUJpSbSDYk0k2", # Alice (conversational)
    "aria_storyteller": "9BWtsMINqrJLrRacOk9x",    # Aria (storyteller)
    "bella_informative": "EXAVITQu4vr4xnSDxMaL",   # Bella (informative)
    "charlotte_seductive": "XB0fDUnXU5powFXDhCwa",  # Charlotte (seductive)
    "domi_strong": "AZnzlk1XvdvUeBnXmlld",         # Domi (strong female)
    "elli_emotional": "MF3mGyEYCl7XYWbV9V6O",      # Elli (emotional narrator)
    "emily_calm": "LcfcDJNUP1GQjkzn1xUU",          # Emily (calm presenter)
    "freya_expressive": "jsCqWAovK2LkecY7zXl4",    # Freya (expressive)
    "gigi_childlike": "jBpfuIE2acCO8z3wKNLl",      # Gigi (childlike energy)
    "grace_southern": "oWAxZDx7w5VEj9dCyTzz",      # Grace (southern charm)
    "ivy_youthful": "pFGDrVW2EgTlyUVW5D7C",        # Ivy (youthful narrator)
    "joanne_narrator": "58sbdx5jzEOw89iK8Z1Z",     # Joanne (narrator)
    "lily_british": "pFZP5JQG7iQjIQuC4Bku",        # Lily (British narrator)
    "matilda_warm": "XrExE9yKIg1WjnnlVkGX",        # Matilda (warm storyteller)
    "mimi_cute": "zrHiDhphv9ZnVXBqhQBM",           # Mimi (cute energetic)
    "nicole_whispering": "piTKgcLEGmPE4e6mEKli",   # Nicole (whispering)
    "sarah_soft": "EXAVITQu4vr4xnSDxMaL",          # Sarah (soft narrator)
    "serena_pleasant": "pMsXgVXv3BLzUgSXRplE",     # Serena (pleasant)
    "stella_upbeat": "21m00Tcm4TlvDq8ikWAM",       # Stella (upbeat)
    "tina_mature": "yoZ06aMxZJJ28mfd3POQ",         # Tina (mature professional)
    "valentina_calm": "LcfcDJNUP1GQjkzn1xUU"       # Valentina (calm narrator)
}

# Target F0 gaps for systematic training
TARGET_F0_GAPS = {
    "large_gap": 25,     # Easy discrimination (25Hz)
    "medium_gap": 15,    # Moderate discrimination (15Hz)  
    "small_gap": 10      # Challenging discrimination (10Hz)
}

# Optimal CI ranges
CI_OPTIMAL_RANGES = {
    "male": {"min": 85, "max": 180, "sweet_spot": (110, 150)},
    "female": {"min": 165, "max": 265, "sweet_spot": (175, 215)}
}

class ComprehensiveVoiceDiscovery:
    """
    Systematic voice discovery and analysis for CI training optimization
    Tests large voice libraries to find optimal F0 gap patterns
    """
    
    def __init__(self, api_key: str, output_dir: str = "comprehensive_voice_analysis"):
        self.api_key = api_key
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.analyzer = PraatAnalyzer()
        
        # Create organized subdirectories
        (self.output_dir / "male_voices").mkdir(exist_ok=True)
        (self.output_dir / "female_voices").mkdir(exist_ok=True)
        (self.output_dir / "analysis_results").mkdir(exist_ok=True)
        (self.output_dir / "gap_analysis").mkdir(exist_ok=True)
        
        logger.info(f"ComprehensiveVoiceDiscovery initialized. Output: {self.output_dir}")
    
    def test_comprehensive_voice_library(self, max_voices_per_gender: int = 25) -> Dict[str, VoiceAnalysisResult]:
        """
        Test comprehensive voice library for F0 analysis
        
        Args:
            max_voices_per_gender: Maximum voices to test per gender
            
        Returns:
            Complete analysis results dictionary
        """
        # Separate male and female voices
        male_voices = {}
        female_voices = {}
        
        for name, voice_id in COMPREHENSIVE_VOICE_TEST.items():
            if "male" in name.lower() and "female" not in name.lower():
                male_voices[name] = voice_id
            elif "female" in name.lower() or any(fname in name.lower() for fname in 
                ["eryn", "hope", "alexandra", "jessica", "cassidy", "dorothy", "alice", "aria", 
                 "bella", "charlotte", "domi", "elli", "emily", "freya", "gigi", "grace", 
                 "ivy", "joanne", "lily", "matilda", "mimi", "nicole", "sarah", "serena", 
                 "stella", "tina", "valentina"]):
                female_voices[name] = voice_id
        
        # Limit to specified number
        male_voices = dict(list(male_voices.items())[:max_voices_per_gender])
        female_voices = dict(list(female_voices.items())[:max_voices_per_gender])
        
        logger.info(f"Testing {len(male_voices)} male voices and {len(female_voices)} female voices")
        
        all_results = {}
        
        # Test male voices
        if male_voices:
            logger.info("🎯 Testing Male Voices...")
            male_results = self._analyze_gender_batch(male_voices, "male")
            all_results.update(male_results)
        
        # Test female voices  
        if female_voices:
            logger.info("🎯 Testing Female Voices...")
            female_results = self._analyze_gender_batch(female_voices, "female")
            all_results.update(female_results)
        
        # Analyze F0 gaps and create training recommendations
        self._analyze_f0_gaps(all_results)
        
        return all_results
    
    def _analyze_gender_batch(self, voices: Dict[str, str], gender: str) -> Dict[str, VoiceAnalysisResult]:
        """Analyze a batch of voices for specific gender"""
        results = {}
        profile = "ci_male" if gender == "male" else "ci_female_child"
        
        for i, (voice_name, voice_id) in enumerate(voices.items(), 1):
            try:
                logger.info(f"Testing {gender} voice {i}/{len(voices)}: {voice_name}")
                
                # Generate audio sample
                audio_path = self._generate_test_audio(voice_id, voice_name, gender)
                
                # Analyze voice characteristics
                result = self.analyzer.analyze(audio_path, profile, voice_name)
                results[voice_name] = result
                
                logger.info(f"✅ {voice_name}: F0={result.mean_f0:.1f}Hz")
                
                # Rate limiting for API
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"❌ Failed to process {voice_name}: {str(e)}")
                continue
        
        return results
    
    def _generate_test_audio(self, voice_id: str, voice_name: str, gender: str) -> str:
        """Generate audio sample for testing"""
        # Use Rainbow Passage for consistency
        text = "When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors."
        
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        
        data = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            # Save to gender-specific directory
            filename = f"{voice_name}_test.mp3"
            file_path = self.output_dir / f"{gender}_voices" / filename
            
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            return str(file_path)
        else:
            raise Exception(f"ElevenLabs API error: {response.status_code}")
    
    def _analyze_f0_gaps(self, results: Dict[str, VoiceAnalysisResult]):
        """Analyze F0 gaps and create training recommendations"""
        # Separate by gender and sort by F0
        male_voices = []
        female_voices = []
        
        for name, result in results.items():
            if "male" in name.lower() and "female" not in name.lower():
                male_voices.append((name, result))
            else:
                female_voices.append((name, result))
        
        # Sort by F0
        male_voices.sort(key=lambda x: x[1].mean_f0)
        female_voices.sort(key=lambda x: x[1].mean_f0)
        
        # Analyze gaps and create recommendations
        recommendations = {
            "male_analysis": self._create_gap_analysis(male_voices, "male"),
            "female_analysis": self._create_gap_analysis(female_voices, "female"),
            "training_progressions": self._design_training_progressions(male_voices, female_voices)
        }
        
        # Save detailed analysis
        output_file = self.output_dir / "gap_analysis" / "f0_gap_analysis.json"
        with open(output_file, 'w') as f:
            json.dump(recommendations, f, indent=2, default=str)
        
        # Generate human-readable report
        self._generate_gap_report(recommendations)
        
        logger.info(f"Gap analysis saved: {output_file}")
    
    def _create_gap_analysis(self, voices: List[Tuple[str, VoiceAnalysisResult]], gender: str) -> Dict:
        """Create detailed gap analysis for gender"""
        optimal_range = CI_OPTIMAL_RANGES[gender]
        
        # Filter to optimal voices
        optimal_voices = [(name, result) for name, result in voices 
                         if optimal_range["min"] <= result.mean_f0 <= optimal_range["max"]]
        
        # Calculate all possible gaps
        gaps = []
        for i in range(len(optimal_voices)):
            for j in range(i + 1, len(optimal_voices)):
                voice1_name, voice1_result = optimal_voices[i]
                voice2_name, voice2_result = optimal_voices[j]
                gap = abs(voice2_result.mean_f0 - voice1_result.mean_f0)
                
                gaps.append({
                    "voice1": voice1_name,
                    "voice1_f0": voice1_result.mean_f0,
                    "voice2": voice2_name,
                    "voice2_f0": voice2_result.mean_f0,
                    "gap_hz": gap,
                    "gap_category": self._categorize_gap(gap)
                })
        
        # Sort by gap size
        gaps.sort(key=lambda x: x["gap_hz"])
        
        return {
            "total_voices_tested": len(voices),
            "optimal_voices": len(optimal_voices),
            "optimal_voice_list": [(name, result.mean_f0) for name, result in optimal_voices],
            "possible_gaps": gaps,
            "gap_summary": self._summarize_gaps(gaps)
        }
    
    def _categorize_gap(self, gap: float) -> str:
        """Categorize gap size for training difficulty"""
        if gap >= 25:
            return "large_gap_easy"
        elif gap >= 15:
            return "medium_gap_moderate"
        elif gap >= 10:
            return "small_gap_challenging"
        else:
            return "minimal_gap_advanced"
    
    def _summarize_gaps(self, gaps: List[Dict]) -> Dict:
        """Summarize gap distribution"""
        categories = {}
        for gap in gaps:
            category = gap["gap_category"]
            if category not in categories:
                categories[category] = []
            categories[category].append(gap)
        
        return {cat: len(gaps) for cat, gaps in categories.items()}
    
    def _design_training_progressions(self, male_voices: List, female_voices: List) -> Dict:
        """Design optimal training progressions"""
        # This will create systematic training paths with ideal gap progressions
        progressions = {
            "beginner_progression": "25Hz → 15Hz → 10Hz gaps",
            "intermediate_progression": "15Hz → 10Hz → 8Hz gaps", 
            "advanced_progression": "10Hz → 8Hz → 5Hz gaps"
        }
        
        return progressions
    
    def _generate_gap_report(self, recommendations: Dict):
        """Generate human-readable gap analysis report"""
        report = []
        report.append("=" * 80)
        report.append("COMPREHENSIVE F0 GAP ANALYSIS - CI TRAINING OPTIMIZATION")
        report.append("=" * 80)
        report.append("")
        
        # Male analysis
        male_analysis = recommendations["male_analysis"]
        report.append("MALE VOICE ANALYSIS:")
        report.append(f"• Total voices tested: {male_analysis['total_voices_tested']}")
        report.append(f"• CI-optimal voices found: {male_analysis['optimal_voices']}")
        report.append("")
        
        if male_analysis["optimal_voice_list"]:
            report.append("Top CI-optimal male voices:")
            for name, f0 in male_analysis["optimal_voice_list"][:10]:
                report.append(f"  • {name}: {f0:.1f}Hz")
        report.append("")
        
        # Female analysis  
        female_analysis = recommendations["female_analysis"]
        report.append("FEMALE VOICE ANALYSIS:")
        report.append(f"• Total voices tested: {female_analysis['total_voices_tested']}")
        report.append(f"• CI-optimal voices found: {female_analysis['optimal_voices']}")
        report.append("")
        
        if female_analysis["optimal_voice_list"]:
            report.append("Top CI-optimal female voices:")
            for name, f0 in female_analysis["optimal_voice_list"][:10]:
                report.append(f"  • {name}: {f0:.1f}Hz")
        report.append("")
        
        # Save report
        report_text = "\n".join(report)
        report_file = self.output_dir / "gap_analysis" / "comprehensive_voice_report.txt"
        with open(report_file, 'w') as f:
            f.write(report_text)
        
        print(report_text)

def main():
    """Run comprehensive voice discovery"""
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        print("Please set ELEVENLABS_API_KEY environment variable")
        return
    
    print("🎯 COMPREHENSIVE VOICE DISCOVERY FOR CI TRAINING")
    print("=" * 60)
    print("Testing 50 voices to find optimal F0 gap patterns...")
    print("Target gaps: 10Hz, 15Hz, 25Hz for progressive training")
    print()
    
    # Initialize discovery system
    discovery = ComprehensiveVoiceDiscovery(api_key)
    
    # Run comprehensive analysis
    results = discovery.test_comprehensive_voice_library(max_voices_per_gender=25)
    
    print(f"\n🎉 Analysis complete! Results in: {discovery.output_dir}")

if __name__ == "__main__":
    main()