import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  earnedAt?: string;
}

interface AchievementGridProps {
  achievements: Achievement[];
  allAchievements: Achievement[];
}

export const AchievementGrid: React.FC<AchievementGridProps> = ({ achievements, allAchievements }) => {
  const earnedIds = new Set(achievements.map(a => a.id));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {allAchievements.map((achievement, index) => {
        const isEarned = earnedIds.has(achievement.id);
        const earnedData = achievements.find(a => a.id === achievement.id);

        return (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative p-5 rounded-2xl border transition-all overflow-hidden ${
              isEarned
                ? 'bg-white dark:bg-gray-800 border-violet-200 dark:border-violet-900 shadow-sm'
                : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-60 grayscale'
            }`}
          >
            {isEarned && (
              <div className="absolute top-2 right-2 text-violet-500">
                <CheckCircle2 size={16} />
              </div>
            )}

            <div className="flex gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
                isEarned ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
              }`}>
                {achievement.icon || '🏆'}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-sm truncate ${isEarned ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {achievement.name}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
                  {achievement.description}
                </p>
                <div className="flex items-center gap-2 mt-3">
                   <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                     isEarned ? 'bg-violet-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                   }`}>
                     +{achievement.xpReward} XP
                   </div>
                   {isEarned && earnedData?.earnedAt && (
                     <span className="text-[10px] text-gray-400">
                       Unlocked {new Date(earnedData.earnedAt).toLocaleDateString()}
                     </span>
                   )}
                </div>
              </div>
            </div>

            {!isEarned && (
               <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800">
                  <div className="h-full bg-gray-300 dark:bg-gray-700" style={{ width: '0%' }} />
               </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
