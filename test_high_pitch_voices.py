#!/usr/bin/env python3
"""
High-Pitch Female Voice Testing for CI Optimization
Testing ElevenLabs voices specifically selected for higher F0 ranges
"""

import os
from voice_testing_framework import VoiceTestingFramework
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# High-pitched female voices for CI optimization
HIGH_PITCH_FEMALE_VOICES = {
    # Current baseline for comparison
    "current_female": "EXAVITQu4vr4xnSDxMaL",    # Your current (147.4Hz - suboptimal)
    
    # New high-pitch candidates
    "hope_bright": "OYTbf65OHHFELVut7v2H",       # Hope: Bright and uplifting
    "alexandra_young": "kdmDKE6EkgrWrrykO9Qt",    # Alexandra: Young female voice
    "cassidy_energetic": "56AoDkrOh6qfVPDXZ7Pt", # Cassidy: Engaging and energetic
    "jessica_expressive": "g6xIsTj2HwM6VR4iXFCw", # Jessica: Empathetic and expressive
    "eryn_friendly": "dj3G1R1ilKoFKhBnWOzG",     # Eryn: Friendly and relatable
    
    # Additional bright voices to test
    "dorothy_warm": "ThT5KcBeYPX3keUQqHPh",      # Dorothy: Warm narrator
    "liv_clear": "CwhRBWXzGAHq8TQ4Fs17",         # Liv: Clear articulation
}

def analyze_high_pitch_voices():
    """Test high-pitch female voices for CI optimization"""
    
    # Get API key
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        print("Please set ELEVENLABS_API_KEY environment variable")
        return
    
    # Initialize testing framework
    tester = VoiceTestingFramework(api_key, "high_pitch_voice_analysis")
    
    print("🎯 Testing High-Pitch Female Voices for CI Optimization")
    print("=" * 60)
    print(f"Target F0 range: 165-265Hz (CI-optimal for females)")
    print(f"Current baseline: 147.4Hz (suboptimal)")
    print()
    
    # Run batch analysis
    results = tester.analyze_voice_batch(HIGH_PITCH_FEMALE_VOICES, "rainbow_passage")
    
    # Analyze and rank results
    print("\n🔬 F0 Analysis Results:")
    print("-" * 40)
    
    ranked_voices = []
    for name, result in results.items():
        f0 = result.mean_f0
        ci_optimal = 165 <= f0 <= 265
        improvement = f0 - 147.4  # Improvement over current
        
        ranked_voices.append({
            'name': name,
            'f0': f0,
            'ci_optimal': ci_optimal,
            'improvement': improvement,
            'result': result
        })
    
    # Sort by F0 (highest first for female voices)
    ranked_voices.sort(key=lambda x: x['f0'], reverse=True)
    
    print(f"{'Voice Name':<20} {'F0 (Hz)':<10} {'CI Optimal':<12} {'vs Current':<12} {'Quality Score'}")
    print("-" * 80)
    
    for voice in ranked_voices:
        name = voice['name']
        f0 = voice['f0']
        optimal = "✅ YES" if voice['ci_optimal'] else "❌ NO"
        improvement = f"{voice['improvement']:+.1f}Hz" if voice['improvement'] != 0 else "baseline"
        
        # Simple quality score based on HNR and jitter
        result = voice['result']
        quality = "High" if result.hnr > 12 and result.jitter_ppq5 < 0.01 else "Good" if result.hnr > 8 else "Fair"
        
        print(f"{name:<20} {f0:<10.1f} {optimal:<12} {improvement:<12} {quality}")
    
    # Recommendations
    print("\n🎯 Clinical Recommendations:")
    print("-" * 40)
    
    optimal_voices = [v for v in ranked_voices if v['ci_optimal']]
    if optimal_voices:
        best_voice = optimal_voices[0]
        print(f"✅ RECOMMENDED: {best_voice['name']} (F0: {best_voice['f0']:.1f}Hz)")
        print(f"   This voice meets CI-optimal range and shows {best_voice['improvement']:+.1f}Hz improvement")
        
        if len(optimal_voices) > 1:
            print(f"\n📋 Other CI-optimal options:")
            for voice in optimal_voices[1:]:
                print(f"   • {voice['name']}: {voice['f0']:.1f}Hz ({voice['improvement']:+.1f}Hz vs current)")
    else:
        # Find the best available (closest to optimal range)
        best_available = ranked_voices[0]
        print(f"⚠️  NO VOICES in optimal range (165-265Hz)")
        print(f"   Best available: {best_available['name']} (F0: {best_available['f0']:.1f}Hz)")
        print(f"   Still {best_available['improvement']:+.1f}Hz improvement over current")
    
    # Generate detailed report
    report = tester.generate_clinical_report(results)
    
    # Save report
    report_file = "high_pitch_voice_analysis/clinical_assessment_high_pitch.txt"
    with open(report_file, 'w') as f:
        f.write(report)
    
    print(f"\n📄 Detailed clinical report saved: {report_file}")
    
    return results, ranked_voices

if __name__ == "__main__":
    results, rankings = analyze_high_pitch_voices()