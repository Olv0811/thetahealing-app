export interface AudioConfig {
  type: 'waves' | 'forest' | 'bell' | 'oceans';
  volume: number;
  loop: boolean;
}

export class AudioManager {
  private audioElement: HTMLAudioElement | null = null;
  private currentType: 'waves' | 'forest' | 'bell' | 'oceans' | null = null;
  private volume: number = 0.5;
  private isPlaying: boolean = false;

  // 音频资源 URL（使用可靠的免费音效库）
  private audioUrls = {
    waves: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // 海浪声 - 来自 Mixkit
    forest: 'https://assets.mixkit.co/active_storage/sfx/1366/1366-preview.mp3', // 森林声 - 来自 Mixkit
    bell: 'https://assets.mixkit.co/active_storage/sfx/2276/2276-preview.mp3', // 颂钵声 - 来自 Mixkit
    oceans: '/Josias MB - Oceans.mp3', // 本地海洋音乐
  };

  // 备用音频 URL（当主要 URL 失败时使用）
  private fallbackAudioUrls = {
    waves: 'https://www.soundjay.com/nature/sounds/ocean-wave-01.mp3', // 备用海浪声
    forest: 'https://www.soundjay.com/nature/sounds/birds-1.mp3', // 备用森林声
    bell: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3', // 备用颂钵声
    oceans: '/Josias MB - Oceans.mp3', // 本地海洋音乐（无需备用）
  };
  
  // 备用音频 URL2（更可靠的来源）
  private fallbackAudioUrls2 = {
    waves: 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3', // 海浪声备选
    forest: 'https://assets.mixkit.co/active_storage/sfx/1367/1367-preview.mp3', // 森林声备选
    bell: 'https://assets.mixkit.co/active_storage/sfx/2367/2367-preview.mp3', // 颂钵声备选
    oceans: '/Josias MB - Oceans.mp3', // 本地海洋音乐（无需备用）
  };

  constructor() {
    console.log('AudioManager initialized');
    console.log('Audio URLs:', this.audioUrls);
    this.initAudioElement();
    this.preloadAudio();
  }

  /**
   * 预加载所有音频
   */
  private preloadAudio(): void {
    console.log('Starting audio preloading...');
    Object.entries(this.audioUrls).forEach(([type, url]) => {
      try {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        audio.src = url;
        audio.addEventListener('canplaythrough', () => {
          console.log(`Audio ${type} preloaded successfully`);
        });
        audio.addEventListener('error', (e) => {
          console.warn(`Failed to preload audio ${type}:`, e);
          console.log(`Will use fallback URL for ${type} when needed`);
        });
        // 尝试加载音频
        audio.load();
      } catch (err) {
        console.warn(`Failed to create audio element for ${type}:`, err);
      }
    });
  }

  private initAudioElement() {
    if (typeof window !== 'undefined' && !this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.loop = true;
      this.audioElement.volume = this.volume;

      // 处理音频加载错误
      this.audioElement.addEventListener('error', (e) => {
        console.warn('Audio loading error:', e);
      });

      // 处理音频播放结束（非循环时）
      this.audioElement.addEventListener('ended', () => {
        if (!this.audioElement?.loop) {
          this.isPlaying = false;
        }
      });
      
      // 处理音频加载成功
      this.audioElement.addEventListener('canplay', () => {
        console.log('Audio is ready to play');
      });
    }
  }

  /**
   * 播放指定类型的音频
   */
  async play(type: 'waves' | 'forest' | 'bell' | 'oceans', fallbackLevel: number = 0): Promise<void> {
    console.log(`Attempting to play audio: ${type} (fallback level: ${fallbackLevel})`);
    
    // 选择音频 URL
    let audioUrl;
    switch (fallbackLevel) {
      case 0:
        audioUrl = this.audioUrls[type];
        break;
      case 1:
        audioUrl = this.fallbackAudioUrls[type];
        break;
      case 2:
        audioUrl = this.fallbackAudioUrls2[type];
        break;
      default:
        throw new Error(`No more fallback URLs available for ${type}`);
    }
    
    console.log(`Audio URL: ${audioUrl}`);

    if (!this.audioElement) {
      this.initAudioElement();
    }

    // 如果已经在播放相同类型的音频，直接返回
    if (this.isPlaying && this.currentType === type && this.audioElement) {
      console.log(`Already playing ${type}, skipping`);
      return;
    }

    try {
      // 如果正在播放其他类型的音频，先停止
      if (this.isPlaying && this.audioElement) {
        this.stop();
      }

      // 设置音频源
      console.log(`Setting audio source to: ${audioUrl}`);
      this.audioElement.src = audioUrl;
      this.audioElement.load(); // 显式加载音频
      this.currentType = type;

      // 等待音频加载完成再播放
      const waitForLoad = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Audio loading timeout'));
        }, 10000); // 10秒超时

