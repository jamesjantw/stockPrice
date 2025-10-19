# 股價追蹤工具 Product Requirements Document (PRD)

## 變更記錄

| 日期 | 版本 | 描述 | 作者 |
|------|------|------|------|
| 2025-10-18 | v1.0 | 初始 PRD 建立 | BMad Master |
| 2025-10-18 | v1.1 | PO 審核通過，更新狀態為 Approved | BMad Master |
| 2025-10-19 | v1.2 | PO 檢討程式處理方式，提出效能優化需求 | BMad Master |

## 目標與背景脈絡

### 目標
- 建立一個可在 Google Sheets 中即時顯示台股和美股價格的工具
- 提供過去 30 天股價走勢圖 (可調整天數)
- 顯示即時股價、昨日收盤價、開盤價、最高價、最低價等關鍵指標
- 支援用戶自訂股票清單並可分享給其他人使用
- 簡化投資者追蹤多支股票的流程

### 背景脈絡
這個專案解決了投資者在追蹤台股和美股價格時需要手動查詢多個來源的問題。目前用戶必須在不同網站間切換，浪費時間且容易出錯。透過整合 Google Sheets 介面，我們提供一個統一的平台，讓用戶能夠輕鬆管理個人化的股票投資組合，並即時獲得關鍵的市場資訊。

## 需求

### 功能需求

FR1: 系統應支援台股 (TWSE) 和上櫃 (TPEX) 股票的即時價格查詢
FR2: 系統應支援美股 (Yahoo Finance) 的即時價格查詢
FR3: 用戶應能在 Google Sheets 中輸入股票代號和名稱
FR4: 系統應自動產生過去 N 天 (預設 30 天) 的股價走勢圖，使用 SPARKLINE 函數
FR5: 系統應顯示即時股價、昨日收盤價、開盤價、最高價、最低價
FR6: 系統應支援用戶自訂天數調整走勢圖顯示期間
FR7: 系統應提供手動更新按鈕來重新整理所有股票資料
FR8: 系統應在無法取得資料時顯示適當的錯誤訊息
FR9: 系統應支援批量更新多支股票的資料
FR10: 系統應提供簡單的介面讓用戶新增或刪除股票

### 非功能需求

NFR1: 資料更新回應時間應在 10 秒內完成
NFR2: 系統應支援至少 100 支股票同時追蹤
NFR3: 系統應在工作日台灣時間 9:00-13:30 期間正常運作
NFR4: 系統應遵循 Google Apps Script 的使用限制
NFR5: 系統應提供基本的錯誤處理和重試機制
NFR6: 系統應使用 UTF-8 編碼支援中文顯示
NFR7: 系統應避免儲存敏感的用戶資料
NFR8: 系統應提供清晰的狀態指示 (載入中、完成、錯誤)

## 用戶介面設計目標

### 整體 UX 願景
提供一個直觀、簡潔的 Google Sheets 介面，讓投資者能夠快速設定和查看股票資訊。介面應以資料為中心，同時保持視覺清爽，避免過度複雜的設計。

### 關鍵互動模式
- 輸入股票代號後自動觸發資料更新
- 點擊更新按鈕重新整理所有資料
- 滑鼠懸停顯示詳細價格資訊
- 支援鍵盤快速操作

### 核心畫面與視圖
- 主要股票清單視圖：顯示所有股票的摘要資訊
- 個別股票詳細視圖：展開顯示完整價格指標
- 設定面板：調整走勢圖天數等參數

### 無障礙性：WCAG AA
- 支援螢幕閱讀器
- 提供足夠的色彩對比
- 支援鍵盤導航

### 品牌
無特定品牌要求，保持 Google Sheets 原生風格。

### 目標裝置與平台
Web Responsive (Google Sheets 網頁版和應用程式)

## 技術假設

### 儲存庫結構
Monorepo - 單一 Google Apps Script 專案

### 服務架構
Serverless - Google Apps Script 函數

### 測試需求
Unit + Integration - 基本單元測試和 API 整合測試

### 其他技術假設與要求
- 使用 Google Apps Script 作為主要開發平台
- 整合 TWSE、TPEX 和 Yahoo Finance API
- 使用 Google Sheets 作為資料展示和儲存介面
- 實作快取機制以避免過度 API 呼叫
- 處理 API 速率限制和錯誤情況
- 使用 JavaScript ES6+ 語法

## Epic 清單

Epic 1: 基礎架構與核心功能
Epic 2: 資料整合與顯示
Epic 3: 用戶介面優化
Epic 4: 進階功能與分享

## Epic 1: 基礎架構與核心功能

建立專案基礎架構，實作基本的股價查詢功能，並設定 Google Sheets 介面。

### Story 1.1: 設定 Google Apps Script 專案
As a developer,
I want to set up a new Google Apps Script project,
so that I can start implementing the stock price tracking functionality.

