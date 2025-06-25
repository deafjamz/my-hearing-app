#!/usr/bin/env python3
"""
ElevenLabs Voice Testing Framework for Cochlear Implant Optimization
Clinical-grade voice assessment using standardized test phrases and methodology

Based on clinical research:
- HINT sentences for CI assessment
- Rainbow Passage for voice quality analysis
- Phonetically balanced word lists
- F0 discrimination thresholds for CI users
"""

import requests
import os
import json
import time
from pathlib import Path
from typing import List, Dict, Tuple
from voice_analysis_system import PraatAnalyzer, VoiceAnalysisResult
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Clinical test phrases - research-backed for voice assessment
CLINICAL_TEST_PHRASES = {
    "rainbow_passage": "When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors.",
    
    "hint_sentences": [
        "The boy fell from the window.",
        "The milk spilled on the floor.", 
        "The cat climbed up the tree.",
        "She wore a bright red dress.",
        "The rain began to fall heavily."
    ],
    
    "phonetic_balance": [
        "Please call Stella immediately.",
        "The quick brown fox jumps over the lazy dog.",
        "Pack my box with five dozen liquor jugs.",
        "How much wood would a woodchuck chuck?"
    ],
    
    "f0_discrimination": [
        "The fundamental frequency varies across speakers.",
        "Men typically have lower pitch than women.",
        "Children have the highest vocal frequencies.",
        "Cochlear implants process pitch differently."
    ]
}

# ElevenLabs voice configurations for testing
TEST_VOICE_CONFIGS = {
    # Current voices you're using
    "current_male": "pNInz6obpgDQGcFmaJgB",      # Your current male voice
    "current_female": "EXAVITQu4vr4xnSDxMaL",    # Your current female voice
    
    # Additional male voices for comparison
    "male_deep": "29vD33N1CtxCmqQRPOHJ",         # Deep male voice
    "male_young": "ZQe5CqHNLWFWkJZn7c4x",        # Younger male voice
    "male_narrator": "21m00Tcm4TlvDq8ikWAM",     # Professional narrator male
    
    # Additional female voices for comparison  
    "female_warm": "AZnzlk1XvdvUeBnXmlld",       # Warm female voice
    "female_clear": "pqHfZKP75CvOlQylNhV4",      # Clear articulation female
    "female_young": "XB0fDUnXU5powFXDhCwa"       # Younger female voice
}

# ElevenLabs API settings optimized for voice analysis
ELEVENLABS_SETTINGS = {
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0.0,
        "use_speaker_boost": True
    }
}

