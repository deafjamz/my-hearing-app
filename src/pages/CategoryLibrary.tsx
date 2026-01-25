import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Get all word pairs with their categories
      const { data: wordPairs, error } = await supabase
        .from('stimuli_catalog')
        .select('clinical_metadata')
        .eq('content_type', 'word_pair');

      if (error) throw error;

      // Count pairs per category
      const categoryMap: Record<string, number> = {};
      wordPairs?.forEach((pair) => {
        const category = pair.clinical_metadata?.contrast_category;
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

  const getCategoryDescription = (category: string): string => {
    const descriptions: Record<string, string> = {
      'Vowels': 'Practice distinguishing different vowel sounds',
      'Consonant Voicing': 'Tell the difference between voiced and unvoiced consonants',
      'Manner': 'Focus on how sounds are produced',
      'Place': 'Practice sounds made in different parts of the mouth',
      'Sibilants': 'Master S, Z, SH, and similar hissing sounds',
      'Plosives': 'Practice explosive sounds like P, B, T, D, K, G',
      'Fricatives': 'Work on friction sounds like F, V, TH',
      'Nasals': 'Distinguish M, N, and NG sounds',
    };
    return descriptions[category] || `Practice ${category.toLowerCase()} sound distinctions`;
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
    return colors[category] || 'from-violet-500 to-purple-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading categories...</div>
      </div>
    );
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                to={`/practice/category/${encodeURIComponent(category.name)}`}
                className="block group"
              >
                <div className="relative overflow-hidden p-6 bg-slate-900 border-2 border-slate-800 rounded-3xl hover:border-slate-700 transition-all">
                  {/* Gradient accent */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${category.color} opacity-20 blur-3xl`} />

                  <div className="relative">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Zap className="h-6 w-6 text-white" strokeWidth={2.5} />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                      {category.name}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                      {category.description}
                    </p>

                    {/* Count */}
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-slate-800 rounded-full">
                        <span className="text-slate-300 text-xs font-medium">
                          {category.count} pairs
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