        const onCanPlay = () => {
          clearTimeout(timeout);
          this.audioElement?.removeEventListener('canplay', onCanPlay);
          this.audioElement?.removeEventListener('error', onError);
          resolve();
        };

        const onError = () => {
          clearTimeout(timeout);
          this.audioElement?.removeEventListener('canplay', onCanPlay);
          this.audioElement?.removeEventListener('error', onError);
          reject(new Error('Audio loading failed'));
        };

        this.audioElement?.addEventListener('canplay', onCanPlay);
        this.audioElement?.addEventListener('error', onError);
      });

      // 播放音频
      console.log(`Waiting for ${type} to load...`);
      await waitForLoad;
      console.log(`Starting playback of ${type}`);
      await this.audioElement.play();
      this.isPlaying = true;
      console.log(`Successfully playing ${type}`);
    } catch (error) {
      console.error(`Audio play error for ${type} (fallback level ${fallbackLevel}):`, error);
      this.isPlaying = false;
      
      // 如果还有备用 URL，尝试使用
      if (fallbackLevel < 2) {
        console.log(`Retrying with fallback level ${fallbackLevel + 1} for ${type}...`);
        try {
          await this.play(type, fallbackLevel + 1);
          return;
        } catch (fallbackError) {
          console.error(`Fallback ${fallbackLevel + 1} also failed for ${type}:`, fallbackError);
        }
      }
      
      throw new Error(`音频播放失败: ${type}`);
    }
  }

  /**
   * 暂停音频
   */
  pause(): void {
    if (this.audioElement && this.isPlaying) {
      this.audioElement.pause();
      this.isPlaying = false;
    }
  }

  /**
   * 恢复播放
   */
  async resume(): Promise<void> {
    if (this.audioElement && !this.isPlaying && this.currentType) {
      try {
        await this.audioElement.play();
        this.isPlaying = true;
      } catch (error) {
        console.error('Audio resume error:', error);
        throw new Error('音频恢复失败');
      }
    }
  }

  /**
   * 停止音频
   */
  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.isPlaying = false;
    }
  }

  /**
   * 设置音量 (0.0 - 1.0)
   */
  setVolume(volume: number): void {
    if (volume < 0) volume = 0;
    if (volume > 1) volume = 1;
    this.volume = volume;
    if (this.audioElement) {
      this.audioElement.volume = volume;
    }
  }

  /**
   * 获取当前音量
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * 切换播放/暂停状态
   */
  async toggle(): Promise<void> {
    if (this.isPlaying) {
      this.pause();
    } else if (this.currentType) {
      await this.resume();
    }
  }

  /**
   * 获取当前播放状态
   */
  isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * 获取当前音频类型
   */
  getCurrentType(): 'waves' | 'forest' | 'bell' | 'oceans' | null {
    return this.currentType;
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.audioElement) {
      this.stop();
      this.audioElement.src = '';
      this.audioElement.removeEventListener('error', () => {});
      this.audioElement.removeEventListener('ended', () => {});
      this.audioElement = null;
    }
    this.currentType = null;
    this.isPlaying = false;
  }

  /**
   * 检查音频是否可用
   */
  isAvailable(): boolean {
    return this.audioElement !== null;
  }
}

// 创建全局单例
let audioManagerInstance: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}

export function destroyAudioManager(): void {
  if (audioManagerInstance) {
    audioManagerInstance.destroy();
    audioManagerInstance = null;
  }
}