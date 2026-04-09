import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  hideBack?: boolean;
};

export default function PageHeader({ title, onBack, right, hideBack }: Props) {
  return (
    <div className="px-6 pt-6 pb-4 bg-white/90 backdrop-blur-sm border-b border-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!hideBack && (
            onBack ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            ) : (
              <div className="w-10 h-10" />
            )
          )}
          <div className="text-xl font-black text-slate-800">{title}</div>
        </div>
        <div>{right}</div>
      </div>
    </div>
  );
}

