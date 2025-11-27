import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWalletClient } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Components
import CreateVote from './components/CreateVote';
import VotePoll from './components/VotePoll';
import VoteResults from './components/VoteResults';
import LanguageSwitcher from './components/LanguageSwitcher';

// Services and config
import { FHEVMService, Poll, VoteResult } from './services/fhevm';
import { initializeFHEVM } from './config/fhevm';
import { useLanguage } from './contexts/LanguageContext';

// Icons
import {
  PlusIcon,
  QueueListIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

type TabType = 'create' | 'vote' | 'results';

function App() {
  // Translation
  const { t } = useLanguage();

  // Wallet connection state
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // App state
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [fhevmService] = useState(new FHEVMService());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Data state
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votedPolls, setVotedPolls] = useState<Set<number>>(new Set());
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);

  // Initialize FHEVM when wallet connects
  useEffect(() => {
    if (isConnected && walletClient) {
      // 延迟执行，确保 UMD 脚本已加载（基于文档建议）
      const timer = setTimeout(() => {
        initializeService();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setIsInitialized(false);
    }
  }, [isConnected, walletClient]);

  // Load polls when initialized
  useEffect(() => {
    if (isInitialized) {
      loadPolls();
    }
  }, [isInitialized]);

  // Initialize FHEVM service
  const initializeService = async () => {
    if (!walletClient) return;

    try {
      setIsLoading(true);
      console.log('🚀 Initializing FHEVM service...');
      console.log('📊 Wallet client:', walletClient);
      console.log('🌐 Chain:', walletClient.chain);
      console.log('🔧 SDK Available:', !!window.FhevmSDK);

      // Convert walletClient to ethers signer
      const { BrowserProvider } = await import('ethers');

      // Create provider from wallet client
      const provider = new BrowserProvider(walletClient, {
        chainId: walletClient.chain.id,
        name: walletClient.chain.name,
      });
      const signer = await provider.getSigner();

      console.log('✅ Ethers signer created:', await signer.getAddress());

      const fhevmInstance = await initializeFHEVM();
      await fhevmService.initialize(fhevmInstance, signer);

      setIsInitialized(true);
      toast.success(t('msg.initSuccess'));
    } catch (error: any) {
      console.error('❌ Failed to initialize FHEVM:', error);
      toast.error(`❌ ${t('init.title')}: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load all polls
  const loadPolls = async () => {
    try {
      console.log('🔄 开始加载投票列表...');
      const allPolls = await fhevmService.getAllPolls();
      console.log('✅ 成功加载投票:', allPolls);
      setPolls(allPolls);

      if (allPolls.length === 0) {
        console.log('⚠️ 没有找到任何投票');
      }
    } catch (error: any) {
      console.error('❌ Failed to load polls:', error);
      toast.error(`加载投票列表失败: ${error?.message || 'Unknown error'}`);
      setPolls([]); // 确保显示空列表而不是旧数据
    }
  };

  // Handle create vote
  const handleCreateVote = async (title: string, options: string[], duration: number): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('🚀 开始创建投票:', { title, options, duration });

      const pollId = await fhevmService.createPoll(title, options, duration);
      console.log('✅ 投票创建成功，ID:', pollId);

      toast.success(t('msg.createSuccess'));

      // 延迟一点再刷新列表，确保区块链状态同步
      console.log('🔄 刷新投票列表...');
      setTimeout(async () => {
        await loadPolls();
        console.log('✅ 投票列表已更新');

        // Switch to vote tab to see the new poll
        setActiveTab('vote');
      }, 1000); // 1秒延迟确保链上数据同步
    } catch (error: any) {
      console.error('❌ Failed to create vote:', error);
      toast.error(`创建投票失败: ${error?.message || 'Unknown error'}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle vote submission
  const handleVote = async (pollId: number, optionIndex: number) => {
    try {
      setIsLoading(true);
      await fhevmService.submitVote(pollId, optionIndex);

      // Mark as voted
      setVotedPolls(prev => new Set([...prev, pollId]));

      // Refresh polls
      await loadPolls();
    } catch (error) {
      console.error('Failed to submit vote:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view results
  const handleViewResults = (pollId: number) => {
    setSelectedPollId(pollId);
    setActiveTab('results');
  };

  // Handle decrypt results
  const handleDecryptResults = async (pollId: number): Promise<VoteResult[]> => {
    try {
      const results = await fhevmService.decryptResults(pollId);
      return results;
    } catch (error) {
      console.error('Failed to decrypt results:', error);
      throw error;
    }
  };

  // Tab configuration
  const tabs = [
    {
      id: 'create' as TabType,
      label: t('tab.create'),
      icon: PlusIcon,
      description: t('tab.create.desc')
    },
    {
      id: 'vote' as TabType,
      label: t('tab.vote'),
      icon: QueueListIcon,
      description: t('tab.vote.desc')
    },
    {
      id: 'results' as TabType,
      label: t('tab.results'),
      icon: ChartBarIcon,
      description: t('tab.results.desc')
    },
  ];

  const selectedPoll = selectedPollId ? polls.find(p => p.id === selectedPollId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and title */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <ShieldCheckIcon className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t('app.title')}</h1>
                <p className="text-sm text-gray-600">{t('app.subtitle')}</p>
              </div>
            </div>

            {/* Wallet connection */}
            <div className="flex items-center space-x-4">
              {isConnected && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                  <span className="text-gray-600">
                    {isInitialized ? t('header.fhevmReady') : t('header.initializing')}
                  </span>
                </div>
              )}
              <LanguageSwitcher />
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          // Wallet not connected
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-8">
              <LockClosedIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              连接钱包开始投票
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              请连接您的 Web3 钱包以开始使用 FHEVM 加密投票系统。
              我们支持 MetaMask、WalletConnect 等主流钱包。
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
              <div className="card text-center">
                <ShieldCheckIcon className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800 mb-2">隐私保护</h3>
                <p className="text-sm text-gray-600">使用全同态加密技术保护投票隐私</p>
              </div>
              <div className="card text-center">
                <LockClosedIcon className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800 mb-2">安全可靠</h3>
                <p className="text-sm text-gray-600">基于区块链的透明且不可篡改投票</p>
              </div>
              <div className="card text-center">
                <ChartBarIcon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800 mb-2">结果透明</h3>
                <p className="text-sm text-gray-600">支持结果解密和验证的公开透明</p>
              </div>
            </div>
          </div>
        ) : !isInitialized ? (
          // FHEVM initializing or failed
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              正在初始化 FHEVM 服务...
            </h2>
            <p className="text-gray-600 mb-6">
              正在连接到 Zama 中继器和配置加密环境，请稍候...
            </p>

            {/* 手动重试按钮 */}
            <div className="space-y-4">
              <button
                onClick={() => {
                  console.log('🔄 Manual retry requested');
                  initializeService();
                }}
                disabled={isLoading}
                className="btn-primary disabled:opacity-50"
              >
                {isLoading ? '初始化中...' : '重试初始化'}
              </button>

              <div className="text-sm text-gray-500">
                如果一直无法初始化，请检查：
                <br />
                • 网络连接是否正常
                <br />
                • 是否有广告拦截器阻止脚本加载
                <br />
                • CDN 服务是否可访问
              </div>
            </div>
          </div>
        ) : (
          // Main application
          <div className="space-y-8">
            {/* Navigation tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className={`mr-2 h-5 w-5 ${
                      activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <div className="text-left">
                      <div>{tab.label}</div>
                      <div className="text-xs text-gray-500">{tab.description}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab content */}
            <div className="py-4">
              {activeTab === 'create' && (
                <CreateVote
                  onCreateVote={handleCreateVote}
                  isLoading={isLoading}
                />
              )}

              {activeTab === 'vote' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      参与投票
                    </h2>
                    <p className="text-gray-600 mb-4">
                      选择您要参与的投票，您的选择将被加密保护
                    </p>

                    {/* 手动刷新按钮 */}
                    <div className="flex justify-center mb-6">
                      <button
                        onClick={loadPolls}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{isLoading ? '加载中...' : '刷新投票列表'}</span>
                      </button>
                    </div>
                  </div>

                  {polls.length === 0 ? (
                    <div className="text-center py-12">
                      <QueueListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">暂无可参与的投票</p>
                      <p className="text-sm text-gray-400 mb-4">
                        如果您刚创建了投票，请点击上方的刷新按钮
                      </p>
                      <button
                        onClick={() => setActiveTab('create')}
                        className="mt-4 btn-primary"
                      >
                        创建第一个投票
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-500 text-center">
                        共找到 {polls.length} 个投票
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {polls.map((poll) => (
                          <VotePoll
                            key={poll.id}
                            poll={poll}
                            onVote={handleVote}
                            onViewResults={handleViewResults}
                            hasVoted={votedPolls.has(poll.id)}
                            isLoading={isLoading}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'results' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      投票结果
                    </h2>
                    <p className="text-gray-600">
                      使用 FHE 技术解密查看投票结果
                    </p>
                  </div>

                  {!selectedPoll ? (
                    <div className="text-center py-12">
                      <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">请先选择要查看结果的投票</p>
                      <button
                        onClick={() => setActiveTab('vote')}
                        className="btn-primary"
                      >
                        选择投票
                      </button>
                    </div>
                  ) : (
                    <VoteResults
                      poll={selectedPoll}
                      onDecryptResults={handleDecryptResults}
                      isLoading={isLoading}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}

export default App;