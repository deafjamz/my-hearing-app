#!/usr/bin/env python3
"""
Voice Analysis System for ElevenLabs Voices - Cochlear Implant Optimization
Clinical-grade voice analysis using Praat/Parselmouth for F0, jitter, shimmer, and HNR measurements
"""

import parselmouth
from parselmouth.praat import call
import numpy as np
import os
import json
from pathlib import Path
from typing import Dict, List, Optional, Union
import logging
from dataclasses import dataclass, asdict

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class VoiceAnalysisResult:
    """Clinical voice analysis results"""
    voice_id: str
    filename: str
    
    # F0 measurements
    mean_f0: float
    median_f0: float
    f0_range: float
    f0_std: float
    
    # Voice quality measurements
    jitter_ppq5: float
    shimmer_apq11: float
    hnr: float
    
    # Clinical assessment
    voiced_fraction: float
    profile_used: str
    
    # Metadata
    duration_seconds: float
    sample_rate: int
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)

# Clinical analysis profiles optimized for CI users based on research
ANALYSIS_PROFILES = {
    "ci_male": {
        "pitch_floor": 50.0,
        "pitch_ceiling": 200.0,
        "voicing_threshold": 0.25,  # Lower for CI users
        "silence_threshold": 0.01,
        "octave_cost": 0.01,
        "voiced_unvoiced_cost": 0.14,
        "jitter_period_factor": 1.3,
        "shimmer_period_factor": 1.6,
        "description": "Male cochlear implant users - optimized F0 range and sensitivity"
    },
    "ci_female_child": {
        "pitch_floor": 50.0,
        "pitch_ceiling": 250.0,
        "voicing_threshold": 0.25,
        "silence_threshold": 0.01,
        "octave_cost": 0.01,
        "voiced_unvoiced_cost": 0.14,
        "jitter_period_factor": 1.3,
        "shimmer_period_factor": 1.6,
        "description": "Female/child cochlear implant users - extended high-frequency range"
    },
    "standard_clinical": {
        "pitch_floor": 60.0,
        "pitch_ceiling": 600.0,
        "voicing_threshold": 0.45,
        "silence_threshold": 0.03,
        "octave_cost": 0.01,
        "voiced_unvoiced_cost": 0.14,
        "jitter_period_factor": 1.3,
        "shimmer_period_factor": 1.6,
        "description": "Standard clinical voice assessment parameters"
    }
}

