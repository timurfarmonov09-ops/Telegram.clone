import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Smile, Paperclip, MoreVertical, ArrowDown, Check, CheckCheck, X, Image as ImageIcon, Users, Download } from 'lucide-react';
import './ChatArea.css';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    first_name?: string;
  };
  createdAt: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  read?: boolean;
  image?: string;
  video?: string;
  videoThumbnail?: string;
  file?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  uploadProgress?: number;
}

interface ChatAreaProps {
  chat?: any;
  currentUserId: string;
  socket?: any;
  onlineUsers?: Set<string>;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ 
  chat, 
  currentUserId, 
  socket,
  onlineUsers = new Set()
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isSendingImage, setIsSendingImage] = useState(false);
  const [isSendingVideo, setIsSendingVideo] = useState(false);
  const [isSendingFile, setIsSendingFile] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastMessageCountRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Check if user is near bottom
  const checkIfNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < 100;
  };

  // Handle scroll event
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const isNearBottom = checkIfNearBottom();
    setShowScrollButton(!isNearBottom);
    setIsUserScrolling(!isNearBottom);
  };

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      if (!isUserScrolling) {
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
      lastMessageCountRef.current = messages.length;
    }
  }, [messages.length, isUserScrolling]);

  // Scroll to bottom when chat changes
  useEffect(() => {
    if (chat) {
      setIsUserScrolling(false);
      setShowScrollButton(false);
      setTimeout(() => scrollToBottom('auto'), 100);
    }
  }, [chat?.id]);

  // Load messages when chat changes
  useEffect(() => {
    if (!chat) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const { chatAPI } = await import('@/services/api');
        const data = await chatAPI.getMessages(chat.id);
        setMessages(data.messages || []);
        
        setTimeout(async () => {
          try {
            await chatAPI.markAsRead(chat.id);
          } catch (error) {
            console.error('Failed to mark messages as read:', error);
          }
        }, 500);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [chat?.id]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !chat) return;

    socket.joinChat(chat.id);

    const unsubscribeMessages = socket.onNewMessage((newMessage: Message) => {
      if (newMessage.sender.id !== currentUserId) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        
        setTimeout(async () => {
          try {
            const { chatAPI } = await import('@/services/api');
            await chatAPI.markAsRead(chat.id);
          } catch (error) {
            console.error('Failed to mark message as read:', error);
          }
        }, 500);
      }
    });

    const unsubscribeMessagesRead = socket.onMessagesRead((data: any) => {
      if (data.chatId === chat.id && data.readBy !== currentUserId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.sender.id === currentUserId 
              ? { ...msg, read: true, status: 'read' }
              : msg
          )
        );
      }
    });

    const unsubscribeTyping = socket.onUserTyping((data: any) => {
      if (data.userId !== currentUserId) {
        setIsTyping(data.isTyping);
        
        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      }
    });

    return () => {
      socket.leaveChat(chat.id);
      unsubscribeMessages();
      unsubscribeMessagesRead();
      unsubscribeTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, chat, currentUserId]);

  const handleTyping = (value: string) => {
    setMessage(value);
    
    if (!socket || !chat) return;

    if (value.trim()) {
      socket.startTyping(chat.id, currentUserId, 'You');
    } else {
      socket.stopTyping(chat.id, currentUserId);
    }
  };

  const handleSend = async () => {
    if (message.trim() && chat) {
      const messageContent = message.trim();
      const tempId = `temp-${Date.now()}`;
      
      const newMessage: Message = {
        id: tempId,
        content: messageContent,
        sender: {
          id: currentUserId,
          username: 'You'
        },
        createdAt: new Date().toISOString(),
        status: 'sending'
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      try {
        if (socket) {
          socket.stopTyping(chat.id, currentUserId);
        }
        
        const { chatAPI } = await import('@/services/api');
        const savedMessage = await chatAPI.sendMessage(chat.id, messageContent);
        
        setMessages(prev => 
          prev.map(msg => msg.id === tempId ? { ...savedMessage, status: 'sent' } : msg)
        );
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setMessage(messageContent);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a video
    if (file.type.startsWith('video/')) {
      if (file.size > 50 * 1024 * 1024) {
        alert('Video size must be less than 50MB');
        return;
      }

      setSelectedVideo(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Handle image
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image or video file');
      return;
    }

    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedVideo(null);
    setVideoPreview(null);
    setSelectedFile(null);
    setFileUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  const handleSendImage = async () => {
    if (!selectedImage || !chat) return;

    const tempId = `temp-${Date.now()}`;
    const caption = message.trim();
    const imageFile = selectedImage;
    const previewUrl = imagePreview;

    const newMessage: Message = {
      id: tempId,
      content: caption,
      sender: {
        id: currentUserId,
        username: 'You'
      },
      createdAt: new Date().toISOString(),
      status: 'sending',
      image: previewUrl!,
      uploadProgress: 0
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      setIsSendingImage(true);

      const progressInterval = setInterval(() => {
        setMessages(prevMsgs => 
          prevMsgs.map(msg => {
            if (msg.id === tempId && msg.uploadProgress !== undefined && msg.uploadProgress < 90) {
              return { ...msg, uploadProgress: msg.uploadProgress + 10 };
            }
            return msg;
          })
        );
      }, 100);

      if (socket) {
        socket.stopTyping(chat.id, currentUserId);
      }

      const { chatAPI } = await import('@/services/api');
      const savedMessage = await chatAPI.sendImage(chat.id, imageFile, caption);

      clearInterval(progressInterval);

      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === tempId) {
            console.log('📸 Updating message with saved image:', {
              tempId,
              savedImage: savedMessage.image,
              previewUrl
            });
            return { 
              ...savedMessage, 
              status: 'sent', 
              uploadProgress: undefined,
              image: savedMessage.image || previewUrl
            };
          }
          return msg;
        })
      );
    } catch (error) {
      console.error('Failed to send image:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert('Failed to send image. Please try again.');
    } finally {
      setIsSendingImage(false);
    }
  };

  const handleSendVideo = async () => {
    if (!selectedVideo || !chat) return;

    const tempId = `temp-${Date.now()}`;
    const caption = message.trim();
    const videoFile = selectedVideo;
    const previewUrl = videoPreview;

    const newMessage: Message = {
      id: tempId,
      content: caption,
      sender: {
        id: currentUserId,
        username: 'You'
      },
      createdAt: new Date().toISOString(),
      status: 'sending',
      video: previewUrl!,
      uploadProgress: 0
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setSelectedVideo(null);
    setVideoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      setIsSendingVideo(true);

      const progressInterval = setInterval(() => {
        setMessages(prevMsgs => 
          prevMsgs.map(msg => {
            if (msg.id === tempId && msg.uploadProgress !== undefined && msg.uploadProgress < 90) {
              return { ...msg, uploadProgress: msg.uploadProgress + 10 };
            }
            return msg;
          })
        );
      }, 100);

      if (socket) {
        socket.stopTyping(chat.id, currentUserId);
      }

      const { chatAPI } = await import('@/services/api');
      const savedMessage = await (chatAPI as any).sendVideo(chat.id, videoFile, caption);

      clearInterval(progressInterval);

      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === tempId) {
            return { 
              ...savedMessage, 
              status: 'sent', 
              uploadProgress: undefined,
              video: savedMessage.video || previewUrl
            };
          }
          return msg;
        })
      );
    } catch (error) {
      console.error('Failed to send video:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert('Failed to send video. Please try again.');
    } finally {
      setIsSendingVideo(false);
    }
  };

  // Handle file selection (documents, PDFs, ZIPs, etc.)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      alert('File size must be less than 100MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleSendFile = async () => {
    if (!selectedFile || !chat) return;

    const tempId = `temp-${Date.now()}`;
    const caption = message.trim();
    const file = selectedFile;

    const newMessage: Message = {
      id: tempId,
      content: caption || file.name,
      sender: {
        id: currentUserId,
        username: 'You'
      },
      createdAt: new Date().toISOString(),
      status: 'sending',
      file: 'uploading',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadProgress: 0
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setSelectedFile(null);
    setFileUploadProgress(0);
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }

    try {
      setIsSendingFile(true);

      if (socket) {
        socket.stopTyping(chat.id, currentUserId);
      }

      const { chatAPI } = await import('@/services/api');
      const savedMessage = await (chatAPI as any).sendFile(
        chat.id, 
        file, 
        caption,
        (progress: number) => {
          setFileUploadProgress(progress);
          setMessages(prevMsgs => 
            prevMsgs.map(msg => {
              if (msg.id === tempId) {
                return { ...msg, uploadProgress: progress };
              }
              return msg;
            })
          );
        }
      );

      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === tempId) {
            return { 
              ...savedMessage, 
              status: 'sent', 
              uploadProgress: undefined
            };
          }
          return msg;
        })
      );
    } catch (error) {
      console.error('Failed to send file:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert('Failed to send file. Please try again.');
    } finally {
      setIsSendingFile(false);
      setFileUploadProgress(0);
    }
  };

  // Get file icon based on file type
  const getFileIcon = (fileType?: string) => {
    if (!fileType) return '📎';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '🗜️';
    if (fileType.includes('text')) return '📄';
    return '📎';
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle file download
  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `http://localhost:3001${fileUrl}`;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!chat) {
    return (
      <div className="flex-1 bg-[#0a1929] flex items-center justify-center chat-background">
        <div className="text-center max-w-md px-4 relative z-10">
          <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/10">
            <MessageCircle className="w-16 h-16 text-gray-600" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">
            Welcome to Telegram Clone
          </h2>
          <p className="text-gray-400 text-base leading-relaxed">
            Select a chat to start messaging or search for contacts to begin a new conversation
          </p>
        </div>
      </div>
    );
  }

  const isGroup = chat.type === 'group';
  const otherUser = isGroup ? null : chat.members?.find((m: any) => m.id !== currentUserId);
  const isUserOnline = otherUser?.id && onlineUsers.has(otherUser.id);
  
  const getUserDisplayName = (user: any) => {
    if (user?.first_name) {
      return user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    }
    return `User ${user?.username?.slice(-4) || '0000'}`;
  };

  const getGroupMembersText = () => {
    if (!isGroup || !chat.members) return '';
    const count = chat.members.length;
    return `${count} member${count > 1 ? 's' : ''}`;
  };

  const getAvatarUrl = (avatar?: string) => {
    if (avatar) return `http://localhost:3001${avatar}`;
    return null;
  };

  const getLastSeenText = (user: any) => {
    console.log('getLastSeenText called with user:', user);
    console.log('user.isOnline:', user?.isOnline);
    console.log('isUserOnline:', isUserOnline);
    console.log('user.lastSeen:', user?.lastSeen);
    
    if (!user) return 'offline';
    
    if (user.isOnline || isUserOnline) {
      return 'online';
    }
    
    if (user.lastSeen) {
      const lastSeenDate = new Date(user.lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeenDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) {
        return 'last seen just now';
      } else if (diffMins < 60) {
        return `last seen ${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `last seen ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `last seen ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        return `last seen ${lastSeenDate.toLocaleDateString()}`;
      }
    }
    
    return 'last seen recently';
  };

  return (
    <div className="flex-1 bg-[#0a1929] flex flex-col h-screen">
      {/* Chat Header */}
      <div className="bg-[#0e1621] border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-telegram-blue flex items-center justify-center overflow-hidden relative">
            {isGroup ? (
              chat.groupPhoto ? (
                <img 
                  src={getAvatarUrl(chat.groupPhoto)!} 
                  alt={chat.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-5 h-5 text-white" />
              )
            ) : getAvatarUrl(otherUser?.avatar) ? (
              <img 
                src={getAvatarUrl(otherUser?.avatar)!} 
                alt={getUserDisplayName(otherUser)} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-base font-bold text-white">
                {getUserDisplayName(otherUser).charAt(0).toUpperCase()}
              </span>
            )}
            {!isGroup && otherUser?.isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0e1621]"></div>
            )}
          </div>

          <div>
            <h3 className="text-white font-medium">
              {isGroup ? chat.name : getUserDisplayName(otherUser)}
            </h3>
            <p className="text-xs text-gray-400">
              {isGroup ? (
                getGroupMembersText()
              ) : isTyping ? (
                <span className="text-telegram-blue">typing...</span>
              ) : (
                <span className={isUserOnline ? 'text-green-400' : ''}>
                  {getLastSeenText(otherUser)}
                </span>
              )}
            </p>
          </div>
        </div>

        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 relative chat-background messages-container"
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-telegram-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-32 h-32 rounded-full bg-telegram-blue flex items-center justify-center overflow-hidden mb-4">
              {getAvatarUrl(otherUser?.avatar) ? (
                <img 
                  src={getAvatarUrl(otherUser?.avatar)!} 
                  alt={getUserDisplayName(otherUser)} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold text-white">
                  {getUserDisplayName(otherUser).charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-semibold text-white mb-2">
              {getUserDisplayName(otherUser)}
            </h2>

            <p className="text-gray-400 text-sm">
              This is the beginning of your conversation
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, index) => {
              const isOwn = msg.sender.id === currentUserId;
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const showAvatar = !prevMsg || prevMsg.sender.id !== msg.sender.id;
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                    showAvatar ? 'mt-3' : 'mt-1'
                  }`}
                >
                  <div
                    className={`max-w-[65%] rounded-2xl px-3 py-2 message-bubble ${
                      isOwn
                        ? 'bg-[#2b5278] text-white rounded-br-md'
                        : 'bg-[#1a2332] text-white rounded-bl-md'
                    }`}
                  >
                    {/* Image */}
                    {msg.image && (
                      <div className="mb-2 relative" style={{ maxWidth: '280px' }}>
                        <img 
                          src={
                            msg.image.startsWith('blob:') 
                              ? msg.image 
                              : msg.image.startsWith('http')
                              ? msg.image
                              : `http://localhost:3001${msg.image}`
                          }
                          alt="Chat image"
                          loading="eager"
                          decoding="async"
                          className="rounded-2xl cursor-pointer hover:opacity-95 transition-opacity w-full h-auto block"
                          style={{ 
                            width: '100%',
                            height: 'auto',
                            maxWidth: '280px',
                            minHeight: '100px',
                            objectFit: 'cover',
                            backgroundColor: '#1a2332'
                          }}
                          onClick={() => {
                            if (msg.uploadProgress === undefined || msg.uploadProgress === 100) {
                              const imageUrl = msg.image!.startsWith('blob:') 
                                ? msg.image! 
                                : msg.image!.startsWith('http')
                                ? msg.image!
                                : `http://localhost:3001${msg.image}`;
                              window.open(imageUrl, '_blank');
                            }
                          }}
                          onLoad={() => {
                            console.log('✅ Image loaded:', msg.image);
                          }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            console.error('❌ Image failed to load:', msg.image);
                            console.error('Attempted URL:', img.src);
                            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="280" height="200"%3E%3Crect fill="%23333" width="280" height="200"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        
                        {/* Upload Progress Bar */}
                        {msg.uploadProgress !== undefined && msg.uploadProgress < 100 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                            <div className="w-3/4">
                              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-white transition-all duration-300"
                                  style={{ width: `${msg.uploadProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-white text-xs text-center mt-2 font-medium">
                                {msg.uploadProgress}%
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Video */}
                    {msg.video && (
                      <div className="mb-2 relative" style={{ maxWidth: '280px' }}>
                        <video 
                          src={
                            msg.video.startsWith('blob:') 
                              ? msg.video 
                              : msg.video.startsWith('http')
                              ? msg.video
                              : `http://localhost:3001${msg.video}`
                          }
                          controls
                          preload="metadata"
                          className="rounded-2xl w-full block"
                          style={{ 
                            width: '100%',
                            maxWidth: '280px',
                            minHeight: '150px',
                            backgroundColor: '#000'
                          }}
                          onLoadedMetadata={() => {
                            console.log('✅ Video loaded:', msg.video);
                          }}
                          onError={(e) => {
                            const video = e.target as HTMLVideoElement;
                            console.error('❌ Video failed to load:', msg.video);
                            console.error('Attempted URL:', video.src);
                          }}
                        />
                        
                        {/* Upload Progress Bar */}
                        {msg.uploadProgress !== undefined && msg.uploadProgress < 100 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                            <div className="w-3/4">
                              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-white transition-all duration-300"
                                  style={{ width: `${msg.uploadProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-white text-xs text-center mt-2 font-medium">
                                {msg.uploadProgress}%
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* File */}
                    {msg.file && (
                      <div className="mb-2">
                        <div className={`flex items-center gap-3 p-3 rounded-xl ${
                          isOwn ? 'bg-white/10' : 'bg-white/5'
                        } max-w-xs`}>
                          <div className="flex-shrink-0 w-12 h-12 bg-telegram-blue/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">{getFileIcon(msg.fileType)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {msg.fileName || 'File'}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {formatFileSize(msg.fileSize)}
                            </p>
                            {msg.uploadProgress !== undefined && msg.uploadProgress < 100 ? (
                              <div className="mt-1">
                                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-telegram-blue transition-all duration-300"
                                    style={{ width: `${msg.uploadProgress}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{msg.uploadProgress}%</p>
                              </div>
                            ) : null}
                          </div>
                          {msg.file !== 'uploading' && (
                            <button
                              onClick={() => handleDownloadFile(msg.file!, msg.fileName || 'file')}
                              className="flex-shrink-0 w-8 h-8 bg-telegram-blue hover:bg-telegram-blue/80 rounded-full flex items-center justify-center transition-colors"
                            >
                              <Download className="w-4 h-4 text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Text content */}
                    {msg.content && (
                      <p className="text-[15px] leading-[1.4] break-words whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}
                    
                    <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[11px] opacity-60">
                        {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </span>
                      {isOwn && (
                        <span className="opacity-60">
                          {msg.status === 'sending' ? (
                            <div className="w-3 h-3 border border-white/50 border-t-transparent rounded-full animate-spin"></div>
                          ) : msg.read || msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={() => {
              scrollToBottom('smooth');
              setIsUserScrolling(false);
            }}
            className="fixed bottom-24 right-8 w-11 h-11 bg-[#2b5278] hover:bg-[#3a6590] rounded-full shadow-xl flex items-center justify-center transition-all duration-200 z-10"
          >
            <ArrowDown className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-[#0e1621] border-t border-white/5 p-4">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="rounded-2xl border-2 border-telegram-blue"
              style={{ 
                maxWidth: '280px',
                maxHeight: '400px',
                display: 'block'
              }}
            />
            <button
              onClick={handleCancelImage}
              className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Video Preview */}
        {videoPreview && (
          <div className="mb-3 relative inline-block">
            <video 
              src={videoPreview} 
              controls
              className="rounded-2xl border-2 border-telegram-blue"
              style={{ 
                maxWidth: '280px',
                maxHeight: '400px',
                display: 'block'
              }}
            />
            <button
              onClick={handleCancelImage}
              className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* File Preview */}
        {selectedFile && (
          <div className="mb-3">
            <div className="inline-flex items-center gap-3 p-3 bg-white/5 rounded-xl border-2 border-telegram-blue">
              <div className="flex-shrink-0 w-12 h-12 bg-telegram-blue/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{getFileIcon(selectedFile.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-gray-400 text-xs">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                onClick={handleCancelImage}
                className="flex-shrink-0 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isSendingImage || isSendingVideo}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
            title="Send image or video"
          >
            <ImageIcon className="w-5 h-5 text-gray-400" />
          </button>

          <button 
            onClick={() => documentInputRef.current?.click()}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 text-gray-400" />
          </button>

          {/* Hidden file input for documents */}
          <input
            ref={documentInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedImage || selectedVideo || selectedFile ? "Add a caption..." : "Write a message..."}
              disabled={isSendingImage || isSendingVideo || isSendingFile}
              className="w-full bg-[#1a2332] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-telegram-blue placeholder-gray-500 disabled:opacity-50"
            />
          </div>

          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0">
            <Smile className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={selectedFile ? handleSendFile : selectedVideo ? handleSendVideo : selectedImage ? handleSendImage : handleSend}
            disabled={(!message.trim() && !selectedImage && !selectedVideo && !selectedFile) || isSendingImage || isSendingVideo || isSendingFile}
            className="p-3 bg-telegram-blue hover:bg-telegram-blue-dark rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isSendingImage || isSendingVideo || isSendingFile ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
