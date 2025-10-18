# 股價追蹤工具 (Stock Price Tracker)

一個基於 Google Apps Script 的台股和美股即時價格追蹤工具，提供完整的價格資訊和視覺化走勢圖。

## 📋 專案概述

此工具允許用戶在 Google Sheets 中輕鬆追蹤多支股票的即時價格，包括：
- 台股 (TWSE/TPEX) 和美股 (Yahoo Finance) 整合
- 即時股價、昨日收盤價、開盤價、最高價、最低價
- 可自訂天數的歷史走勢圖 (SPARKLINE)
- 批量更新功能
- 易於分享的 Google Sheets 介面

## 🚀 功能特色

### 核心功能
- ✅ 台股上市/上櫃股票即時價格查詢
- ✅ 美股即時價格查詢
- ✅ 歷史價格走勢圖視覺化
- ✅ 完整價格指標顯示
- ✅ 手動批量更新
- ✅ 自訂參數設定

### 技術特色
- 🔧 基於 Google Apps Script 開發
- 📊 Google Sheets 原生整合
- ⚡ Serverless 架構
- 🔄 自動快取和錯誤重試
- 🛡️ 安全可靠的資料來源

## 📁 專案結構

```
stockPrice/
├── stockPrice.gs          # 主程式碼
├── docs/
│   ├── prd.md            # 產品需求文件
│   ├── architecture.md   # 架構設計文件
│   └── stockPrice.csv    # 範例資料格式
├── .bmad-core/           # BMad 框架核心
└── README.md             # 專案說明
```

## 🛠️ 安裝與設定

### 1. 建立 Google Apps Script 專案
1. 開啟 [Google Apps Script](https://script.google.com)
2. 建立新專案
3. 複製 `stockPrice.gs` 的程式碼

### 2. 設定 Google Sheets
1. 建立新的 Google Sheets 檔案
2. 設定以下欄位標題：
   ```
   | 股票代號 | 股票名稱 | 走勢 | 股價 | 昨日收盤 | 開盤價 | 最高價 | 最低價 | 更新時間 |
   ```
3. 在 A2 儲存格輸入股票代號（如：2330）
4. 在 B2 儲存格輸入股票名稱（如：台積電）

### 3. 部署函數
1. 在 Apps Script 編輯器中儲存專案
2. 部署為網路應用程式
3. 設定權限為「任何人」

## 📖 使用說明

### 基本使用
1. 在 Google Sheets 中輸入股票代號和名稱
2. 使用 `=TWSTOCKPRICE(A2)` 公式獲取價格
3. 走勢圖將自動生成在 C 欄

### 進階功能
- **批量更新**：使用自訂選單的「更新所有價格」
- **參數設定**：修改設定工作表調整走勢圖天數
- **新增股票**：直接在試算表中新增列

### 支援的股票代號格式
- 台股上市：4 碼數字（如：2330）
- 台股上櫃：4-6 碼數字或字母組合
- 美股：標準代號（如：AAPL, TSLA）

## 🔧 開發資訊

### 技術棧
- **語言**：JavaScript (ES6+)
- **平台**：Google Apps Script (V8)
- **API**：TWSE、TPEX、Yahoo Finance
- **儲存**：Google Sheets

### 架構設計
- Serverless Functions 架構
- 模組化服務設計
- 快取和錯誤處理機制

### 開發工具
- clasp：本地開發和版本控制
- ESLint：程式碼品質檢查

## 📊 資料來源

- **TWSE**：台灣證券交易所 (上市股票)
- **TPEX**：台灣證券櫃檯買賣中心 (上櫃股票)
- **Yahoo Finance**：美股資料來源

## 📈 版本歷史

| 版本 | 日期 | 描述 |
|------|------|------|
| v1.0 | 2025-10-18 | 初始版本發佈 |

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

## 📄 授權

此專案採用 MIT 授權條款。

## 📞 聯絡資訊

如有問題或建議，請透過 GitHub Issues 聯絡。

---

*由 BMad Master 框架生成*