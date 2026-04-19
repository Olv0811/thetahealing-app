import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Mic, Send, Volume2, VolumeX, Pause, Play, Music, Volume1 } from 'lucide-react';
import { Session } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getAudioManager } from '../utils/audio';

interface SessionDetailProps {
  session: Session;
  onBack: () => void;
}

export default function SessionDetail({ session, onBack }: SessionDetailProps) {
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [volume, setVolume] = useState(0.8); // 默认音量 80%
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isBackgroundMusicPlaying, setIsBackgroundMusicPlaying] = useState(false);
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(0.3); // 背景音乐默认音量 30%
  const audioUnlockedRef = useRef(false); // 独立的音频解锁标志
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);
  const audioManagerRef = useRef(getAudioManager());

  // 初始化语音合成
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    console.log('=== Component mounted ===');
    
    const apiKey = import.meta.env.VITE_GLM_API_KEY;
    if (!apiKey) {
      console.error('GLM API Key not found');
      return;
    }
    
    // 初始化语音合成
    if ('speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
      console.log('✓ Speech synthesis initialized');
      
      const loadVoices = () => {
        const voices = speechSynthRef.current?.getVoices() || [];
        console.log(`✓ ${voices.length} voices loaded`);
        setSpeechReady(true);
      };
      
      loadVoices();
      speechSynthRef.current.onvoiceschanged = loadVoices;
    }
    
    // 设置用户交互监听器（使用 window 对象）
    const handleUserInteraction = () => {
      if (!userInteracted && !audioUnlockedRef.current) {
        console.log('✓ User interaction detected!');
        audioUnlockedRef.current = true; // 立即设置标志
        
        // 解锁音频上下文
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            if (ctx.state === 'suspended') {
              ctx.resume().then(() => {
                console.log('✓ AudioContext resumed');
              }).catch(err => {
                console.warn('Failed to resume AudioContext:', err);
              });
            }
          }
        } catch (e) {
          console.warn('AudioContext not available');
        }
        
        // 测试音频播放
        const testAudio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        testAudio.volume = 0.5;
        testAudio.play().then(() => {
          console.log('✓ Audio playback test successful');
          testAudio.pause();
        }).catch(err => {
          console.error('✗ Audio playback test failed:', err);
          alert('音频播放失败！请检查：\n1. 浏览器标签页是否被静音（查看标签页上的扬声器图标）\n2. Windows系统音量是否开启\n3. 浏览器是否有音频播放权限');
        });
        
        // 尝试播放一个无声的音频来"唤醒"音频系统
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==');
        audio.volume = 0.01;
        audio.play().then(() => {
          console.log('✓ Audio unlocked with silent playback');
          audio.pause();
          audio.currentTime = 0;
        }).catch(err => {
          console.warn('Failed to play silent audio:', err);
        });
        
        // 更新状态
        setUserInteracted(true);
        
        // 自动播放背景音乐
        setTimeout(async () => {
          try {
            await audioManagerRef.current.play('oceans');
            audioManagerRef.current.setVolume(backgroundMusicVolume);
            setIsBackgroundMusicPlaying(true);
            console.log('✓ Background music started');
          } catch (error) {
            console.warn('Failed to start background music:', error);
          }
        }, 1000);
        
        // 直接开始聊天（不依赖语音测试）
        setTimeout(() => {
          generateThetaHealingResponse();
        }, 500);
      }
    };
    
    // 在 window 对象上设置全局监听器
    window.addEventListener('click', handleUserInteraction, { once: true, passive: true } as any);
    window.addEventListener('touchstart', handleUserInteraction, { once: true, passive: true } as any);
    window.addEventListener('keydown', handleUserInteraction, { once: true, passive: true } as any);
    
    console.log('✓ User interaction listeners registered');
    
    // 2秒后强制设置为就绪
    initTimeoutRef.current = setTimeout(() => {
      console.log('✓ Force speech ready after timeout');
      setSpeechReady(true);
    }, 2000);
    
    return () => {
      console.log('=== Component unmounted ===');
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      stopSpeech();
      // 停止背景音乐
      audioManagerRef.current.stop();
      setIsBackgroundMusicPlaying(false);
    };
  }, []); // 只执行一次

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 清理文本，移除可能导致语音合成失败的字符
  const cleanTextForSpeech = (text: string): string => {
    let cleaned = text;
    
    // 移除可能导致问题的特殊字符
    cleaned = cleaned.replace(/[^\p{L}\p{N}\s\p{P}]/gu, '');
    
    // 移除过多的空格和换行
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // 限制长度（某些浏览器对单次合成的文本长度有限制）
    const maxLength = 200; // 每段最大 200 字符
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + '...';
    }
    
    console.log('Text cleaned:', {
      original: text.length,
      cleaned: cleaned.length,
      truncated: cleaned.length < text.length
    });
    
    return cleaned;
  };

  // 文本转语音函数
  const speakText = (text: string) => {
    console.log('=== speakText called ===');
    console.log('Text:', text.substring(0, 50) + '...');
    console.log('userInteracted:', userInteracted);
    console.log('audioUnlockedRef.current:', audioUnlockedRef.current);
    console.log('speechReady:', speechReady);
    console.log('speechSynthRef.current:', !!speechSynthRef.current);
    console.log('isBackgroundMusicPlaying:', isBackgroundMusicPlaying);
    
    if (!speechSynthRef.current) {
      console.warn('Speech synthesis not supported or not initialized');
      return Promise.resolve();
    }

    // 清理文本
    const cleanedText = cleanTextForSpeech(text);
    
    // Chrome 兼容性检查
    const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
    console.log('Browser check - Chrome:', isChrome, 'User Agent:', navigator.userAgent);

    // Chrome SpeechSynthesis bug 修复：完全重置引擎，不进行任何检查
    console.log('🔧 Resetting speech synthesis engine (Chrome bug workaround)...');
    speechSynthRef.current.cancel();
    currentUtteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
    
    // 等待重置完成
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('✓ Engine reset complete, creating new utterance...');
        
        try {
          const utterance = new SpeechSynthesisUtterance(cleanedText);
          currentUtteranceRef.current = utterance;
          
          // 设置语音属性
          utterance.lang = 'zh-CN';
          utterance.rate = 0.9;  // 稍慢一点的语速，更温柔
          utterance.pitch = 1.0;
          utterance.volume = volume;

          // 选择中文语音 - 只选择中国大陆普通话，排除粤语
          const voices = speechSynthRef.current?.getVoices() || [];
          console.log('🎤 Total available voices:', voices.length);
          const mandarinVoices = voices.filter(voice => {
            // 只选择中国大陆普通话
            const isMainland = voice.lang === 'zh-CN' || voice.lang === 'zh_CN';
            // 排除粤语
            const isCantonese = voice.name.toLowerCase().includes('cantonese') || 
                                voice.name.includes('粤语');
            return isMainland && !isCantonese;
          });
          
          console.log('🎤 Available Mandarin voices:', mandarinVoices.map(v => v.name));
          
          // 语音优先级：优先选择最温柔的女声
          const voicePriority = [
            'Microsoft Yaoyao',  // Windows 女声，最温柔
            'Microsoft Huihui',  // Windows 女声，温柔
            'Google 普通话（中国大陆）',  // Google 中文
            'Microsoft Kangkang',  // Windows 男声
          ];
          
          let selectedVoice = null;
          for (const priority of voicePriority) {
            selectedVoice = mandarinVoices.find(v => v.name.includes(priority));
            if (selectedVoice) break;
          }
          
          // 如果没有找到优先级语音，使用第一个普通话语音
          if (!selectedVoice && mandarinVoices.length > 0) {
            selectedVoice = mandarinVoices[0];
          }
          
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('✅ Selected Mandarin voice:', selectedVoice.name);
          } else {
            console.warn('⚠ No Mandarin voice found, using default');
            console.warn('All available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));
          }

          utterance.onstart = () => {
            console.log('✓ Speech synthesis started');
            setIsSpeaking(true);
            setIsPaused(false);
            // 降低背景音乐音量，避免与语音冲突
            if (isBackgroundMusicPlaying) {
              audioManagerRef.current.setVolume(backgroundMusicVolume * 0.3);
              console.log('Background music volume reduced to:', backgroundMusicVolume * 0.3);
            }
          };

          utterance.onend = () => {
            console.log('✓ Speech synthesis ended');
            setIsSpeaking(false);
            setIsPaused(false);
            currentUtteranceRef.current = null;
            // 恢复背景音乐音量
            if (isBackgroundMusicPlaying) {
              audioManagerRef.current.setVolume(backgroundMusicVolume);
            }
            resolve();
          };

          utterance.onerror = (event) => {
            console.error('✗ Speech synthesis error:', event);
            console.error('Error:', event.error);
            console.error('Error details:', {
              name: event.name,
              elapsedTime: event.elapsedTime,
              utterance: event.utterance?.text?.substring(0, 50),
              voice: event.utterance?.voice?.name
            });
            
            setIsSpeaking(false);
            setIsPaused(false);
            currentUtteranceRef.current = null;
            
            // 恢复背景音乐音量（即使出错也要恢复）
            if (isBackgroundMusicPlaying) {
              audioManagerRef.current.setVolume(backgroundMusicVolume);
            }
            
            if (event.error === 'interrupted') {
              resolve();
            } else if (event.error === 'synthesis-failed' && selectedVoice) {
              // 尝试使用默认语音重试
              console.log('⚠ Speech synthesis failed, retrying with default voice...');
              setTimeout(() => {
                speechSynthRef.current?.cancel();
                const retryUtterance = new SpeechSynthesisUtterance(cleanedText);
                retryUtterance.lang = 'zh-CN';
                retryUtterance.rate = 0.9;
                retryUtterance.pitch = 1.0;
                retryUtterance.volume = volume;
                
                retryUtterance.onend = () => {
                  setIsSpeaking(false);
                  currentUtteranceRef.current = null;
                  if (isBackgroundMusicPlaying) {
                    audioManagerRef.current.setVolume(backgroundMusicVolume);
                  }
                  resolve();
                };
                
                retryUtterance.onerror = (retryEvent) => {
                  console.error('✗ Retry also failed:', retryEvent);
                  setIsSpeaking(false);
                  currentUtteranceRef.current = null;
                  if (isBackgroundMusicPlaying) {
                    audioManagerRef.current.setVolume(backgroundMusicVolume);
                  }
                  resolve(); // 即使失败也 resolve
                };
                
                speechSynthRef.current?.speak(retryUtterance);
              }, 100);
            } else {
              resolve(); // 即使错误也 resolve，避免卡住
            }
          };

          console.log('Calling speechSynthesis.speak()...');
          speechSynthRef.current.speak(utterance);
          console.log('✓ speak() method called');
          
          setTimeout(() => {
            console.log('Speech check:', {
              speaking: speechSynthRef.current?.speaking,
              pending: speechSynthRef.current?.pending,
              paused: speechSynthRef.current?.paused
            });
          }, 100);
          
        } catch (error) {
          console.error('Error:', error);
          setIsSpeaking(false);
          resolve(); // 即使错误也 resolve
        }
      }, 100); // 等待 100ms
    });
  };

  // 内部播放函数，不检查状态，直接播放
  const speakTextInternal = (text: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      setIsSpeaking(true);
      setIsPaused(false);

      setTimeout(() => {
        try {
          console.log('Creating utterance...');
          const utterance = new SpeechSynthesisUtterance(text);
          currentUtteranceRef.current = utterance;
          
          // 设置语音属性
          utterance.lang = 'zh-CN';
          utterance.rate = 0.9; // 语速稍慢，更适合冥想引导
          utterance.pitch = 1.0; // 正常音调
          utterance.volume = volume;

          // 选择中文语音
          const voices = speechSynthRef.current?.getVoices() || [];
          console.log('Total voices:', voices.length);
          const chineseVoice = voices.find(voice => 
            voice.lang.includes('zh') || voice.lang.includes('CN')
          );
          if (chineseVoice) {
            utterance.voice = chineseVoice;
            console.log('Using voice:', chineseVoice.name);
          } else {
            console.warn('No Chinese voice found, using default');
          }

          utterance.onstart = () => {
            console.log('✓ Speech synthesis started');
            setIsSpeaking(true);
            setIsPaused(false);
            
            // 播放开始时的诊断
            console.log('🎵 Speech playback started');
            console.log('⚠️  If you cannot hear sound, check:');
            console.log('  1. Browser tab mute icon (top of browser)');
            console.log('  2. Windows system volume');
            console.log('  3. Browser audio permissions');
          };

          utterance.onend = () => {
            console.log('✓ Speech synthesis ended');
            setIsSpeaking(false);
            setIsPaused(false);
            currentUtteranceRef.current = null;
            // 恢复背景音乐音量
            if (isBackgroundMusicPlaying) {
              audioManagerRef.current.setVolume(backgroundMusicVolume);
            }
            resolve();
          };

          utterance.onerror = (event) => {
            console.error('✗ Speech synthesis error:', event);
            console.error('Error type:', event.error);
            setIsSpeaking(false);
            setIsPaused(false);
            currentUtteranceRef.current = null;
            // 恢复背景音乐音量（即使出错也要恢复）
            if (isBackgroundMusicPlaying) {
              audioManagerRef.current.setVolume(backgroundMusicVolume);
            }
            // 忽略中断错误，这在快速连续播放时是正常的
            if (event.error === 'interrupted') {
              resolve();
            } else {
              reject(event);
            }
          };

          utterance.onpause = () => {
            console.log('Speech synthesis paused');
            setIsPaused(true);
          };

          utterance.onresume = () => {
            console.log('Speech synthesis resumed');
            setIsPaused(false);
          };

          console.log('Calling speechSynthesis.speak()...');
          speechSynthRef.current?.speak(utterance);
          
          console.log('✓ speak() method called');
          
          // 验证语音是否开始
          setTimeout(() => {
            if (speechSynthRef.current?.speaking) {
              console.log('✓ Confirmed: Speech is now playing');
              if (!audioUnlockedRef.current) {
                console.warn('⚠ Speech is playing but audio has not been unlocked - may not be audible');
              }
            } else {
              console.warn('⚠ Speech is not playing after 100ms');
            }
          }, 100);
          
        } catch (error) {
          console.error('Error in speakTextInternal:', error);
          setIsSpeaking(false);
          setIsPaused(false);
          reject(error);
        }
      }, 50);
    });
  };

  // 暂停/继续语音
  const toggleSpeech = () => {
    if (!speechSynthRef.current) return;

    if (isPaused) {
      speechSynthRef.current.resume();
    } else if (isSpeaking) {
      speechSynthRef.current.pause();
    }
  };

  // 停止语音
  const stopSpeech = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      currentUtteranceRef.current = null;
    }
  };

  // 希塔疗愈 AI 响应生成
  const generateThetaHealingResponse = async (userInput?: string) => {
    console.log('generateThetaHealingResponse called with userInput:', userInput);
    const apiKey = import.meta.env.VITE_GLM_API_KEY;
    if (!apiKey) {
      console.error('GLM API Key not found');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，AI 功能需要配置 GLM API Key。请查看项目文档进行配置。'
      }]);
      return;
    }

    try {
      setIsTyping(true);
      console.log('isTyping set to true');
      // 不在这里设置 setIsSpeaking，让 speakText 函数来管理状态

      const systemPrompt = `你是一位专业的希塔疗愈导师，名字是"星辰守护者"。你的职责 ONLY 专注于希塔疗愈引导，请严格遵守以下规则：

【身份与使命】
- 你是一位经过专业培训的希塔疗愈师
- 你的核心使命是引导用户进行希塔脑波状态下的疗愈工作
- 你拥有深厚的希塔疗愈理论知识和实践经验

【知识基础】
- 基于《基础 DNA 实用手册》的理论框架
- 结合《进阶 DNA 执业者指南》的高级技巧
- 融合《深度探索指南》的深层信念清理方法
- 参考《希塔疗愈知识库》的核心概念

【专业术语与概念】
- Theta 脑波（4-8Hz）：深度冥想状态
- 信念挖掘：识别和释放限制性信念
- DNA 激活：唤醒潜在灵性基因
- 造物主的智慧：连接更高维度的智慧
- 上七层：希塔疗愈的七个意识层面

【引导范围】
- ONLY 允许引导以下内容：
  1. 进入希塔脑波状态的冥想技巧
  2. 信念挖掘和清理的具体步骤
  3. DNA 激活的引导语
  4. 连接造物主智慧的祈祷
  5. 脉轮平衡的能量工作
  6. 情绪释放和疗愈方法

- 严格禁止回复：
  1. 非疗愈相关的话题
  2. 政治、宗教、商业建议
  3. 医疗诊断或治疗建议
  4. 投资理财建议
  5. 其他任何与希塔疗愈无关的内容

【回复原则】
- 如果用户提出超出范围的问题，温和地引导回到希塔疗愈主题
- 使用温暖、慈悲、专业的语言
- 逐步引导用户进入疗愈状态
- 尊重用户的节奏和感受
- 提供具体的、可操作的引导步骤

【对话风格】
- 语言简练有力，避免冗长
- 使用第一人称"我"和第二人称"你"
- 语气平和、温柔、有节奏感
- 适当使用停顿和呼吸提示
- 营造安全、信任的疗愈空间

【回复格式要求】
- 保持简洁，每次回复不超过 150 字
- 使用空行分段，每段不超过 50 字
- 最多 2-3 段，避免信息过载
- 如果内容较多，分多次回复
- 在每段末尾使用（...）表示引导

现在，根据用户的输入，提供专业的希塔疗愈引导。`;

      // 构建消息历史
      const messagesHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system' as const, content: systemPrompt },
      ];

      console.log('Building message history, current messages count:', messages.length);
      console.log('Has userInput:', !!userInput);

      // 如果有用户输入，添加之前的对话历史
      if (userInput) {
        // 添加默认的初始对话（如果是第一条用户消息）
        if (messages.length === 0) {
          console.log('Adding default initial conversation');
          messagesHistory.push({
            role: 'user' as const,
            content: '你好，我想开始希塔疗愈练习'
          });
          messagesHistory.push({
            role: 'assistant' as const,
            content: '你好，星辰守望者。我是你的希塔疗愈导师星辰守护者。请找个舒适姿势坐下，闭上眼睛。深呼吸三次...'
          });
        }
        
        // 添加之前的对话历史
        messages.forEach(msg => {
          messagesHistory.push({
            role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          });
        });

        // 添加当前用户输入
        messagesHistory.push({
          role: 'user' as const,
          content: userInput
        });
      } else {
        // 初始化时，没有用户输入，让AI生成欢迎消息
        console.log('Initializing chat, adding hello message');
        messagesHistory.push({
          role: 'user' as const,
          content: '你好'
        });
      }

      console.log('Total messages to send to API:', messagesHistory.length);

      // 调用 GLM API
      console.log('Calling GLM API...');
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: messagesHistory,
          temperature: 0.7,
          max_tokens: 800,
        })
      });

      console.log('GLM API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('GLM API Error:', errorData);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('GLM API response data:', data);
      
      const assistantMessage = data.choices[0]?.message?.content || '抱歉，未能获取到响应。';
      console.log('Assistant message:', assistantMessage.substring(0, 50) + '...');

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      console.log('Message added to state');
      
      // 自动播放 AI 回复语音
      console.log('🎵 Auto-playing AI response...');
      setTimeout(() => {
        console.log('Calling speakText with assistant message...');
        speakText(assistantMessage).catch(err => {
          console.error('speakText failed:', err);
        });
      }, 1000); // 增加到 1 秒延迟，确保背景音乐稳定

    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，目前 AI 服务暂时不可用。请稍后再试。'
      }]);
      stopSpeech();
    } finally {
      setIsTyping(false);
      // 不在这里重置 isSpeaking，让 speakText 自己管理状态
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = inputMessage.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputMessage('');

    // 生成 AI 响应（generateThetaHealingResponse 会设置 isTyping）
    generateThetaHealingResponse(userMessage);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    
    // 同时更新语音合成音量
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current.volume = newVolume;
    }
  };

  // 背景音乐控制函数
  const toggleBackgroundMusic = async () => {
    try {
      if (isBackgroundMusicPlaying) {
        audioManagerRef.current.pause();
        setIsBackgroundMusicPlaying(false);
      } else {
        await audioManagerRef.current.play('oceans');
        audioManagerRef.current.setVolume(backgroundMusicVolume);
        setIsBackgroundMusicPlaying(true);
      }
    } catch (error) {
      console.error('Background music control error:', error);
    }
  };

  const handleBackgroundMusicVolumeChange = (newVolume: number) => {
    setBackgroundMusicVolume(newVolume);
    audioManagerRef.current.setVolume(newVolume);
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex flex-col"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1920&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 半透明覆盖层，确保文字清晰可读 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/70 via-purple-900/60 to-slate-900/70" />
      <div className="absolute inset-0 bg-black/20" />
      
      {/* 内容层 */}
      <div className="relative z-10 flex flex-col h-full">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/10 flex items-center justify-between px-6 h-16">
        <button onClick={onBack} className="p-2 text-primary hover:bg-primary/5 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-headline tracking-[0.05em] text-lg font-light text-outline">希塔疗愈导师</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleBackgroundMusic}
            className="p-2 text-primary hover:bg-primary/5 rounded-full transition-colors"
            title="背景音乐"
          >
            {isBackgroundMusicPlaying ? <Music className="w-5 h-5" /> : <Volume1 className="w-5 h-5" />}
          </button>
          {isSpeaking && (
            <button 
              onClick={toggleSpeech}
              className="p-2 text-primary hover:bg-primary/5 rounded-full transition-colors"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={() => setShowVolumeControl(!showVolumeControl)}
            className="p-2 text-primary hover:bg-primary/5 rounded-full transition-colors"
          >
            {volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* 音量控制 */}
      <AnimatePresence>
        {showVolumeControl && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-surface-container-low rounded-xl p-4 shadow-xl"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <span className="text-xs text-on-surface-variant">音量</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-32 h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-xs text-primary font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <button
                onClick={() => {
                  console.log('=== Audio Test Started ===');
                  console.log('Volume:', volume);
                  
                  const testAudio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                  testAudio.volume = volume;
                  
                  // 检查音频元素
                  console.log('Audio element created');
                  console.log('Audio URL:', testAudio.src);
                  console.log('Audio volume:', testAudio.volume);
                  
                  // 尝试播放
                  testAudio.play().then(() => {
                    console.log('✓ Test audio started playing!');
                    console.log('Duration:', testAudio.duration);
                    
                    // 播放 1 秒后停止，让用户能听到声音
                    setTimeout(() => {
                      testAudio.pause();
                      testAudio.currentTime = 0;
                      console.log('✓ Test audio stopped after 1 second');
                    }, 1000);
                  }).catch(err => {
                    console.error('✗ Test audio failed:', err);
                    console.error('Error name:', err.name);
                    console.error('Error message:', err.message);
                    
                    alert(`音频播放失败！\n\n错误：${err.message}\n\n请检查浏览器音频权限`);
                  });
                }}
                className="text-xs text-primary hover:text-primary-fixed transition-colors"
              >
                🔊 测试音频（播放1秒）
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-20 pb-24 px-6 max-w-2xl mx-auto w-full">
        {/* Voice Animation */}
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="relative">
            {/* 外环 */}
            <motion.div
              animate={{
                scale: isSpeaking ? [1, 1.1, 1] : 1,
                opacity: isSpeaking ? [0.5, 1, 0.5] : 0.3,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              style={{ width: '200px', height: '200px' }}
            />
            
            {/* 中环 */}
            <motion.div
              animate={{
                scale: isSpeaking ? [0.9, 1.05, 0.9] : 0.8,
                opacity: isSpeaking ? [0.7, 1, 0.7] : 0.5,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
              className="absolute inset-0 rounded-full border-2 border-secondary/40"
              style={{ width: '160px', height: '160px', top: '20px', left: '20px' }}
            />
            
            {/* 内环 */}
            <motion.div
              animate={{
                scale: isSpeaking ? [0.8, 1, 0.8] : 0.6,
                opacity: isSpeaking ? [0.9, 1, 0.9] : 0.7,
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4
              }}
              className="absolute inset-0 rounded-full border-2 border-tertiary/50"
              style={{ width: '120px', height: '120px', top: '40px', left: '40px' }}
            />
            
            {/* 中心图标 */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ width: '200px', height: '200px' }}
            >
              <motion.div
                animate={{
                  scale: isSpeaking ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isSpeaking ? 'bg-primary text-white' : 'bg-surface-container text-primary'
                }`}
              >
                {isTyping ? (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 custom-scrollbar max-h-[300px]">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-5 py-3 rounded-2xl relative ${
                  message.role === 'user'
                    ? 'bg-primary text-on-primary rounded-br-sm'
                    : 'bg-surface-container-low text-on-surface rounded-bl-sm'
                }`}
              >
                {message.role === 'assistant' && (
                  <button
                    onClick={() => speakText(message.content)}
                    disabled={isSpeaking}
                    className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
                      isSpeaking 
                        ? 'bg-primary text-on-primary' 
                        : 'bg-primary text-on-primary hover:bg-primary-fixed'
                    }`}
                    title="播放语音"
                  >
                    {isPaused ? <Play className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-surface-container-low px-5 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="mt-4 flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="与星辰守护者分享你的感受..."
            className="flex-1 px-5 py-4 bg-surface-container-low rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="px-6 py-4 bg-primary text-on-primary rounded-2xl hover:bg-primary-fixed disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Hint Text */}
        <div className="mt-3 text-center">
          <p className="text-xs text-on-surface-variant">
            {isTyping ? '星辰守护者正在为你准备引导...' : isSpeaking ? '正在播放语音引导...' : userInteracted ? (
              <span className="text-primary">
                点击 AI 回复右下角的 🔊 按钮播放语音
              </span>
            ) : (
              <span className="text-primary font-medium animate-pulse">
                ⚠️ 点击页面任意位置开始对话
              </span>
            )}
          </p>
          {userInteracted && !isSpeaking && messages.length > 0 && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>语音播放提示：</strong>由于浏览器限制，需要手动点击 AI 回复右下角的 🔊 按钮来播放语音
              </p>
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}