**Acceptance Criteria:**
1.1: Google Apps Script 專案已建立並連結到 Google Sheets
1.2: 基本的專案結構和檔案已設定
1.3: 開發環境已準備就緒

### Story 1.2: 實作台股價格查詢功能
As a user,
I want to retrieve real-time Taiwan stock prices,
so that I can see current market data.

**Acceptance Criteria:**
1.1: TWSE API 整合完成
1.2: TPEX API 整合完成
1.3: 股票代號驗證功能實作
1.4: 錯誤處理機制實作

### Story 1.3: 實作美股價格查詢功能
As a user,
I want to retrieve real-time US stock prices,
so that I can track international markets.

**Acceptance Criteria:**
1.1: Yahoo Finance API 整合完成
1.2: 美股代號格式驗證
1.3: 資料格式統一處理

## Epic 2: 資料整合與顯示

整合多個資料來源，提供完整的價格資訊和視覺化。

### Story 2.1: 實作歷史價格資料擷取
As a user,
I want to see historical price data for the past N days,
so that I can analyze price trends.

**Acceptance Criteria:**
2.1: 歷史資料 API 整合
2.2: 可設定天數參數
2.3: 資料快取機制

### Story 2.2: 實作 SPARKLINE 走勢圖
As a user,
I want to see visual price charts using SPARKLINE,
so that I can quickly understand price movements.

**Acceptance Criteria:**
2.1: SPARKLINE 函數整合
2.2: 圖表樣式設定
2.3: 動態資料更新

### Story 2.3: 實作完整價格指標顯示
As a user,
I want to see comprehensive price indicators,
so that I have all necessary market information.

**Acceptance Criteria:**
2.1: 即時價格顯示
2.2: 昨日收盤價顯示
2.3: 開盤價、最高價、最低價顯示
2.4: 資料格式化

## Epic 3: 用戶介面優化

優化 Google Sheets 介面，提供更好的用戶體驗。

### Story 3.1: 設計股票清單介面
As a user,
I want an organized stock list interface,
so that I can easily manage my portfolio.

**Acceptance Criteria:**
3.1: 欄位標題設定
3.2: 資料驗證規則
3.3: 格式化設定

### Story 3.2: 實作手動更新功能
As a user,
I want a manual refresh button,
so that I can update data on demand.

**Acceptance Criteria:**
3.1: 更新按鈕實作
3.2: 批量更新功能
3.3: 狀態指示

### Story 3.3: 新增股票管理功能
As a user,
I want to easily add or remove stocks,
so that I can customize my tracking list.

**Acceptance Criteria:**
3.1: 新增股票功能
3.2: 刪除股票功能
3.3: 資料驗證

## Epic 4: 進階功能與分享

加入進階功能並支援分享。

### Story 4.1: 實作參數設定功能
As a user,
I want to customize chart parameters,
so that I can adjust the display to my preferences.

**Acceptance Criteria:**
4.1: 天數參數設定
4.2: 設定儲存
4.3: 動態更新

### Story 4.2: 優化錯誤處理
As a user,
I want clear error messages when data is unavailable,
so that I understand what happened.

**Acceptance Criteria:**
4.1: 網路錯誤處理
4.2: API 限制處理
4.3: 用戶友善訊息

### Story 4.3: 準備分享功能
As a user,
I want to share my stock tracking sheet,
so that others can use it.

**Acceptance Criteria:**
4.1: 分享說明文件
4.2: 使用指南
4.3: 部署準備

## 檢查表結果報告

根據 PM 檢查表評估，這個專案的需求定義完整且可行：

- **整體完整性**：90% - 所有核心需求已定義
- **MVP 範圍**：適中 - 功能聚焦於核心價值
- **架構準備度**：準備就緒 - 技術選擇明確
- **最關鍵差距**：無關鍵差距

## 文件狀態
**狀態**: 🔄 Under Review by PO
**審核日期**: 2025-10-19
**審核者**: BMad Master (PO Mode)

### PO 檢討結果
1. **資料擷取問題**: 目前無法取得任何股票價格資料，需要檢查 API 整合
2. **效能問題**: 逐個儲存格更新方式效率低下，需要批量更新優化
3. **用戶體驗**: 缺乏進度指示，需要實作進度條功能

### 優化需求
- **效能優化**: 實作批量資料更新而非逐個儲存格更新
- **進度指示**: 新增進度條顯示更新進度
- **API 診斷**: 檢查並修復股票資料擷取問題
- **錯誤處理**: 改善錯誤訊息和重試機制

專案進入優化階段。

## 下一步

### UX 專家提示
請根據此 PRD 設計 Google Sheets 介面的用戶體驗，重點關注資料的可讀性和操作的簡便性。

### 架構師提示
請根據此 PRD 設計 Google Apps Script 的技術架構，重點關注 API 整合的可靠性和效能優化。