# Epics & Stories - 股價追蹤工具

**版本:** 1.0
**日期:** 2025-10-18
**狀態:** Active

---

## Epic 總覽

### Epic 1: 基礎架構與核心功能 ✅ COMPLETED
**狀態:** ✅ Completed
**完成日期:** 2025-10-18

建立專案基礎架構，實作基本的股價查詢功能，並設定 Google Sheets 介面。

**目標:** 提供可立即使用的基本股價查詢功能，讓用戶能夠在 Google Sheets 中輸入股票代號並取得即時價格。

### Epic 2: 資料整合與顯示 ✅ COMPLETED
**狀態:** ✅ Completed
**完成日期:** 2025-10-18

整合多個資料來源，提供完整的價格資訊和視覺化。

**目標:** 加入歷史價格資料、走勢圖視覺化，以及完整的價格指標顯示。

### Epic 3: 用戶介面優化 ⏳ PENDING
**狀態:** ⏳ Pending

優化 Google Sheets 介面，提供更好的用戶體驗。

**目標:** 改善介面設計、加入資料驗證、提供更好的錯誤處理和用戶指引。

### Epic 4: 進階功能與分享 ⏳ PENDING
**狀態:** ⏳ Pending

加入進階功能並支援分享。

**目標:** 實作參數設定、優化錯誤處理、準備分享功能。

---

## Epic 1: 基礎架構與核心功能 ✅ COMPLETED

### Story 1.1: 設定 Google Apps Script 專案 ✅ COMPLETED
**狀態:** ✅ Completed
**完成日期:** 2025-10-18

As a developer,
I want to set up a new Google Apps Script project,
so that I can start implementing the stock price tracking functionality.

**Acceptance Criteria:**
1.1: Google Apps Script 專案已建立並連結到 Google Sheets ✅
1.2: 基本的專案結構和檔案已設定 ✅
1.3: 開發環境已準備就緒 ✅

**實作內容:**
- 建立 stockPrice.gs 主程式檔案
- 設定基本的專案結構
- 實作 CacheManager 類別
- 實作 StockPriceService 類別
- 實作 GoogleSheetsService 類別

### Story 1.2: 實作台股價格查詢功能 ✅ COMPLETED
**狀態:** ✅ Completed
**完成日期:** 2025-10-18

As a user,
I want to retrieve real-time Taiwan stock prices,
so that I can see current market data.

**Acceptance Criteria:**
1.1: TWSE API 整合完成 ✅
1.2: TPEX API 整合完成 ✅
1.3: 股票代號驗證功能實作 ✅
1.4: 錯誤處理機制實作 ✅

**實作內容:**
- 實作 getTWSEPrice() 方法
- 實作 getTPEXPrice() 方法
- 加入股票代號格式驗證
- 實作 try-catch 錯誤處理
- 加入快取機制

### Story 1.3: 實作美股價格查詢功能 ✅ COMPLETED
**狀態:** ✅ Completed
**完成日期:** 2025-10-18

As a user,
I want to retrieve real-time US stock prices,
so that I can track international markets.

**Acceptance Criteria:**
1.1: Yahoo Finance API 整合完成 ✅
1.2: 美股代號格式驗證 ✅
1.3: 資料格式統一處理 ✅

**實作內容:**
- 實作 getUSPrice() 方法
- 整合 Yahoo Finance API
- 統一資料格式處理
- 加入錯誤處理和快取

---

## Epic 2: 資料整合與顯示 🔄 IN PROGRESS

### Story 2.1: 實作歷史價格資料擷取 ✅ COMPLETED
**狀態:** ✅ Completed
**完成日期:** 2025-10-18

As a user,
I want to see historical price data for the past N days,
so that I can analyze price trends.

**Acceptance Criteria:**
2.1: 歷史資料 API 整合 ✅
2.2: 可設定天數參數 ✅
2.3: 資料快取機制 ✅

**實作內容:**
- 實作 getTWSEHistory() 方法獲取台股歷史資料
- 實作 getUSHistory() 方法獲取美股歷史資料
- 加入統一的 getHistory() 方法
- 實作歷史資料快取機制
- 支援可設定天數參數 (預設 30 天)

### Story 2.2: 實作 SPARKLINE 走勢圖 ✅ COMPLETED
**狀態:** ✅ Completed
**完成日期:** 2025-10-18

As a user,
I want to see visual price charts using SPARKLINE,
so that I can quickly understand price movements.

**Acceptance Criteria:**
2.1: SPARKLINE 函數整合 ✅
2.2: 圖表樣式設定 ✅
2.3: 動態資料更新 ✅

**實作內容:**
- 實作 DataProcessingService.generateSparkline() 方法
- 建立 GETSPARKLINE() 公開函數
- 整合 Google Sheets SPARKLINE 公式
- 支援可設定天數參數
- 實作動態資料更新機制

