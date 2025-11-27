// 全局声明 Zama SDK - 基于智能搜索
declare global {
  interface Window {
    [key: string]: any;
  }
}

export interface FHEVMInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => {
    add8: (value: number) => { encrypt: () => Promise<{ handles: Uint8Array[]; inputProof: Uint8Array }> };
  };
  generateKeypair: () => { publicKey: string; privateKey: string };
  createEIP712: (
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: string,
    durationDays: string
  ) => {
    domain: any;
    types: any;
    message: any;
  };
  userDecrypt: (
    handleContractPairs: { handle: string; contractAddress: string }[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: string,
    durationDays: string
  ) => Promise<Record<string, any>>;
  publicDecrypt: (handles: string[]) => Promise<{
    clearValues: Record<string, any>;
    abiEncodedClearValues: string;
    decryptionProof: string;
  }>;
}

// FHEVM SDK 初始化（基于文档的智能搜索方案）
export async function initializeFHEVM(): Promise<FHEVMInstance> {
  console.log('🔧 [SDK] 初始化 Zama FHE SDK...');

  try {
    // 1️⃣ 获取 window 对象
    const win = window as any;
    console.log('🔍 [SDK] 查找 UMD SDK...');

    // 2️⃣ 列出可能的全局变量名（基于文档）
    const possibleNames = [
      'RelayerSDK',
      'ZamaSDK',
      'FhevmSDK',
      'relayerSDK',
      'fhevm',
      'ZamaRelayerSDK',
    ];

    // 3️⃣ 方法A: 按名称查找
    let SDK = null;
    for (const name of possibleNames) {
      if (win[name]) {
        console.log(`✅ [SDK] 找到 SDK at window.${name}`);
        SDK = win[name];
        break;
      }
    }

    // 4️⃣ 方法B: 智能搜索（如果按名称找不到）
    if (!SDK) {
      console.warn('⚠️  [SDK] 预定义名称未找到，启动智能搜索...');

      // 查找包含 initSDK 方法的对象
      for (const key of Object.keys(win)) {
        const obj = win[key];
        if (
          obj &&
          typeof obj === 'object' &&
          typeof obj.initSDK === 'function' &&
          typeof obj.createInstance === 'function' &&
          obj.SepoliaConfig
        ) {
          console.log(`✅ [SDK] 智能找到 SDK at window.${key}`);
          SDK = obj;
          break;
        }
      }
    }

    // 5️⃣ 检查是否找到 SDK
    if (!SDK) {
      console.error('❌ [SDK] 完全找不到 SDK');
      console.log('💡 [SDK] Window 对象中的候选对象:',
        Object.keys(win).filter(k =>
          typeof win[k] === 'object' &&
          win[k] !== null &&
          !k.startsWith('webkit') &&
          !k.startsWith('on')
        )
      );
      throw new Error('UMD SDK 未加载到 window 对象');
    }

    // 6️⃣ 验证 SDK 结构
    console.log('📊 [SDK] SDK 对象内容:', Object.keys(SDK));

    const { initSDK: init, createInstance, SepoliaConfig } = SDK;

    if (!init || !createInstance || !SepoliaConfig) {
      console.error('❌ [SDK] SDK 导出不完整:', {
        hasInitSDK: !!init,
        hasCreateInstance: !!createInstance,
        hasSepoliaConfig: !!SepoliaConfig,
      });
      throw new Error('SDK 导出结构不完整');
    }

    // 7️⃣ 初始化 SDK（加载 WASM）
    console.log('📦 [SDK] 调用 initSDK()...');
    const startTime = Date.now();
    await init();
    console.log(`✅ [SDK] initSDK() 完成，耗时: ${Date.now() - startTime}ms`);

    // 8️⃣ 创建 FHE 实例（使用正确的网络和 relayer 配置）
    console.log('🔐 [SDK] 创建 FHE 实例 (SepoliaConfig + 自定义配置)...');
    const instanceStart = Date.now();

    // 创建增强配置，类似测试脚本的成功配置
    const enhancedConfig = {
      ...SepoliaConfig,
      network: 'https://sepolia.infura.io/v3/5b7c761195c943e9ac3cf850335fa8c2', // 使用明确的网络URL
      relayerUrl: 'https://relayer.testnet.zama.org', // 明确设置 relayer URL
    };

    console.log('📊 [SDK] 使用配置:', {
      network: enhancedConfig.network,
      relayerUrl: enhancedConfig.relayerUrl,
      aclContractAddress: enhancedConfig.aclContractAddress,
    });

    const fheInstance = await createInstance(enhancedConfig);
    console.log(`✅ [SDK] FHE 实例创建完成，耗时: ${Date.now() - instanceStart}ms`);

    // 9️⃣ 完成
    console.log('🎉 [SDK] SDK 初始化完成！');
    return fheInstance;

  } catch (err: any) {
    console.error('❌ [SDK] 初始化失败:', err);
    throw new Error(`FHEVM SDK 初始化失败: ${err.message}`);
  }
}