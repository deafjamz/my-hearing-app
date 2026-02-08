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
  const categoryInfo: Record<string, { friendly: string; description: string; example: string }> = {
    'Vowels': { friendly: 'Vowel Sounds', description: 'Hear the difference between similar vowel sounds', example: "e.g., 'bit' vs 'bet'" },
    'Consonant Voicing': { friendly: 'Similar Sounds', description: 'Tell apart sounds that are almost identical', example: "e.g., 'bat' vs 'pat'" },
    'Manner': { friendly: 'Sound Patterns', description: 'Focus on how different sounds are made', example: "e.g., 'mat' vs 'bat'" },
    'Place': { friendly: 'Sound Positions', description: 'Spot where sounds are made in the mouth', example: "e.g., 'tea' vs 'key'" },
    'Sibilants': { friendly: 'Hissing Sounds', description: 'Master the sharp S, Z, and SH sounds', example: "e.g., 'sip' vs 'zip'" },
    'Plosives': { friendly: 'Pop & Burst Sounds', description: 'Practice quick, punchy sounds', example: "e.g., 'pin' vs 'bin'" },
    'Fricatives': { friendly: 'Friction Sounds', description: 'Work on the breathy F, V, and TH sounds', example: "e.g., 'fan' vs 'van'" },
    'Nasals': { friendly: 'Nasal Sounds', description: 'Distinguish the humming M, N, and NG sounds', example: "e.g., 'map' vs 'nap'" },
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

                    {/* Title — friendly name with clinical subtitle */}
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-teal-400 transition-colors">
                      {categoryInfo[category.name]?.friendly || category.name}
                    </h3>
                    {categoryInfo[category.name] && (
                      <p className="text-xs text-slate-500 mb-2">{category.name}</p>
                    )}

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
