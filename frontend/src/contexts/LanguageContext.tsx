import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 翻译字典
const translations = {
  zh: {
    // Header
    'app.title': 'FHEVM 加密投票系统',
    'app.subtitle': '基于全同态加密的隐私投票平台',
    'header.fhevmReady': 'FHEVM 已就绪',
    'header.initializing': '初始化中...',

    // Wallet Connection
    'wallet.connect': '连接钱包开始投票',
    'wallet.description': '请连接您的 Web3 钱包以开始使用 FHEVM 加密投票系统。我们支持 MetaMask、WalletConnect 等主流钱包。',

    // Features
    'feature.privacy.title': '隐私保护',
    'feature.privacy.desc': '使用全同态加密技术保护投票隐私',
    'feature.secure.title': '安全可靠',
    'feature.secure.desc': '基于区块链的透明且不可篡改投票',
    'feature.transparent.title': '结果透明',
    'feature.transparent.desc': '支持结果解密和验证的公开透明',

    // Tabs
    'tab.create': '创建投票',
    'tab.create.desc': '发起新的加密投票',
    'tab.vote': '参与投票',
    'tab.vote.desc': '查看和参与投票',
    'tab.results': '查看结果',
    'tab.results.desc': '解密查看投票结果',

    // Create Vote
    'create.title': '创建加密投票',
    'create.pollTitle': '投票标题',
    'create.pollTitlePlaceholder': '请输入投票标题...',
    'create.options': '投票选项',
    'create.addOption': '添加选项',
    'create.duration': '投票持续时间',
    'create.submit': '🚀 创建投票',
    'create.creating': '创建中...',
    'create.info.title': '关于加密投票：',
    'create.info.line1': '• 使用 FHEVM 全同态加密技术保护投票隐私',
    'create.info.line2': '• 投票过程完全在链上进行，透明且不可篡改',
    'create.info.line3': '• 只有投票结束后才能解密查看结果',

    // Vote Poll
    'vote.active': '进行中',
    'vote.ended': '已结束',
    'vote.notStarted': '未开始',
    'vote.votes': '票',
    'vote.submit': '提交投票',
    'vote.submitting': '提交中...',
    'vote.voted': '已投票',
    'vote.viewResults': '查看结果',
    'vote.notStartedYet': '投票尚未开始',
    'vote.startTime': '开始时间:',
    'vote.endTime': '结束时间:',
    'vote.noPolls': '暂无可参与的投票',
    'vote.noPollsDesc': '如果您刚创建了投票，请点击上方的刷新按钮',
    'vote.createFirst': '创建第一个投票',
    'vote.refresh': '刷新投票列表',
    'vote.loading': '加载中...',
    'vote.totalFound': '共找到',
    'vote.pollsCount': '个投票',

    // Results
    'results.title': '投票结果',
    'results.pollId': '投票 ID',
    'results.totalVotes': '总投票数',
    'results.encrypted': '投票结果已加密保护',
    'results.decrypt': '解密结果',
    'results.decrypting': '解密中...',
    'results.selectPoll': '请先选择要查看结果的投票',
    'results.winner': '🏆 获胜选项',
    'results.decryptionComplete': '解密完成',
    'results.successMsg': '成功解密了',
    'results.votesDecrypted': '张投票的结果',
    'results.detailedResults': '详细结果',
    'results.techInfo': '🔒 隐私保护技术',
    'results.tech.line1': '• 使用全同态加密 (FHE) 技术保护投票隐私',
    'results.tech.line2': '• 计算过程在加密状态下进行，无法被窃取',
    'results.tech.line3': '• 只有授权用户才能解密查看最终结果',
    'results.decryptDesc': '点击下方按钮使用 FHE 技术解密查看真实投票结果',
    'results.processTitle': '解密过程说明',
    'results.process.line1': '• 需要您的钱包签名授权解密请求',
    'results.process.line2': '• 使用 EIP-712 标准确保安全性',
    'results.process.line3': '• 解密过程在本地完成，保护隐私',

    // Time units
    'time.minutes': '分钟',
    'time.hours': '小时',
    'time.days': '天',
    'time.5min': '5分钟',
    'time.15min': '15分钟',
    'time.30min': '30分钟',
    'time.1hour': '1小时',
    'time.3hours': '3小时',
    'time.24hours': '24小时',

    // Messages
    'msg.initSuccess': '🎉 FHEVM 服务初始化成功！',
    'msg.createSuccess': '🎉 投票创建成功！',
    'msg.voteSuccess': '投票提交成功！',
    'msg.decryptSuccess': '结果解密成功！',
    'msg.selectOption': '请选择一个选项',
    'msg.enterTitle': '请输入投票标题',
    'msg.fillAllOptions': '请填写所有选项内容',
    'msg.minOptions': '至少需要2个选项',
    'msg.maxOptions': '最多只能添加10个选项',

    // Initializing
    'init.title': '正在初始化 FHEVM 服务...',
    'init.desc': '正在连接到 Zama 中继器和配置加密环境，请稍候...',
    'init.retry': '重试初始化',
    'init.retrying': '初始化中...',
    'init.checkTitle': '如果一直无法初始化，请检查：',
    'init.check.network': '• 网络连接是否正常',
    'init.check.blocker': '• 是否有广告拦截器阻止脚本加载',
    'init.check.cdn': '• CDN 服务是否可访问',

    // Common
    'common.option': '选项',
    'common.character': '字符',
  },
  en: {
    // Header
    'app.title': 'FHEVM Encrypted Voting System',
    'app.subtitle': 'Privacy Voting Platform Based on Fully Homomorphic Encryption',
    'header.fhevmReady': 'FHEVM Ready',
    'header.initializing': 'Initializing...',

    // Wallet Connection
    'wallet.connect': 'Connect Wallet to Start Voting',
    'wallet.description': 'Please connect your Web3 wallet to use the FHEVM encrypted voting system. We support MetaMask, WalletConnect, and other popular wallets.',

    // Features
    'feature.privacy.title': 'Privacy Protection',
    'feature.privacy.desc': 'Protect voting privacy using FHE technology',
    'feature.secure.title': 'Secure & Reliable',
    'feature.secure.desc': 'Transparent and immutable blockchain-based voting',
    'feature.transparent.title': 'Transparent Results',
    'feature.transparent.desc': 'Support for decryption and verification of results',

    // Tabs
    'tab.create': 'Create Poll',
    'tab.create.desc': 'Start a new encrypted poll',
    'tab.vote': 'Vote',
    'tab.vote.desc': 'View and participate in polls',
    'tab.results': 'Results',
    'tab.results.desc': 'Decrypt and view poll results',

    // Create Vote
    'create.title': 'Create Encrypted Poll',
    'create.pollTitle': 'Poll Title',
    'create.pollTitlePlaceholder': 'Enter poll title...',
    'create.options': 'Poll Options',
    'create.addOption': 'Add Option',
    'create.duration': 'Poll Duration',
    'create.submit': '🚀 Create Poll',
    'create.creating': 'Creating...',
    'create.info.title': 'About Encrypted Voting:',
    'create.info.line1': '• Uses FHEVM technology to protect voting privacy',
    'create.info.line2': '• Voting process is entirely on-chain, transparent and immutable',
    'create.info.line3': '• Results can only be decrypted after voting ends',

    // Vote Poll
    'vote.active': 'Active',
    'vote.ended': 'Ended',
    'vote.notStarted': 'Not Started',
    'vote.votes': 'votes',
    'vote.submit': 'Submit Vote',
    'vote.submitting': 'Submitting...',
    'vote.voted': 'Voted',
    'vote.viewResults': 'View Results',
    'vote.notStartedYet': 'Poll not started yet',
    'vote.startTime': 'Start Time:',
    'vote.endTime': 'End Time:',
    'vote.noPolls': 'No polls available',
    'vote.noPollsDesc': 'If you just created a poll, please click the refresh button above',
    'vote.createFirst': 'Create First Poll',
    'vote.refresh': 'Refresh Polls',
    'vote.loading': 'Loading...',
    'vote.totalFound': 'Found',
    'vote.pollsCount': 'polls',

    // Results
    'results.title': 'Poll Results',
    'results.pollId': 'Poll ID',
    'results.totalVotes': 'Total Votes',
    'results.encrypted': 'Votes are Encrypted',
    'results.decrypt': 'Decrypt Results',
    'results.decrypting': 'Decrypting...',
    'results.selectPoll': 'Please select a poll to view results',
    'results.winner': '🏆 Winner',
    'results.decryptionComplete': 'Decryption Complete',
    'results.successMsg': 'Successfully decrypted',
    'results.votesDecrypted': 'votes',
    'results.detailedResults': 'Detailed Results',
    'results.techInfo': '🔒 Privacy Protection Technology',
    'results.tech.line1': '• Uses FHE technology to protect voting privacy',
    'results.tech.line2': '• Computation is done in encrypted state, cannot be stolen',
    'results.tech.line3': '• Only authorized users can decrypt final results',
    'results.decryptDesc': 'Click the button below to decrypt and view real voting results using FHE technology',
    'results.processTitle': 'Decryption Process',
    'results.process.line1': '• Requires your wallet signature for authorization',
    'results.process.line2': '• Uses EIP-712 standard for security',
    'results.process.line3': '• Decryption is done locally to protect privacy',

    // Time units
    'time.minutes': 'minutes',
    'time.hours': 'hours',
    'time.days': 'days',
    'time.5min': '5 min',
    'time.15min': '15 min',
    'time.30min': '30 min',
    'time.1hour': '1 hour',
    'time.3hours': '3 hours',
    'time.24hours': '24 hours',

    // Messages
    'msg.initSuccess': '🎉 FHEVM service initialized successfully!',
    'msg.createSuccess': '🎉 Poll created successfully!',
    'msg.voteSuccess': 'Vote submitted successfully!',
    'msg.decryptSuccess': 'Results decrypted successfully!',
    'msg.selectOption': 'Please select an option',
    'msg.enterTitle': 'Please enter poll title',
    'msg.fillAllOptions': 'Please fill in all options',
    'msg.minOptions': 'At least 2 options required',
    'msg.maxOptions': 'Maximum 10 options allowed',

    // Initializing
    'init.title': 'Initializing FHEVM Service...',
    'init.desc': 'Connecting to Zama relayer and configuring encryption environment, please wait...',
    'init.retry': 'Retry Initialization',
    'init.retrying': 'Initializing...',
    'init.checkTitle': 'If initialization fails, please check:',
    'init.check.network': '• Network connection is stable',
    'init.check.blocker': '• No ad blocker is blocking scripts',
    'init.check.cdn': '• CDN service is accessible',

    // Common
    'common.option': 'Option',
    'common.character': 'characters',
  },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const t = (key: string): string => {
    const dict = translations[language] as Record<string, string>;
    return dict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
