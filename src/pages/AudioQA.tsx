import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TEST_FILES = [
  { name: 'Sarah - Pop (Raw)', src: '/audio_quality_test/sarah_Pop_raw.mp3' },
  { name: 'Sarah - Pop (Padded)', src: '/audio_quality_test/sarah_Pop_padded.mp3' },
  { name: 'Sarah - Pop (Carrier)', src: '/audio_quality_test/sarah_Pop_carrier.mp3' },
  
  { name: 'Sarah - Ssh (Raw)', src: '/audio_quality_test/sarah_Ssh_raw.mp3' },
  { name: 'Sarah - Ssh (Padded)', src: '/audio_quality_test/sarah_Ssh_padded.mp3' },
  { name: 'Sarah - Ssh (Carrier)', src: '/audio_quality_test/sarah_Ssh_carrier.mp3' },

  { name: 'David - Pop (Raw)', src: '/audio_quality_test/david_Pop_raw.mp3' },
  { name: 'David - Pop (Padded)', src: '/audio_quality_test/david_Pop_padded.mp3' },
  { name: 'David - Pop (Carrier)', src: '/audio_quality_test/david_Pop_carrier.mp3' },
];

export function AudioQA() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 pb-24">
      <header>
        <Link to="/" className="flex items-center text-gray-500 hover:text-primary-600 mb-4">
          <ArrowLeft size={20} className="mr-1" /> Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Audio Quality QA</h1>
        <p className="text-gray-500">Compare generation methods.</p>
      </header>

      <div className="grid gap-4">
        {TEST_FILES.map((file) => (
          <AudioPlayer 
            key={file.src} 
            title={file.name} 
            src={file.src} 
          />
        ))}
      </div>
    </div>
  );
}