### Story 2.3: 實作完整價格指標顯示 ✅ COMPLETED
**狀態:** ✅ Completed
**完成日期:** 2025-10-18

As a user,
I want to see comprehensive price indicators,
so that I have all necessary market information.

**Acceptance Criteria:**
2.1: 即時價格顯示 ✅
2.2: 昨日收盤價顯示 ✅
2.3: 開盤價、最高價、最低價顯示 ✅
2.4: 資料格式化 ✅

**實作內容:**
- 擴展 TWSE API 回傳完整價格指標 (開盤、最高、最低、昨收、成交量、漲跌)
- 擴展 TPEX API 回傳完整價格指標
- 擴展 Yahoo Finance API 回傳美股完整指標
- 實作 formatPriceIndicators() 資料格式化函數
- 更新 GoogleSheetsService.updatePrices() 處理所有欄位
- 更新 updateAllPrices() 函數支援完整指標
- 加入回溯相容性方法 getPriceOnly()

---

## Epic 3: 用戶介面優化 ⏳ PENDING

### Story 3.1: 設計股票清單介面 ⏳ PENDING
**狀態:** ⏳ Pending

As a user,
I want an organized stock list interface,
so that I can easily manage my portfolio.

**Acceptance Criteria:**
3.1: 欄位標題設定
3.2: 資料驗證規則
3.3: 格式化設定

**預計實作內容:**
- 設定 Google Sheets 欄位格式
- 加入資料驗證規則
- 實作條件格式化
- 設定欄位寬度和格式

### Story 3.2: 實作手動更新功能 ⏳ PENDING
**狀態:** ⏳ Pending

As a user,
I want a manual refresh button,
so that I can update data on demand.

**Acceptance Criteria:**
3.1: 更新按鈕實作 ✅ (基本完成)
3.2: 批量更新功能 ✅ (基本完成)
3.3: 狀態指示

**預計實作內容:**
- 完善 updateAllPrices() 函數
- 加入進度指示
- 實作狀態更新通知
- 加入取消功能

### Story 3.3: 新增股票管理功能 ⏳ PENDING
**狀態:** ⏳ Pending

As a user,
I want to easily add or remove stocks,
so that I can customize my tracking list.

**Acceptance Criteria:**
3.1: 新增股票功能
3.2: 刪除股票功能
3.3: 資料驗證

**預計實作內容:**
- 實作新增股票的輔助函數
- 加入股票刪除功能
- 實作資料驗證規則
- 加入批次操作功能

---

## Epic 4: 進階功能與分享 ⏳ PENDING

### Story 4.1: 實作參數設定功能 ⏳ PENDING
**狀態:** ⏳ Pending

As a user,
I want to customize chart parameters,
so that I can adjust the display to my preferences.

**Acceptance Criteria:**
4.1: 天數參數設定
4.2: 設定儲存
4.3: 動態更新

**預計實作內容:**
- 實作設定工作表
- 加入參數儲存機制
- 實作動態參數讀取
- 加入參數驗證

### Story 4.2: 優化錯誤處理 ⏳ PENDING
**狀態:** ⏳ Pending

As a user,
I want clear error messages when data is unavailable,
so that I understand what happened.

**Acceptance Criteria:**
4.1: 網路錯誤處理
4.2: API 限制處理
4.3: 用戶友善訊息

**預計實作內容:**
- 改善錯誤訊息顯示
- 加入重試機制
- 實作降級策略
- 加入錯誤記錄

### Story 4.3: 準備分享功能 ⏳ PENDING
**狀態:** ⏳ Pending

As a user,
I want to share my stock tracking sheet,
so that others can use it.

**Acceptance Criteria:**
4.1: 分享說明文件 ✅ (README 已完成)
4.2: 使用指南 ✅ (README 已完成)
4.3: 部署準備

**預計實作內容:**
- 準備範本試算表
- 加入安裝腳本
- 實作設定向導
- 準備說明文件

---

## 開發追蹤

### 當前狀態
- **進行中 Epic:** Epic 3 (用戶介面優化)
- **進行中 Story:** Story 3.1, 3.2, 3.3
- **已完成 Stories:** 6 (Epic 1 全部 + Epic 2 全部)
- **待處理 Stories:** 3

### 優先順序
1. **高優先:** Story 2.1, 2.2, 2.3 (核心功能完成)
2. **中優先:** Story 3.1, 3.2, 3.3 (用戶體驗改善)
3. **低優先:** Story 4.1, 4.2, 4.3 (進階功能)

### 技術債務
- 需要加入更完整的錯誤處理
- 快取策略需要優化
- 需要加入單元測試

---

*此文件由 BMad Master 自動生成與維護*