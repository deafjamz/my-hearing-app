import { Link } from 'react-router-dom';
import { useTheme } from '../store/ThemeContext';
import { useUser } from '../store/UserContext';
import { Mic, Moon, Sun, Check, Settings as SettingsIcon, Shield, FileText, ChevronRight } from 'lucide-react';

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { voice, setVoice } = useUser(); // Connect to Context

  const voices = [
    { id: 'sarah', name: 'Sarah', desc: 'Clear & Articulate' },
    { id: 'david', name: 'David', desc: 'Warm & Friendly' },
    { id: 'marcus', name: 'Marcus', desc: 'Deep & Confident' },
    { id: 'emma', name: 'Emma', desc: 'Bright & Energetic' },
  ];

  return (
    <div className="max-w-lg mx-auto w-full px-6 pt-6 pb-32"> {/* Padding for bottom nav */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
          <SettingsIcon size={20} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
      </div>

      {/* Appearance */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-1">Appearance</h2>
        <div 
          onClick={toggleTheme}
          className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm cursor-pointer hover:scale-[1.02] transition-transform duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Dark Mode</h3>
              <p className="text-xs text-slate-500 font-medium">Adjust brightness</p>
            </div>
          </div>
          <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-purple-600' : 'bg-slate-200'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </div>
      </section>

      {/* Instructor Voice */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-1">Instructor Voice</h2>
        <div className="space-y-3">
          {voices.map((v) => (
            <div 
              key={v.id}
              onClick={() => setVoice(v.id)} // ACTUAL LOGIC
              className={`flex items-center justify-between p-4 border rounded-[2rem] transition-all cursor-pointer ${
                voice === v.id 
                  ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800 ring-1 ring-purple-500/20' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  voice === v.id ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  <Mic size={20} />
                </div>
                <div>
                  <h3 className={`font-bold ${voice === v.id ? 'text-purple-900 dark:text-purple-100' : 'text-slate-900 dark:text-white'}`}>
                    {v.name}
                  </h3>
                  <p className={`text-xs font-medium ${voice === v.id ? 'text-purple-600 dark:text-purple-300' : 'text-slate-500'}`}>
                    {v.desc}
                  </p>
                </div>
              </div>
              {voice === v.id && <Check size={20} className="text-purple-600" />}
            </div>
          ))}
        </div>
      </section>

      {/* Legal */}
      <section className="mt-8">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-1">Legal</h2>
        <div className="space-y-3">
          <Link
            to="/privacy"
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Privacy Policy</h3>
                <p className="text-xs text-slate-500 font-medium">How we handle your data</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </Link>

          <Link
            to="/terms"
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Terms of Service</h3>
                <p className="text-xs text-slate-500 font-medium">Usage terms and conditions</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </Link>
        </div>
      </section>
    </div>
  );
}
