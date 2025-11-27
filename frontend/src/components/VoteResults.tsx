import React, { useState } from 'react';
import { ChartBarIcon, KeyIcon, EyeIcon } from '@heroicons/react/24/solid';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

interface Poll {
  id: number;
  question: string;
  options: string[];
  voteCount: number;
  endTime: number;
}

interface VoteResult {
  option: string;
  count: number;
  percentage: number;
}

interface VoteResultsProps {
  poll: Poll;
  onDecryptResults: (pollId: number) => Promise<VoteResult[]>;
  isLoading: boolean;
}

const VoteResults: React.FC<VoteResultsProps> = ({ poll, onDecryptResults, isLoading }) => {
  const { t } = useLanguage();
  const [results, setResults] = useState<VoteResult[] | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [hasDecrypted, setHasDecrypted] = useState(false);

  // 检查投票是否已结束
  const isVotingEnded = () => {
    const now = Math.floor(Date.now() / 1000);
    return now > poll.endTime;
  };

  // 处理解密结果
  const handleDecrypt = async () => {
    if (!isVotingEnded()) {
      toast.error(t('results.encrypted'));
      return;
    }

    setIsDecrypting(true);
    try {
      const decryptedResults = await onDecryptResults(poll.id);
      setResults(decryptedResults);
      setHasDecrypted(true);
      toast.success(t('msg.decryptSuccess'));
    } catch (error) {
      console.error('解密失败:', error);
      toast.error(t('results.decrypting') + ' failed');
    } finally {
      setIsDecrypting(false);
    }
  };

  const totalVotes = results?.reduce((sum, result) => sum + result.count, 0) || 0;

  return (
    <div className="card max-w-2xl mx-auto animate-slide-up">
      {/* 标题部分 */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <ChartBarIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">{t('results.title')}</h2>
          <p className="text-gray-600 text-sm mt-1">#{poll.id}</p>
        </div>
      </div>

      {/* 投票问题 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{poll.question}</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>{t('results.totalVotes')}: {poll.voteCount}</span>
          <span>{t('vote.endTime')} {new Date(poll.endTime * 1000).toLocaleString()}</span>
        </div>
      </div>

      {/* 解密状态 */}
      {!hasDecrypted ? (
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <LockClosedIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">
              {t('results.encrypted')}
            </h4>
            <p className="text-gray-600">
              {t('results.decryptDesc')}
            </p>
          </div>

          <button
            onClick={handleDecrypt}
            disabled={isDecrypting || isLoading}
            className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
          >
            {isDecrypting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{t('results.decrypting')}</span>
              </>
            ) : (
              <>
                <KeyIcon className="w-5 h-5" />
                <span>{t('results.decrypt')}</span>
              </>
            )}
          </button>

          {/* 解密说明 */}
          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start space-x-3">
              <EyeIcon className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-700">
                <p className="font-medium mb-1">{t('results.processTitle')}</p>
                <ul className="space-y-1 text-amber-600">
                  <li>{t('results.process.line1')}</li>
                  <li>{t('results.process.line2')}</li>
                  <li>{t('results.process.line3')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : results ? (
        /* 解密后的结果展示 */
        <div className="space-y-6">
          {/* 结果概览 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium">{t('results.decryptionComplete')}</span>
            </div>
            <p className="text-green-600 text-sm">
              {t('results.successMsg')} {totalVotes} {t('results.votesDecrypted')}
            </p>
          </div>

          {/* 投票结果图表 */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 mb-4">{t('results.detailedResults')}</h4>

            {results.map((result, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${
                      index === 0 ? 'from-blue-400 to-blue-600' :
                      index === 1 ? 'from-green-400 to-green-600' :
                      index === 2 ? 'from-purple-400 to-purple-600' :
                      index === 3 ? 'from-yellow-400 to-yellow-600' :
                      index === 4 ? 'from-pink-400 to-pink-600' :
                      'from-gray-400 to-gray-600'
                    }`}></div>
                    <span className="font-medium text-gray-800">{result.option}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-gray-800">{result.count}</span>
                    <span className="text-lg text-gray-500">({result.percentage.toFixed(1)}%)</span>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${
                      index === 0 ? 'from-blue-400 to-blue-600' :
                      index === 1 ? 'from-green-400 to-green-600' :
                      index === 2 ? 'from-purple-400 to-purple-600' :
                      index === 3 ? 'from-yellow-400 to-yellow-600' :
                      index === 4 ? 'from-pink-400 to-pink-600' :
                      'from-gray-400 to-gray-600'
                    }`}
                    style={{
                      width: `${result.percentage}%`,
                      animationDelay: `${index * 200}ms`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* 获胜结果 */}
          {results.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-semibold text-gray-800 mb-2">{t('results.winner')}</h5>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                <span className="text-lg font-bold text-gray-800">
                  {results.reduce((winner, current) =>
                    current.count > winner.count ? current : winner
                  ).option}
                </span>
                <span className="text-gray-600">
                  ({results.reduce((winner, current) =>
                    current.count > winner.count ? current : winner
                  ).count} {t('vote.votes')})
                </span>
              </div>
            </div>
          )}

          {/* 技术信息 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">{t('results.techInfo')}</p>
              <ul className="space-y-1">
                <li>{t('results.tech.line1')}</li>
                <li>{t('results.tech.line2')}</li>
                <li>{t('results.tech.line3')}</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-500">暂无结果数据</div>
        </div>
      )}
    </div>
  );
};

export default VoteResults;