class VoiceTestingFramework:
    """
    Comprehensive voice testing framework for ElevenLabs voice assessment
    Follows clinical standards for cochlear implant voice optimization
    """
    
    def __init__(self, api_key: str, output_dir: str = "voice_analysis_output"):
        self.api_key = api_key
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.analyzer = PraatAnalyzer()
        
        # Create subdirectories
        (self.output_dir / "audio_samples").mkdir(exist_ok=True)
        (self.output_dir / "analysis_results").mkdir(exist_ok=True)
        
        logger.info(f"VoiceTestingFramework initialized. Output: {self.output_dir}")
    
    def generate_test_audio(self, voice_id: str, voice_name: str, 
                           phrase_type: str = "rainbow_passage") -> str:
        """
        Generate audio sample using ElevenLabs for testing
        
        Args:
            voice_id: ElevenLabs voice ID
            voice_name: Human-readable voice name for files
            phrase_type: Type of test phrase to use
            
        Returns:
            Path to generated audio file
        """
        # Select test text based on phrase type
        if phrase_type == "rainbow_passage":
            text = CLINICAL_TEST_PHRASES["rainbow_passage"]
        elif phrase_type == "hint_sentence":
            text = CLINICAL_TEST_PHRASES["hint_sentences"][0]  # Use first HINT sentence
        elif phrase_type == "phonetic_balance":
            text = CLINICAL_TEST_PHRASES["phonetic_balance"][0]
        else:
            text = CLINICAL_TEST_PHRASES["rainbow_passage"]  # Default
        
        # API request
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        
        data = {
            "text": text,
            "model_id": ELEVENLABS_SETTINGS["model_id"],
            "voice_settings": ELEVENLABS_SETTINGS["voice_settings"]
        }
        
        logger.info(f"Generating audio for {voice_name} using {phrase_type}")
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            # Save audio file
            filename = f"{voice_name}_{phrase_type}.mp3"
            file_path = self.output_dir / "audio_samples" / filename
            
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"Audio saved: {file_path}")
            return str(file_path)
        else:
            logger.error(f"Audio generation failed: {response.status_code} - {response.text}")
            raise Exception(f"ElevenLabs API error: {response.status_code}")
    
    def analyze_voice_batch(self, voice_configs: Dict[str, str], 
                           phrase_type: str = "rainbow_passage") -> Dict[str, VoiceAnalysisResult]:
        """
        Generate and analyze multiple voices in batch
        
        Args:
            voice_configs: Dict mapping voice_name -> voice_id
            phrase_type: Test phrase type to use
            
        Returns:
            Dict mapping voice_name -> VoiceAnalysisResult
        """
        results = {}
        
        logger.info(f"Starting batch analysis of {len(voice_configs)} voices")
        
        for voice_name, voice_id in voice_configs.items():
            try:
                # Generate audio sample
                audio_path = self.generate_test_audio(voice_id, voice_name, phrase_type)
                
                # Determine analysis profile based on voice name
                profile = "ci_male" if "male" in voice_name.lower() else "ci_female_child"
                
                # Analyze voice characteristics
                result = self.analyzer.analyze(audio_path, profile, voice_name)
                results[voice_name] = result
                
                logger.info(f"Completed {voice_name}: F0={result.mean_f0:.1f}Hz")
                
                # Rate limiting for API
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Failed to process {voice_name}: {str(e)}")
                continue
        
        # Save batch results
        self._save_batch_results(results, phrase_type)
        
        return results
    
    def _save_batch_results(self, results: Dict[str, VoiceAnalysisResult], phrase_type: str):
        """Save batch analysis results to JSON"""
        results_dict = {name: result.to_dict() for name, result in results.items()}
        
        output_file = self.output_dir / "analysis_results" / f"batch_analysis_{phrase_type}.json"
        with open(output_file, 'w') as f:
            json.dump(results_dict, f, indent=2)
        
        logger.info(f"Batch results saved: {output_file}")
    
    def generate_clinical_report(self, results: Dict[str, VoiceAnalysisResult]) -> str:
        """
        Generate clinical assessment report with CI-specific recommendations
        
        Args:
            results: Voice analysis results
            
        Returns:
            Formatted clinical report string
        """
        # Separate male and female voices
        male_voices = {name: result for name, result in results.items() 
                      if "male" in name.lower() and "female" not in name.lower()}
        female_voices = {name: result for name, result in results.items() 
                        if "female" in name.lower()}
        
        report = []
        report.append("=" * 80)
        report.append("CLINICAL VOICE ANALYSIS REPORT - COCHLEAR IMPLANT OPTIMIZATION")
        report.append("=" * 80)
        report.append("")
        
        # Summary statistics
        report.append("EXECUTIVE SUMMARY:")
        report.append(f"• Total voices analyzed: {len(results)}")
        report.append(f"• Male voices: {len(male_voices)}")
        report.append(f"• Female voices: {len(female_voices)}")
        report.append("")
        
        # F0 analysis for CI users
        report.append("F0 ANALYSIS FOR COCHLEAR IMPLANT USERS:")
        report.append("(Optimal ranges: Male 85-180Hz, Female 165-265Hz)")
        report.append("")
        
        # Male voice analysis
        if male_voices:
            report.append("MALE VOICES:")
            for name, result in male_voices.items():
                ci_suitability = self._assess_ci_suitability(result, "male")
                report.append(f"  {name.upper()}:")
                report.append(f"    F0: {result.mean_f0:.1f}Hz (Range: {result.f0_range:.1f}Hz)")
                report.append(f"    Voice Quality: Jitter={result.jitter_ppq5:.4f}, Shimmer={result.shimmer_apq11:.4f}")
                report.append(f"    HNR: {result.hnr:.2f}dB, Voiced: {result.voiced_fraction:.3f}")
                report.append(f"    CI Suitability: {ci_suitability}")
                report.append("")
        
        # Female voice analysis
        if female_voices:
            report.append("FEMALE VOICES:")
            for name, result in female_voices.items():
                ci_suitability = self._assess_ci_suitability(result, "female")
                report.append(f"  {name.upper()}:")
                report.append(f"    F0: {result.mean_f0:.1f}Hz (Range: {result.f0_range:.1f}Hz)")
                report.append(f"    Voice Quality: Jitter={result.jitter_ppq5:.4f}, Shimmer={result.shimmer_apq11:.4f}")
                report.append(f"    HNR: {result.hnr:.2f}dB, Voiced: {result.voiced_fraction:.3f}")
                report.append(f"    CI Suitability: {ci_suitability}")
                report.append("")
        
        # Clinical recommendations
        report.append("CLINICAL RECOMMENDATIONS:")
        best_male = self._find_best_voice(male_voices, "male") if male_voices else None
        best_female = self._find_best_voice(female_voices, "female") if female_voices else None
        
        if best_male:
            report.append(f"• Recommended male voice: {best_male[0]} (F0: {best_male[1].mean_f0:.1f}Hz)")
        if best_female:
            report.append(f"• Recommended female voice: {best_female[0]} (F0: {best_female[1].mean_f0:.1f}Hz)")
        
        report.append("")
        report.append("METHODOLOGY:")
        report.append("• Analysis based on Rainbow Passage clinical standard")
        report.append("• Praat analysis with CI-optimized parameters")
        report.append("• F0 ranges optimized for cochlear implant pitch discrimination")
        report.append("• Voice quality assessed via jitter (PPQ5) and shimmer (APQ11)")
        
        return "\n".join(report)
    
    def _assess_ci_suitability(self, result: VoiceAnalysisResult, gender: str) -> str:
        """Assess voice suitability for CI users based on clinical criteria"""
        f0 = result.mean_f0
        
        # CI-optimized F0 ranges
        if gender == "male":
            if 85 <= f0 <= 180:
                f0_score = "Excellent"
            elif 70 <= f0 <= 200:
                f0_score = "Good"
            else:
                f0_score = "Suboptimal"
        else:  # female
            if 165 <= f0 <= 265:
                f0_score = "Excellent"
            elif 150 <= f0 <= 300:
                f0_score = "Good"
            else:
                f0_score = "Suboptimal"
        
        # Voice quality assessment
        if result.jitter_ppq5 < 0.01 and result.shimmer_apq11 < 0.05:
            quality_score = "High"
        elif result.jitter_ppq5 < 0.02 and result.shimmer_apq11 < 0.08:
            quality_score = "Good"
        else:
            quality_score = "Fair"
        
        return f"{f0_score} F0, {quality_score} Quality"
    
    def _find_best_voice(self, voices: Dict[str, VoiceAnalysisResult], 
                        gender: str) -> Tuple[str, VoiceAnalysisResult]:
        """Find the best voice based on CI suitability criteria"""
        best_score = -1
        best_voice = None
        
        for name, result in voices.items():
            score = self._calculate_ci_score(result, gender)
            if score > best_score:
                best_score = score
                best_voice = (name, result)
        
        return best_voice
    
    def _calculate_ci_score(self, result: VoiceAnalysisResult, gender: str) -> float:
        """Calculate CI suitability score (0-100)"""
        score = 0
        
        # F0 scoring (40% weight)
        f0 = result.mean_f0
        if gender == "male":
            if 85 <= f0 <= 180:
                score += 40
            elif 70 <= f0 <= 200:
                score += 30
            else:
                score += 10
        else:  # female
            if 165 <= f0 <= 265:
                score += 40
            elif 150 <= f0 <= 300:
                score += 30
            else:
                score += 10
        
        # Voice quality scoring (30% weight)
        if result.jitter_ppq5 < 0.01:
            score += 15
        elif result.jitter_ppq5 < 0.02:
            score += 10
        
        if result.shimmer_apq11 < 0.05:
            score += 15
        elif result.shimmer_apq11 < 0.08:
            score += 10
        
        # HNR scoring (20% weight)
        if result.hnr > 15:
            score += 20
        elif result.hnr > 10:
            score += 15
        elif result.hnr > 5:
            score += 10
        
        # Voiced fraction (10% weight)
        if result.voiced_fraction > 0.8:
            score += 10
        elif result.voiced_fraction > 0.6:
            score += 7
        elif result.voiced_fraction > 0.4:
            score += 4
        
        return score

def main():
    """Run comprehensive voice testing"""
    # You'll need to set your ElevenLabs API key
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        print("Please set ELEVENLABS_API_KEY environment variable")
        return
    
    # Initialize testing framework
    tester = VoiceTestingFramework(api_key)
    
    # Run batch analysis
    print("Starting comprehensive voice analysis...")
    results = tester.analyze_voice_batch(TEST_VOICE_CONFIGS)
    
    # Generate clinical report
    report = tester.generate_clinical_report(results)
    
    # Save and display report
    report_file = tester.output_dir / "clinical_voice_assessment_report.txt"
    with open(report_file, 'w') as f:
        f.write(report)
    
    print(f"\nClinical report saved: {report_file}")
    print("\n" + report)

if __name__ == "__main__":
    main()