import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Target, Zap } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { LoadingSpinner } from '@/components/LoadingSpinner';

/**
 * Category Library - Browse word pairs by contrast category
 * Provides free exploration outside of structured programs
 */

interface Category {
  name: string;
  count: number;
  description: string;
  color: string;
}

export function CategoryLibrary() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Get all word pairs with their categories from word_pairs table
      const { data: wordPairs, error } = await supabase
        .from('word_pairs')
        .select('clinical_category');

      if (error) throw error;

      // Count pairs per category
      const categoryMap: Record<string, number> = {};
      wordPairs?.forEach((pair) => {
        const category = pair.clinical_category;
        if (category) {
          categoryMap[category] = (categoryMap[category] || 0) + 1;
        }
      });

      // Create category objects with descriptions and colors
      const categoryData: Category[] = Object.entries(categoryMap).map(([name, count]) => ({
        name,
        count,
        description: getCategoryDescription(name),
        color: getCategoryColor(name),
      }));

      // Sort by count (most popular first)
      categoryData.sort((a, b) => b.count - a.count);

      setCategories(categoryData);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Friendly names + examples for approachable cards (F-013)
  // Keys match actual DB values from word_pairs.clinical_category (e.g., "Set 1: Voicing Contrast")
  const categoryInfo: Record<string, { friendly: string; description: string; example: string }> = {
    // Actual DB values (from words_master.csv Set column)
    'Set 1: Voicing Contrast': { friendly: 'Same or Different?', description: 'Tell apart sounds that are almost identical', example: "'bat' vs 'pat'" },
    'Set 2: Nasal Contrast': { friendly: 'Humming Sounds', description: 'Hear the difference between M, N, and NG', example: "'map' vs 'nap'" },
    'Set 3: Vowel Height': { friendly: 'Vowel Sounds', description: 'Spot the difference between similar vowels', example: "'bit' vs 'bet'" },
    'Set 4: Ling Sounds Emphasis': { friendly: 'Core Sounds', description: 'The 6 key sounds used in hearing checks', example: "'ah' vs 'ee'" },
    'Set 5: Place of Articulation': { friendly: 'Where in the Mouth?', description: 'Sounds made in different places', example: "'tea' vs 'key'" },
    'Set 6: Manner of Articulation': { friendly: 'How Sounds Are Made', description: 'Stops, slides, and hums — different types of sounds', example: "'mat' vs 'bat'" },
    'Set 7: Word Initial Clusters': { friendly: 'Tricky Beginnings', description: 'Words that start with blended sounds', example: "'play' vs 'pray'" },
    'Set 8: Word Final Clusters': { friendly: 'Tricky Endings', description: 'Words that end with blended sounds', example: "'mist' vs 'miss'" },
    'Set 9: Multi-Syllabic Simple': { friendly: 'Longer Words', description: 'Two-syllable words with clear contrasts', example: "'candy' vs 'sandy'" },
    'Set 10: Multi-Syllabic Complex': { friendly: 'Challenge Words', description: 'Longer words with subtle differences', example: "'complete' vs 'compete'" },
    // Legacy keys (in case some DB rows use short names)
    'Vowels': { friendly: 'Vowel Sounds', description: 'Hear the difference between similar vowels', example: "'bit' vs 'bet'" },
    'Consonant Voicing': { friendly: 'Same or Different?', description: 'Tell apart sounds that are almost identical', example: "'bat' vs 'pat'" },
    'Manner': { friendly: 'How Sounds Are Made', description: 'Focus on how different sounds are made', example: "'mat' vs 'bat'" },
    'Place': { friendly: 'Where in the Mouth?', description: 'Sounds made in different places', example: "'tea' vs 'key'" },
    'Sibilants': { friendly: 'Sharp Sounds', description: 'Master the S, Z, and SH sounds', example: "'sip' vs 'zip'" },
    'Plosives': { friendly: 'Pop Sounds', description: 'Practice quick, punchy sounds', example: "'pin' vs 'bin'" },
    'Fricatives': { friendly: 'Breathy Sounds', description: 'Work on the F, V, and TH sounds', example: "'fan' vs 'van'" },
    'Nasals': { friendly: 'Humming Sounds', description: 'Distinguish the M, N, and NG sounds', example: "'map' vs 'nap'" },
  };

  const getCategoryDescription = (category: string): string => {
    return categoryInfo[category]?.description || `Practice ${category.toLowerCase()} sound distinctions`;
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Vowels': 'from-rose-500 to-pink-600',
      'Consonant Voicing': 'from-blue-500 to-indigo-600',
      'Manner': 'from-green-500 to-emerald-600',
      'Place': 'from-orange-500 to-amber-600',
      'Sibilants': 'from-purple-500 to-violet-600',
      'Plosives': 'from-red-500 to-rose-600',
      'Fricatives': 'from-teal-500 to-cyan-600',
      'Nasals': 'from-yellow-500 to-orange-600',
    };
    return colors[category] || 'from-teal-500 to-teal-600';
  };

  if (loading) {
    return <LoadingSpinner message="Loading categories..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/practice"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Practice Hub</span>
          </Link>

          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Target className="h-7 w-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Word Pair Categories</h1>
              <p className="text-slate-400 text-sm mt-1">Practice by sound type</p>
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category, idx) => (
            <motion.div
              key={category.name}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : idx * 0.05, duration: prefersReducedMotion ? 0 : undefined }}
            >
              <Link
                to={`/practice/category/${encodeURIComponent(category.name)}`}
                className="block group"
              >
                <div className="relative overflow-hidden p-6 bg-slate-900 border-2 border-slate-800 rounded-3xl hover:border-slate-700 transition-all">
                  <div className="relative">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-4">
                      <Zap className="h-6 w-6 text-teal-400" strokeWidth={2.5} />
                    </div>

                    {/* Title — friendly name only */}
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-teal-400 transition-colors">
                      {categoryInfo[category.name]?.friendly || category.name}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-400 text-sm mb-2 leading-relaxed">
                      {category.description}
                    </p>

                    {/* Example word pair */}
                    {categoryInfo[category.name]?.example && (
                      <p className="text-sm text-slate-400/80 mb-4 italic">
                        {categoryInfo[category.name].example}
                      </p>
                    )}

                    {/* Session info instead of raw count */}
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-slate-800 rounded-full">
                        <span className="text-slate-300 text-xs font-medium">
                          10 per session · ~2 min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-16">
            <div className="text-slate-500 mb-4">No categories found</div>
            <p className="text-slate-600 text-sm">
              Word pairs need to be loaded into the database first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
