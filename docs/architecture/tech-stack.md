### **章節 3: 技術堆疊 (Tech Stack)**

這份表格是股價追蹤工具專案**唯一且最終**的技術選型來源。所有開發工作都必須嚴格遵守此處列出的技術與版本。

| 類別 | 技術 | 版本 | 用途 | 理由 |
| :--- | :--- | :--- | :--- | :--- |
| **語言** | JavaScript | ES6+ | 主要開發語言 | Google Apps Script 原生支援，廣泛的生態系統 |
| **執行環境** | Google Apps Script | V8 | JavaScript 執行環境 | 專案核心平台，與 Google Sheets 深度整合 |
| **框架** | Vanilla JS + Google Services | - | 應用程式框架 | 輕量級，符合 Apps Script 限制 |
| **外部 API** | TWSE, TPEX, Yahoo Finance | - | 股價資料來源 | 官方資料來源，可靠性高 |
| **資料儲存** | Google Sheets | - | 資料儲存和展示 | 用戶介面和資料持久化 |
| **開發工具** | clasp | latest | 本地開發工具 | 支援 Apps Script 的本地開發和版本控制 |
| **快取** | Google Apps Script Properties | - | 資料快取 | 內建服務，無需額外依賴 |
| **測試** | Google Apps Script 內建測試 | - | 基本功能測試 | 符合 Apps Script 環境限制 |
