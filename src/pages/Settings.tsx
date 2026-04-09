import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Upload, Trash2, Info, ChevronRight, MessageSquareHeart, Heart } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import PageHeader from '@/components/PageHeader';

export default function Settings() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  /** 导出存档为 .js 文件 */
  const exportSave = useCallback(() => {
    try {
      const raw = localStorage.getItem('pokemon-storage');
      if (!raw) {
        showToast('没有找到存档数据');
        return;
      }

      // Parse and validate it's valid JSON
      const data = JSON.parse(raw);
      const json = JSON.stringify(data, null, 2);

      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const time = new Date().toISOString().slice(11, 16).replace(':', '');
      const filename = `yangcheng_poke_save_${date}_${time}.js`;

      // JS file format: assigns to a global variable
      const content = `// 扬城宝可梦存档文件\n// 导出时间: ${new Date().toLocaleString('zh-CN')}\n// 导入方法: 在游戏设置页面点击"读取存档"\n\nwindow.__POKEMON_SAVE_DATA__ = ${json};\n`;

      const blob = new Blob([content], { type: 'text/javascript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('存档导出成功！');
    } catch {
      showToast('导出失败，请重试');
    }
  }, []);

  /** 从 .js 文件读取存档 */
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();

      // Try to extract JSON from JS format: window.__POKEMON_SAVE_DATA__ = {...};
      let jsonData: string | null = null;

      // Method 1: regex match assignment
      const match = text.match(/window\.__POKEMON_SAVE_DATA__\s*=\s*([\s\S]*?);?\s*$/m);
      if (match) {
        jsonData = match[1].trim();
      } else {
        // Method 2: try parsing whole file as JSON
        jsonData = text.trim();
      }

      if (!jsonData) {
        showToast('无法解析存档文件');
        return;
      }

      const parsed = JSON.parse(jsonData);
      if (!parsed.state && !parsed.party) {
        showToast('存档格式不正确');
        return;
      }

      // Zustand persist stores data as { state: {...}, version: N }
      const saveData = parsed.state ? JSON.stringify(parsed) : JSON.stringify({ state: parsed, version: 0 });
      localStorage.setItem('pokemon-storage', saveData);

      showToast('存档导入成功！请刷新页面');
      // Reload after a short delay so user sees the toast
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      showToast('读取存档失败，文件格式不正确');
    }

    // Reset file input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /** 重置存档 */
  const resetSave = useCallback(() => {
    localStorage.removeItem('pokemon-storage');
    showToast('存档已重置');
    setTimeout(() => window.location.reload(), 1500);
  }, []);

  return (
    <div className="h-full w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col relative">
      <PageHeader
        title="设置"
        onBack={() => navigate('/menu')}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-4">
        {/* 导出存档 */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={exportSave}
          className="w-full rounded-3xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-4 hover:bg-emerald-100 transition-colors text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-black text-slate-900">导出存档</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">将当前存档保存为 .js 文件到本地</div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </motion.button>

        {/* 读取存档 */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-3xl border border-blue-200 bg-blue-50 p-5 flex items-center gap-4 hover:bg-blue-100 transition-colors text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-black text-slate-900">读取存档</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">选择之前导出的 .js 存档文件</div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".js"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* 重置存档 */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => setShowConfirmReset(true)}
          className="w-full rounded-3xl border border-red-200 bg-red-50 p-5 flex items-center gap-4 hover:bg-red-100 transition-colors text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-black text-red-700">重置存档</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">清除所有游戏数据并重新开始</div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </motion.button>

        {/* 存档信息 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Info className="w-5 h-5 text-slate-500" />
            </div>
            <div className="text-sm font-black text-slate-900">存档说明</div>
          </div>
          <div className="text-xs font-semibold text-slate-500 leading-relaxed space-y-2">
            <p>存档数据保存在浏览器本地，清除浏览器缓存会导致存档丢失。</p>
            <p>建议定期导出存档备份，防止意外丢失。</p>
            <p>读取存档会覆盖当前所有数据，请谨慎操作。</p>
          </div>
        </motion.div>

        {/* 关于游戏 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-sm font-black text-slate-900">关于游戏</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">游戏名称</span>
              <span className="text-xs font-black text-slate-800">养成宝可梦</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">当前版本</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-[11px] font-black">
                测试版 v0.1.0 Demo
              </span>
            </div>
            <div className="h-px bg-slate-200/60" />
            <div className="rounded-2xl bg-white/80 border border-indigo-100 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-xs font-black text-slate-700">建议 & 反馈</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                如果你有任何问题、建议或想法，欢迎联系作者交流！
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-500">QQ：</span>
                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                  3222407954
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-xl z-50"
        >
          {toast}
        </motion.div>
      )}

      {/* Reset confirmation overlay */}
      {showConfirmReset && (
        <div
          className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-6"
          onClick={() => setShowConfirmReset(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-black text-xl text-slate-900">确认重置存档？</h3>
              <p className="text-sm font-semibold text-slate-500">
                此操作将清除所有游戏数据，包括宝可梦、道具、金币和进度，且无法恢复。
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => { resetSave(); setShowConfirmReset(false); }}
                  className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 font-bold text-white transition-colors"
                >
                  确认重置
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
