<!-- Sync Impact Report (2025-10-25)
Version change: 0.0.0 → 1.0.0
List of modified principles: 新增所有核心原則
Added sections: 技術約束、開發工作流程
Removed sections: 無
Templates requiring updates: ✅ plan-template.md, ✅ spec-template.md, ✅ tasks-template.md
Follow-up TODOs: 無
-->

# 股價追蹤工具 Constitution

## Core Principles

### I. Google Sheets 內建函數優先
每個功能必須優先使用 Google Sheets 內建函數；內建函數必須是獨立的、可測試的、有文檔的；明確目的要求 - 不得有僅組織性的函數。

### II. Apps Script 介面
每個服務通過 Apps Script 選單介面公開功能；統一的介面協議：選單操作 → 對話框/結果，錯誤 → 記錄；支援結構化和人性化格式。

### III. 測試優先 (NON-NEGOTIABLE)
TDD 強制執行：測試寫好 → 用戶批准 → 測試失敗 → 然後實作；紅燈-綠燈-重構循環嚴格執行。

### IV. 整合測試
重點領域需要整合測試：新服務合約測試，合約變更，跨服務通訊，共用架構。

### V. 可觀測性、版本控制與簡潔性
Apps Script 記錄確保可除錯性；結構化記錄要求；MAJOR.MINOR.BUILD 格式；保持簡潔，YAGNI 原則。

## 技術約束

### 技術棧要求
- **語言**：JavaScript (ES6+)
- **平台**：Google Apps Script (V8)
- **核心函數**：GOOGLEFINANCE、AI() - Google Sheets 內建
- **資料來源**：Google Finance (整合 TWSE、TPEX、Yahoo Finance)
- **儲存**：Google Sheets 原生整合
- **部署**：Google Workspace 環境

### 效能標準
- **載入速度**：毫秒級（零 API 呼叫）
- **穩定性**：99% 以上正常運作率
- **記憶體使用**：<100MB
- **回應時間**：<2秒用戶操作到結果顯示

### 安全要求
- **資料隱私**：不收集或儲存個人財務資訊
- **Google 隱私政策**：完全符合 Google Workspace 隱私標準
- **資料加密**：使用 Google 內建加密機制
- **輸入驗證**：所有用戶輸入進行格式驗證

## 開發工作流程

### 程式碼品質門檻
- **程式碼審查**：所有變更必須通過同行審查
- **測試覆蓋**：核心功能 100% 測試覆蓋
- **文檔**：所有公開 API 必須有完整文檔
- **效能審查**：重大變更必須通過效能評估

### 部署與發行
- **版本控制**：使用語意化版本控制 (MAJOR.MINOR.PATCH)
- **發行流程**：開發 → 測試 → 預發佈 → 生產
- **回滾策略**：支援快速回滾到前一版本
- **監控**：生產環境必須有完整的監控和記錄

### 錯誤處理
- **降級策略**：關鍵功能失敗時提供降級體驗
- **用戶通知**：系統問題時及時通知用戶
- **記錄**：所有錯誤必須記錄並可追蹤
- **修復時間**：P0 問題 4 小時內修復，P1 問題 24 小時內修復

## Governance

憲法優於所有其他實踐；修訂需要文檔、批准、遷移計劃。

所有 PR/審查必須驗證合規性；複雜性必須合理化；使用 docs/architecture/redesign-architecture.md 作為運行時開發指導。

**Version**: 1.0.0 | **Ratified**: 2025-10-25 | **Last Amended**: 2025-10-25
