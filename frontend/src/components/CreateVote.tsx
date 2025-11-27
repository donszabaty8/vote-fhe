import React, { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ClockIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

interface CreateVoteProps {
  onCreateVote: (title: string, options: string[], duration: number) => Promise<void>;
  isLoading: boolean;
}

const CreateVote: React.FC<CreateVoteProps> = ({ onCreateVote, isLoading }) => {
  const { t, language } = useLanguage();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState([
    language === 'zh' ? '选项一' : 'Option 1',
    language === 'zh' ? '选项二' : 'Option 2'
  ]);
  const [duration, setDuration] = useState(60);

  // 添加选项
  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, language === 'zh' ? `选项${options.length + 1}` : `Option ${options.length + 1}`]);
    } else {
      toast.error(t('msg.maxOptions'));
    }
  };

  // 删除选项
  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    } else {
      toast.error(t('msg.minOptions'));
    }
  };

  // 更新选项文本
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // 提交创建投票
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(t('msg.enterTitle'));
      return;
    }

    if (options.some(option => !option.trim())) {
      toast.error(t('msg.fillAllOptions'));
      return;
    }

    try {
      await onCreateVote(title, options, duration);
      // 重置表单
      setTitle('');
      setOptions([
        language === 'zh' ? '选项一' : 'Option 1',
        language === 'zh' ? '选项二' : 'Option 2'
      ]);
      setDuration(60);
      toast.success(t('msg.createSuccess'));
    } catch (error) {
      console.error('创建投票失败:', error);
      toast.error(language === 'zh' ? '创建投票失败，请重试' : 'Failed to create poll, please retry');
    }
  };

  return (
    <div className="card max-w-2xl mx-auto animate-slide-up">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <QuestionMarkCircleIcon className="w-6 h-6 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{t('create.title')}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 投票标题 */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {t('create.pollTitle')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field text-lg"
            placeholder={t('create.pollTitlePlaceholder')}
            maxLength={100}
            required
          />
          <div className="text-sm text-gray-500">
            {title.length}/100 {t('common.character')}
          </div>
        </div>

        {/* 投票选项 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-700">
              {t('create.options')}
            </label>
            <span className="text-sm text-gray-500">
              {options.length}/10 {t('create.options')}
            </span>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 group"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium text-sm">
                  {String.fromCharCode(65 + index)}
                </div>

                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 input-field"
                  placeholder={`${t('common.option')} ${String.fromCharCode(65 + index)}`}
                  maxLength={50}
                  required
                />

                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="flex-shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    title={language === 'zh' ? '删除选项' : 'Delete option'}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 添加选项按钮 */}
          <button
            type="button"
            onClick={addOption}
            disabled={options.length >= 10}
            className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600 font-medium">{t('create.addOption')}</span>
          </button>
        </div>

        {/* 投票持续时间 */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
            <ClockIcon className="w-4 h-4" />
            <span>{t('create.duration')}</span>
          </label>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t('time.5min'), value: 5 },
              { label: t('time.15min'), value: 15 },
              { label: t('time.30min'), value: 30 },
              { label: t('time.1hour'), value: 60 },
              { label: t('time.3hours'), value: 180 },
              { label: t('time.24hours'), value: 1440 },
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setDuration(preset.value)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  duration === preset.value
                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                    : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min="1"
              max="10080"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <span className="text-sm text-gray-600">{t('time.minutes')}</span>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading || !title.trim() || options.some(option => !option.trim())}
            className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{t('create.creating')}</span>
              </>
            ) : (
              <span>{t('create.submit')}</span>
            )}
          </button>
        </div>
      </form>

      {/* 说明文字 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full mt-0.5 flex items-center justify-center">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">{t('create.info.title')}</p>
            <ul className="space-y-1 text-blue-600">
              <li>{t('create.info.line1')}</li>
              <li>{t('create.info.line2')}</li>
              <li>{t('create.info.line3')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVote;