class PraatAnalyzer:
    """
    Clinical voice analysis using Parselmouth/Praat
    Optimized for cochlear implant user voice selection and assessment
    """
    
    def __init__(self, profiles: Dict = ANALYSIS_PROFILES):
        self.profiles = profiles
        logger.info(f"PraatAnalyzer initialized with {len(profiles)} analysis profiles")
    
    def analyze(self, audio_file_path: str, profile_name: str = "ci_male", 
                voice_id: str = None) -> VoiceAnalysisResult:
        """
        Perform comprehensive voice analysis on audio file
        
        Args:
            audio_file_path: Path to audio file (WAV, MP3, M4A supported)
            profile_name: Analysis profile to use from ANALYSIS_PROFILES
            voice_id: Optional voice identifier for tracking
            
        Returns:
            VoiceAnalysisResult with clinical measurements
        """
        if profile_name not in self.profiles:
            raise ValueError(f"Profile '{profile_name}' not found. Available: {list(self.profiles.keys())}")
        
        if not os.path.exists(audio_file_path):
            raise FileNotFoundError(f"Audio file not found: {audio_file_path}")
        
        profile = self.profiles[profile_name]
        voice_id = voice_id or Path(audio_file_path).stem
        
        logger.info(f"Analyzing {audio_file_path} with profile '{profile_name}'")
        
        try:
            # Load and preprocess audio
            sound = parselmouth.Sound(audio_file_path)
            processed_sound = self._preprocess_audio(sound)
            
            # Extract pitch (F0) measurements
            pitch = call(processed_sound, "To Pitch", 0.0, 
                        profile['pitch_floor'], profile['pitch_ceiling'])
            
            # F0 statistics
            mean_f0 = call(pitch, "Get mean", 0, 0, "Hertz")
            median_f0 = call(pitch, "Get quantile", 0, 0, 0.50, "Hertz")
            f0_min = call(pitch, "Get minimum", 0, 0, "Hertz", "Parabolic")
            f0_max = call(pitch, "Get maximum", 0, 0, "Hertz", "Parabolic")
            f0_std = call(pitch, "Get standard deviation", 0, 0, "Hertz")
            
            # Create point process for jitter/shimmer analysis
            point_process = call(processed_sound, "To PointProcess (periodic, cc)", 
                               profile['pitch_floor'], profile['pitch_ceiling'])
            
            # Voice quality measurements using exact clinical syntax
            jitter_ppq5 = call(point_process, "Get jitter (ppq5)", 0, 0, 0.0001, 0.02, 
                              profile['jitter_period_factor'])
            
            shimmer_apq11 = call([processed_sound, point_process], "Get shimmer (apq11)", 
                                0, 0, 0.0001, 0.02, profile['jitter_period_factor'], 
                                profile['shimmer_period_factor'])
            
            # Harmonics-to-Noise Ratio
            harmonicity = call(processed_sound, "To Harmonicity (cc)", 0.01, 
                              profile['pitch_floor'], profile['silence_threshold'], 1.0)
            hnr = call(harmonicity, "Get mean", 0, 0)
            
            # Voiced fraction analysis
            voiced_fraction = call(pitch, "Count voiced frames") / call(pitch, "Get number of frames")
            
            # Handle NaN values (common in Praat analysis)
            def safe_float(value, default=0.0):
                return float(value) if not np.isnan(value) else default
            
            result = VoiceAnalysisResult(
                voice_id=voice_id,
                filename=Path(audio_file_path).name,
                mean_f0=safe_float(mean_f0),
                median_f0=safe_float(median_f0),
                f0_range=safe_float(f0_max - f0_min) if not np.isnan(f0_max) and not np.isnan(f0_min) else 0.0,
                f0_std=safe_float(f0_std),
                jitter_ppq5=safe_float(jitter_ppq5),
                shimmer_apq11=safe_float(shimmer_apq11),
                hnr=safe_float(hnr),
                voiced_fraction=safe_float(voiced_fraction),
                profile_used=profile_name,
                duration_seconds=sound.duration,
                sample_rate=int(sound.sampling_frequency)
            )
            
            logger.info(f"Analysis complete: F0={result.mean_f0:.1f}Hz, "
                       f"Jitter={result.jitter_ppq5:.4f}, Shimmer={result.shimmer_apq11:.4f}")
            
            return result
            
        except Exception as e:
            logger.error(f"Analysis failed for {audio_file_path}: {str(e)}")
            raise
    
    def _preprocess_audio(self, sound: parselmouth.Sound) -> parselmouth.Sound:
        """
        Preprocess audio for optimal Praat analysis
        
        Args:
            sound: Parselmouth Sound object
            
        Returns:
            Preprocessed Sound object
        """
        # Convert to mono if stereo
        if sound.n_channels > 1:
            sound = sound.convert_to_mono()
        
        # Resample to 16kHz if needed (optimal for speech analysis)
        target_sr = 16000
        if sound.sampling_frequency != target_sr:
            sound = sound.resample(target_sr)
        
        # Apply gentle high-pass filter to remove low-frequency noise
        filtered_sound = call(sound, "Filter (pass Hann band)", 80, 8000, 20)
        
        return filtered_sound
    
    def analyze_batch(self, audio_files: List[str], profile_name: str = "ci_male", 
                     output_file: Optional[str] = None) -> List[VoiceAnalysisResult]:
        """
        Analyze multiple audio files in batch
        
        Args:
            audio_files: List of audio file paths
            profile_name: Analysis profile to use
            output_file: Optional JSON file to save results
            
        Returns:
            List of VoiceAnalysisResult objects
        """
        results = []
        
        logger.info(f"Starting batch analysis of {len(audio_files)} files")
        
        for i, audio_file in enumerate(audio_files, 1):
            try:
                result = self.analyze(audio_file, profile_name)
                results.append(result)
                logger.info(f"Completed {i}/{len(audio_files)}: {result.voice_id}")
            except Exception as e:
                logger.error(f"Failed to analyze {audio_file}: {str(e)}")
                continue
        
        if output_file:
            self.save_results(results, output_file)
        
        logger.info(f"Batch analysis complete: {len(results)}/{len(audio_files)} successful")
        return results
    
    def save_results(self, results: List[VoiceAnalysisResult], output_file: str):
        """Save analysis results to JSON file"""
        results_dict = [result.to_dict() for result in results]
        
        with open(output_file, 'w') as f:
            json.dump(results_dict, f, indent=2)
        
        logger.info(f"Results saved to {output_file}")
    
    def load_results(self, input_file: str) -> List[VoiceAnalysisResult]:
        """Load analysis results from JSON file"""
        with open(input_file, 'r') as f:
            results_dict = json.load(f)
        
        results = [VoiceAnalysisResult(**result) for result in results_dict]
        logger.info(f"Loaded {len(results)} results from {input_file}")
        return results

def main():
    """Example usage and testing"""
    analyzer = PraatAnalyzer()
    
    # Example: analyze a single file
    try:
        # Replace with actual audio file path
        audio_file = "sample_voice.wav"
        if os.path.exists(audio_file):
            result = analyzer.analyze(audio_file, "ci_male", "sample_voice")
            print(f"Analysis Result for {result.voice_id}:")
            print(f"  Mean F0: {result.mean_f0:.1f} Hz")
            print(f"  F0 Range: {result.f0_range:.1f} Hz")
            print(f"  Jitter (PPQ5): {result.jitter_ppq5:.4f}")
            print(f"  Shimmer (APQ11): {result.shimmer_apq11:.4f}")
            print(f"  HNR: {result.hnr:.2f} dB")
            print(f"  Voiced Fraction: {result.voiced_fraction:.3f}")
    except FileNotFoundError:
        print("No sample audio file found. Place a 'sample_voice.wav' file to test.")
    
    # Print available profiles
    print(f"\nAvailable Analysis Profiles:")
    for profile_name, profile in ANALYSIS_PROFILES.items():
        print(f"  {profile_name}: {profile['description']}")

if __name__ == "__main__":
    main()