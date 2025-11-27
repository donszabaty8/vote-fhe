import React, { useState } from 'react';
import { CheckCircleIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

interface Poll {
  id: number;
  creator: string;
  question: string;
  options: string[];
  startTime: number;
  endTime: number;
  finalized: boolean;
  voteCount: number;
}

interface VotePollProps {
  poll: Poll;
  onVote: (pollId: number, optionIndex: number) => Promise<void>;
  onViewResults: (pollId: number) => void;
  hasVoted: boolean;
  isLoading: boolean;
}

const VotePoll: React.FC<VotePollProps> = ({ poll, onVote, onViewResults, hasVoted }) => {
  const { t, language } = useLanguage();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const now = Math.floor(Date.now() / 1000);
  const isActive = now >= poll.startTime && now <= poll.endTime;
  const isEnded = now > poll.endTime;
  const timeLeft = poll.endTime - now;

  // 格式化剩余时间
  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return t('vote.ended');

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}${language === 'zh' ? '小时' : 'h'}${minutes}${language === 'zh' ? '分钟' : 'm'}`;
    } else if (minutes > 0) {
      return `${minutes}${language === 'zh' ? '分钟' : 'm'}${secs}${language === 'zh' ? '秒' : 's'}`;
    } else {
      return `${secs}${language === 'zh' ? '秒' : 's'}`;
    }
  };

  // 处理投票
  const handleVote = async () => {
    if (selectedOption === null) {
      toast.error(t('msg.selectOption'));
      return;
    }

    setIsVoting(true);
    try {
      await onVote(poll.id, selectedOption);
      toast.success(t('msg.voteSuccess'));
    } catch (error) {
      console.error('投票失败:', error);
      toast.error(language === 'zh' ? '投票失败，请重试' : 'Vote failed, please retry');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="card animate-slide-up">
      {/* 投票状态标识 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isActive ? 'bg-green-500 animate-pulse-slow' :
            isEnded ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>
          <span className={`text-sm font-medium ${
            isActive ? 'text-green-600' :
            isEnded ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {isActive ? t('vote.active') : isEnded ? t('vote.ended') : t('vote.notStarted')}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <UserGroupIcon className="w-4 h-4" />
            <span>{poll.voteCount} {t('vote.votes')}</span>
          </div>

          {isActive && (
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4" />
              <span>{formatTimeLeft(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 投票标题 */}
      <h3 className="text-xl font-bold text-gray-800 mb-6">{poll.question}</h3>

      {/* 投票选项 */}
      <div className="space-y-3 mb-6">
        {poll.options.map((option, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-lg border-2 transition-all duration-200 cursor-pointer group ${
              selectedOption === index
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            } ${!isActive || hasVoted ? 'cursor-not-allowed opacity-60' : ''}`}
            onClick={() => {
              if (isActive && !hasVoted) {
                setSelectedOption(index);
              }
            }}
          >
            <div className="p-4 flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedOption === index
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300 group-hover:border-gray-400'
              }`}>
                {selectedOption === index && (
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                )}
              </div>

              <div className="flex-1 flex items-center justify-between">
                <span className={`font-medium ${
                  selectedOption === index ? 'text-primary-700' : 'text-gray-700'
                }`}>
                  {option}
                </span>

                <div className="text-sm text-gray-500">
                  选项 {String.fromCharCode(65 + index)}
                </div>
              </div>
            </div>

            {/* 选中状态的动画背景 */}
            {selectedOption === index && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100/50 to-transparent pointer-events-none"></div>
            )}
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-3">
        {isActive && !hasVoted ? (
          <button
            onClick={handleVote}
            disabled={selectedOption === null || isVoting}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isVoting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('vote.submitting')}</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                <span>{t('vote.submit')}</span>
              </>
            )}
          </button>
        ) : hasVoted ? (
          <div className="flex-1 bg-green-100 text-green-700 px-6 py-3 rounded-lg flex items-center justify-center space-x-2">
            <CheckCircleIcon className="w-5 h-5" />
            <span>{t('vote.voted')}</span>
          </div>
        ) : !isActive ? (
          <div className="flex-1 bg-gray-100 text-gray-500 px-6 py-3 rounded-lg text-center">
            {isEnded ? t('vote.ended') : t('vote.notStartedYet')}
          </div>
        ) : null}

        {(isEnded || hasVoted) && (
          <button
            onClick={() => onViewResults(poll.id)}
            className="flex-shrink-0 btn-secondary flex items-center space-x-2"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>{t('vote.viewResults')}</span>
          </button>
        )}
      </div>

      {/* 投票信息 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">{t('vote.startTime')}</span>
            <br />
            <span>{new Date(poll.startTime * 1000).toLocaleString()}</span>
          </div>
          <div>
            <span className="font-medium">{t('vote.endTime')}</span>
            <br />
            <span>{new Date(poll.endTime * 1000).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotePoll;