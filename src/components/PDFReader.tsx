import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, AlertCircle, Bookmark, Edit3, Plus, Trash2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createBookmark, getBookmarksByBook, deleteBookmark } from '../services/bookmark.service';
import { createNote, getNotesByPage, deleteNote } from '../services/note.service';
import type { Bookmark as BookmarkType } from '../types/database';
import type { Note as NoteType } from '../types/database';

// 配置 PDF.js worker - 使用本地 worker 文件
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFReaderProps {
  fileUrl: string;
  fileName: string;
  bookId: string;
  onClose: () => void;
}

export default function PDFReader({ fileUrl, fileName, bookId, onClose }: PDFReaderProps) {
  const { user } = useAuth();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  
  // 书签和笔记状态
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState('#ffff00');
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes'>('bookmarks');

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError('');
  };

  const onDocumentLoadError = (err: any) => {
    console.error('PDF 加载错误:', err);
    console.error('错误详情:', JSON.stringify(err, null, 2));
    console.error('尝试加载的文件:', fileUrl);
    
    const errorMessage = err?.message || err?.toString() || 'PDF 加载失败';
    
    // 根据错误类型提供更具体的错误信息
    if (errorMessage.includes('Invalid PDF')) {
      setError('PDF 文件格式错误，请检查文件是否完整');
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('404')) {
      setError('网络加载失败，请检查网络连接后重试');
    } else if (errorMessage.includes('password')) {
      setError('PDF 文件需要密码，暂不支持加密文件');
    } else {
      setError(`PDF 加载失败: ${errorMessage}`);
    }
    
    setLoading(false);
  };

  const onPageLoadError = (err: any) => {
    console.error('页面加载错误:', err);
    // 页面加载错误不影响整个文档，可以尝试重新加载
    setPageNumber(Math.max(1, pageNumber - 1));
  };

  const changePage = useCallback((offset: number) => {
    setPageNumber((prevPageNumber) => Math.max(1, Math.min(numPages, prevPageNumber + offset)));
  }, [numPages]);

  const changeZoom = useCallback((delta: number) => {
    setScale((prevScale) => Math.max(0.5, Math.min(3.0, prevScale + delta)));
  }, []);

  const previousPage = useCallback(() => changePage(-1), [changePage]);
  const nextPage = useCallback(() => changePage(1), [changePage]);

  const zoomIn = useCallback(() => changeZoom(0.2), [changeZoom]);
  const zoomOut = useCallback(() => changeZoom(-0.2), [changeZoom]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      previousPage();
    } else if (e.key === 'ArrowRight') {
      nextPage();
    } else if (e.key === '+' || e.key === '=') {
      zoomIn();
    } else if (e.key === '-') {
      zoomOut();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [previousPage, nextPage, zoomIn, zoomOut, onClose]);

  // 加载书签和笔记数据
  useEffect(() => {
    if (user && bookId) {
      loadBookmarksAndNotes();
    }
  }, [user, bookId, pageNumber]);

  const loadBookmarksAndNotes = async () => {
    if (!user || !bookId) return;

    try {
      const [bookmarksData, notesData] = await Promise.all([
        getBookmarksByBook(user.id, bookId),
        getNotesByPage(user.id, bookId, pageNumber),
      ]);

      if (!bookmarksData.error) {
        setBookmarks(bookmarksData.bookmarks);
      }

      if (!notesData.error) {
        setNotes(notesData.notes);
      }
    } catch (err) {
      console.error('加载书签和笔记失败:', err);
    }
  };

  // 添加书签
  const handleAddBookmark = async () => {
    if (!user || !bookId) return;

    try {
      const { bookmark, error } = await createBookmark({
        user_id: user.id,
        book_id: bookId,
        page_number: pageNumber,
        title: bookmarkTitle || `第 ${pageNumber} 页`,
        note: bookmarkNote,
      });

      if (!error && bookmark) {
        setBookmarks([...bookmarks, bookmark]);
        setShowBookmarkModal(false);
        setBookmarkTitle('');
        setBookmarkNote('');
      }
    } catch (err) {
      console.error('添加书签失败:', err);
    }
  };

  // 删除书签
  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!user) return;

    try {
      const { error } = await deleteBookmark(bookmarkId);
      if (!error) {
        setBookmarks(bookmarks.filter(b => b.id !== bookmarkId));
      }
    } catch (err) {
      console.error('删除书签失败:', err);
    }
  };

  // 添加笔记
  const handleAddNote = async () => {
    if (!user || !bookId || !noteText.trim()) return;

    try {
      const { note, error } = await createNote({
        user_id: user.id,
        book_id: bookId,
        page_number: pageNumber,
        text_content: noteText,
        color: noteColor,
      });

      if (!error && note) {
        setNotes([...notes, note]);
        setShowNoteModal(false);
        setNoteText('');
        setNoteColor('#ffff00');
      }
    } catch (err) {
      console.error('添加笔记失败:', err);
    }
  };

  // 删除笔记
  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      const { error } = await deleteNote(noteId);
      if (!error) {
        setNotes(notes.filter(n => n.id !== noteId));
      }
    } catch (err) {
      console.error('删除笔记失败:', err);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 加载 PDF 文件
  useEffect(() => {
    let mounted = true;

    const loadPdfFile = async () => {
      try {
        setLoading(true);
        setError('');

        // 构建完整的 PDF URL
        const fullUrl = `${window.location.origin}${fileUrl}`;
        console.log('开始加载 PDF 文件:', fullUrl);
        console.log('原始路径:', fileUrl);

        // 使用 fetch 获取 PDF 文件
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        if (mounted) {
          setPdfBlobUrl(blobUrl);
          console.log('PDF 文件加载成功，Blob URL:', blobUrl);
          console.log('PDF 文件大小:', blob.size, 'bytes');
        }
      } catch (err: any) {
        console.error('PDF 文件加载失败:', err);
        console.error('错误详情:', JSON.stringify(err, null, 2));
        if (mounted) {
          setError(`PDF 文件加载失败: ${err.message}`);
          setLoading(false);
        }
      }
    };

    loadPdfFile();

    return () => {
      mounted = false;
      // 清理 Blob URL
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [fileUrl]);

  return (
    <div className="fixed inset-0 z-[200] bg-surface flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-surface-container-low border-b border-outline-variant/10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
            title="关闭 (ESC)"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
          <div className="h-6 w-px bg-outline-variant/20" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-on-surface">{fileName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-surface-container-lowest rounded-lg px-3 py-1.5">
            <span className="text-sm text-on-surface-variant">第 {pageNumber} / {numPages} 页</span>
          </div>
          <div className="h-6 w-px bg-outline-variant/20" />
          {user && (
            <>
              <button
                onClick={() => setShowBookmarkModal(true)}
                className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
                title="添加书签"
              >
                <Bookmark className="w-5 h-5 text-on-surface-variant" />
              </button>
              <button
                onClick={() => setShowNoteModal(true)}
                className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
                title="添加笔记"
              >
                <Edit3 className="w-5 h-5 text-on-surface-variant" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-2 rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
            title="缩小 (-)"
          >
            <ZoomOut className="w-5 h-5 text-on-surface-variant" />
          </button>
          <div className="bg-surface-container-lowest rounded-lg px-3 py-1.5 min-w-[80px] text-center">
            <span className="text-sm font-medium text-on-surface">{Math.round(scale * 100)}%</span>
          </div>
          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="p-2 rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
            title="放大 (+)"
          >
            <ZoomIn className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>
      </div>

      {/* PDF 内容区域 */}
      <div className="flex-1 overflow-auto bg-surface-container-lowest flex">
        {/* PDF 显示区域 */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {error ? (
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-error mx-auto" />
              <p className="text-error">{error}</p>
              <p className="text-sm text-on-surface-variant">
                文件路径: {fileUrl}
              </p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError('');
                  setPageNumber(1);
                }}
                className="px-6 py-2 bg-primary text-on-primary rounded-lg"
              >
                重试
              </button>
            </div>
          ) : pdfBlobUrl ? (
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/80">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
              )}
              <Document
                file={pdfBlobUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  </div>
                }
                error={<div className="text-center text-error">加载失败</div>}
                className="shadow-2xl"
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  loading={
                    <div className="flex items-center justify-center h-96">
                      <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    </div>
                  }
                  error={
                    <div className="text-center text-error">
                      <p className="mb-2">页面加载失败</p>
                      <button
                        onClick={() => setPageNumber(1)}
                        className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm"
                      >
                        重新加载
                      </button>
                    </div>
                  }
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-2xl"
                  onLoadError={onPageLoadError}
                />              </Document>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-on-surface-variant">正在加载 PDF 文件...</p>
            </div>
          )}
        </div>

        {/* 书签和笔记侧边栏 */}
        {user && (
          <div className="w-80 bg-surface-container-low border-l border-outline-variant/10 flex flex-col">
            {/* 标签切换 */}
            <div className="flex border-b border-outline-variant/10">
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'bookmarks'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                书签 ({bookmarks.length})
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                笔记 ({notes.length})
              </button>
            </div>

            {/* 书签列表 */}
            {activeTab === 'bookmarks' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {bookmarks.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant text-sm">
                    暂无书签
                  </div>
                ) : (
                  bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/10"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Bookmark className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-on-surface">
                              {bookmark.title}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            第 {bookmark.page_number} 页
                          </p>
                          {bookmark.note && (
                            <p className="text-xs text-on-surface-variant mt-1">
                              {bookmark.note}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteBookmark(bookmark.id)}
                          className="p-1 hover:bg-surface-container-high rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 笔记列表 */}
            {activeTab === 'notes' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant text-sm">
                    暂无笔记
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/10"
                      style={{ borderLeftColor: note.color, borderLeftWidth: '3px' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-on-surface">{note.text_content}</p>
                          {note.highlight_text && (
                            <p className="text-xs text-on-surface-variant mt-1 italic">
                              "{note.highlight_text}"
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 hover:bg-surface-container-high rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部导航栏 */}
      <div className="bg-surface-container-low border-t border-outline-variant/10 px-4 py-3 flex items-center justify-center gap-4">
        <button
          onClick={previousPage}
          disabled={pageNumber <= 1}
          className="px-4 py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          title="上一页 (←)"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>上一页</span>
        </button>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={pageNumber}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= numPages) {
                setPageNumber(page);
              }
            }}
            min={1}
            max={numPages}
            className="w-20 px-3 py-2 bg-surface-container-lowest rounded-lg text-center text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-sm text-on-surface-variant">/ {numPages}</span>
        </div>

        <button
          onClick={nextPage}
          disabled={pageNumber >= numPages}
          className="px-4 py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          title="下一页 (→)"
        >
          <span>下一页</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 快捷键提示 */}
      <div className="bg-surface-container-low/80 text-xs text-on-surface-variant px-4 py-2 text-center">
        快捷键: ← → 翻页 | + - 缩放 | ESC 关闭
      </div>

      {/* 书签模态框 */}
      {showBookmarkModal && (
        <div className="fixed inset-0 z-[210] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-outline-variant/10">
              <h3 className="text-lg font-semibold text-on-surface">添加书签</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                第 {pageNumber} 页
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  书签标题
                </label>
                <input
                  type="text"
                  value={bookmarkTitle}
                  onChange={(e) => setBookmarkTitle(e.target.value)}
                  placeholder="输入书签标题"
                  className="w-full px-4 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  备注（可选）
                </label>
                <textarea
                  value={bookmarkNote}
                  onChange={(e) => setBookmarkNote(e.target.value)}
                  placeholder="输入备注"
                  rows={3}
                  className="w-full px-4 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant/10 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBookmarkModal(false);
                  setBookmarkTitle('');
                  setBookmarkNote('');
                }}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddBookmark}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 笔记模态框 */}
      {showNoteModal && (
        <div className="fixed inset-0 z-[210] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-outline-variant/10">
              <h3 className="text-lg font-semibold text-on-surface">添加笔记</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                第 {pageNumber} 页
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  笔记内容
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="输入笔记内容"
                  rows={4}
                  className="w-full px-4 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  标记颜色
                </label>
                <div className="flex gap-2">
                  {['#ffff00', '#ff6b6b', '#4ecdc4', '#95e1d3', '#a8e6cf'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNoteColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        noteColor === color
                          ? 'border-primary scale-110'
                          : 'border-outline-variant/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant/10 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                  setNoteColor('#ffff00');
                }}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}