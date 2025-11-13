# 股價追蹤工具 - 專案參考文件

**版本:** 1.0  
**生成日期:** 2025-01-XX  
**專案狀態:** Active Development (v2.0)  
**文件範圍:** 完整專案參考文件，優化用於 AI 輔助開發

---

## 文件範圍

本文件提供股價追蹤工具專案的完整技術參考，涵蓋：
- 專案結構與組織
- 核心架構與設計模式
- 程式碼組織與模組說明
- API 與函數參考
- 開發規範與最佳實務
- 測試策略與品質保證

**注意:** 本專案已完成 v2.0 重新設計，從手動 API 管理轉為使用 Google Sheets 內建函數 (GOOGLEFINANCE + AI())。

---

## 變更記錄

| 日期 | 版本 | 描述 | 作者 |
|------|------|------|------|
| 2025-01-XX | 1.0 | 初始專案參考文件建立 | Analyst |

---

## 快速參考 - 關鍵檔案與入口點

### 關鍵檔案

- **主程式碼**: `stockPrice.gs` - 單一檔案包含所有功能 (3,625 行)
- **產品需求**: `docs/prd.md` - 完整產品需求文件
- **架構文件**: `docs/architecture.md` - 系統架構設計
- **重新設計架構**: `docs/architecture/redesign-architecture.md` - v2.0 架構說明
- **Epic/Stories**: `docs/epics-stories.md` - 開發追蹤
- **測試結果**: `docs/test-results.md` - 測試報告

### 專案入口點

- **初始化**: `initializeSheetFormat()` - 設定試算表格式
- **批量更新**: `updateAllPrices()` - 更新所有股票資料
- **單一更新**: `updateSingleStock()` - 更新單一股票
- **新增股票**: `addNewStock()` - 互動式新增股票
- **刪除股票**: `removeStock()` - 安全刪除股票

### 公開函數 (可在 Google Sheets 中使用)

- `GOOGLEFINANCEPRICE(stockCode)` - 取得即時股價
- `GETPREVIOUSCLOSE(stockCode)` - 取得昨日收盤價
- `GETOPENPRICE(stockCode)` - 取得開盤價
- `GETHIGHPRICE(stockCode)` - 取得最高價
- `GETLOWPRICE(stockCode)` - 取得最低價
- `GETVOLUME(stockCode)` - 取得成交量
- `GETCHANGE(stockCode)` - 取得漲跌金額
- `GETSPARKLINE(stockCode, days)` - 生成走勢圖

---

## 高階架構

### 技術摘要

股價追蹤工具 v2.0 是一個 Google Apps Script 應用程式，充分利用 Google Sheets 內建函數提供台股和美股的即時價格追蹤、走勢分析和投資建議。系統採用零 API 呼叫架構，直接使用 GOOGLEFINANCE 和 AI() 函數，大幅提升效能和穩定性。

### 實際技術棧

| 類別 | 技術 | 版本 | 備註 |
|------|------|------|------|
| **執行環境** | Google Apps Script | V8 | JavaScript ES6+ 支援 |
| **資料來源** | GOOGLEFINANCE | 內建 | 台股/美股即時資料 |
| **AI 分析** | AI() 函數 | 內建 | Google Workspace 企業版 |
| **資料儲存** | Google Sheets | - | 原生整合 |
| **開發工具** | clasp | latest | 本地開發與版本控制 |

### 儲存庫結構

- **類型**: Monorepo - 單一 Google Apps Script 專案
- **主要檔案**: `stockPrice.gs` (單一檔案架構)
- **文件目錄**: `docs/` - 所有專案文件
- **備份目錄**: `v4-backup/` - 版本備份

---

## 原始碼樹與模組組織

### 專案結構 (實際)

```
stockPrice/
├── stockPrice.gs                    # 主程式碼 (3,625 行)
├── docs/
│   ├── index.md                    # 本文件 - 專案參考
│   ├── prd.md                      # 產品需求文件
│   ├── architecture.md             # 系統架構
│   ├── architecture/
│   │   ├── redesign-architecture.md  # v2.0 重新設計架構
│   │   ├── coding-standards.md      # 編碼標準
│   │   ├── tech-stack.md            # 技術棧說明
│   │   └── testing-strategy.md      # 測試策略
│   ├── epics-stories.md            # Epic 與 Story 追蹤
│   ├── stories/
│   │   └── story-redesign-stock-price-tracker.md
│   ├── test-results.md             # 測試結果
│   └── bmm-workflow-status.yaml    # BMM 工作流程狀態
├── README.md                       # 專案說明
├── README.1.0.md                   # v1.0 版本說明
└── LICENSE                         # 授權文件
```

### 核心模組與用途

#### 1. 市場代號映射服務 (`MarketCodeMapper`)
- **檔案位置**: `stockPrice.gs` (行 15-76)
- **用途**: 將股票代號轉換為 GOOGLEFINANCE 格式
- **關鍵方法**:
  - `mapToGoogleFinance(stockCode)` - 轉換代號格式
  - `getMarketDescription(stockCode)` - 取得市場類型描述
- **支援市場**: TWSE (台股上市), TPEX (台股上櫃), NASDAQ, NYSE, AMEX, OTC

#### 2. GOOGLEFINANCE 整合服務 (`GoogleFinanceService`)
- **檔案位置**: `stockPrice.gs` (行 84-131)
- **用途**: 生成 GOOGLEFINANCE 公式
- **關鍵方法**:
  - `generateGoogleFinanceFormula(stockCode, attribute)` - 生成價格公式
  - `generateGoogleFinanceHistoryFormula(stockCode, days, attribute)` - 生成歷史資料公式
- **支援屬性**: price, change, changepct, volume, high, low, open, close

#### 3. 快取管理器 (`CacheManager`)
- **檔案位置**: `stockPrice.gs` (行 302-343)
- **用途**: 實作快取機制以優化 API 呼叫 (v1.0 遺留，v2.0 主要使用 GOOGLEFINANCE 內建快取)
- **關鍵方法**:
  - `get(key)` - 取得快取資料
  - `set(key, data)` - 設定快取資料
  - `clear()` - 清除所有快取
- **快取時間**: 5 分鐘 TTL

#### 4. 股價服務 (`StockPriceService`)
- **檔案位置**: `stockPrice.gs` (行 348-1365)
- **用途**: 從外部 API 擷取股價資料 (v1.0 遺留，v2.0 主要使用 GOOGLEFINANCE)
- **關鍵方法**:
  - `getTWSEPrice(stockCode)` - 取得台股價格
  - `getTPEXPrice(stockCode)` - 取得上櫃價格
  - `getUSPrice(stockCode)` - 取得美股價格
  - `getTWSEHistory(stockCode, days)` - 取得台股歷史資料
  - `getUSHistory(stockCode, days)` - 取得美股歷史資料
- **API 端點**:
  - TWSE: `https://www.twse.com.tw/exchangeReport/STOCK_DAY`
  - TPEX: `https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_info/st43.php`
  - Yahoo Finance: `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`

#### 5. AI 分析服務 (`AIAnalysisService`)
- **檔案位置**: `stockPrice.gs` (行 1367-1471)
- **用途**: 生成 AI() 函數公式用於走勢分析和投資建議
- **關鍵方法**:
  - `generateAIAnalysisFormula(stockCode, analysisType, stockName)` - 生成趨勢分析公式
  - `generateAIInvestmentAdviceFormula(stockCode, stockName)` - 生成投資建議公式
  - `generateAIPredictionFormula(stockCode, days)` - 生成預測公式
- **分析類型**: trend (趨勢), advice (投資建議), prediction (預測)

#### 6. Google Sheets 整合服務 (`GoogleSheetsService`)
- **檔案位置**: `stockPrice.gs` (行 1472-1681)
- **用途**: 管理與 Google Sheets 的資料讀寫操作
- **關鍵方法**:
  - `getActiveSheet()` - 取得當前工作表
  - `readStockList(sheet)` - 讀取股票清單
  - `setGoogleFinanceFormulas(sheet, rowIndex, stockCode)` - 設定 GOOGLEFINANCE 公式
  - `setAIAnalysisFormulas(sheet, rowIndex, stockCode, stockName)` - 設定 AI 分析公式
  - `updatePrices(sheet, stocks)` - 批量更新價格

#### 7. 資料處理服務 (`DataProcessingService`)
- **檔案位置**: `stockPrice.gs` (行 1682-1767)
- **用途**: 處理和格式化股價資料
- **關鍵方法**:
  - `processPriceData(rawData)` - 處理價格資料
  - `generateSparkline(prices)` - 生成走勢圖 (v1.0 遺留，v2.0 使用 GETSPARKLINE)

---

## 核心工作流程

### 初始化流程

1. 用戶執行 `initializeSheetFormat()`
2. 建立工作表標題和格式
3. 設定資料驗證規則
4. 設定條件格式化
5. 建立設定工作表
6. 加入範例資料

### 批量更新流程

1. 用戶執行 `updateAllPrices()`
2. 顯示進度對話框
3. 讀取股票清單 (`readStockList()`)
4. 批量設定 GOOGLEFINANCE 公式 (`setGoogleFinanceFormulas()`)
5. 批量設定 AI 分析公式 (`setAIAnalysisFormulas()`)
6. 強制重新計算所有公式
7. 更新進度顯示
8. 關閉進度對話框

### 新增股票流程

1. 用戶執行 `addNewStock()`
2. 顯示輸入對話框
3. 驗證股票代號格式
4. 判斷市場類型 (`MarketCodeMapper`)
5. 設定所有公式 (GOOGLEFINANCE + AI)
6. 設定走勢圖 (`GETSPARKLINE`)
7. 更新條件格式化

---

## 資料模型

### 股票資料模型

```javascript
{
  code: string,        // 股票代號 (e.g., "2330", "AAPL")
  name: string,        // 股票名稱 (e.g., "台積電", "Apple Inc.")
  rowIndex: number,   // Google Sheets 行索引
  market: string      // 市場類型 ("TWSE", "TPEX", "US")
}
```

### 價格資料模型

```javascript
{
  currentPrice: number,    // 即時股價
  previousClose: number,   // 昨日收盤價
  openPrice: number,       // 開盤價
  highPrice: number,       // 最高價
  lowPrice: number,        // 最低價
  volume: number,          // 成交量
  change: number           // 漲跌金額
}
```

### Google Sheets 欄位結構

| 欄位 | 名稱 | 公式/內容 | 說明 |
|------|------|----------|------|
| A | 股票代號 | 用戶輸入 | 4碼數字 (台股) 或字母數字 (美股) |
| B | 股票名稱 | 用戶輸入或自動填入 | 股票中文/英文名稱 |
| C | 走勢圖 | `=GETSPARKLINE(A2)` | SPARKLINE 視覺化 |
| D | 即時股價 | `=GOOGLEFINANCEPRICE(A2)` | GOOGLEFINANCE 價格 |
| E | 漲跌金額 | `=GETCHANGE(A2)` | 漲跌金額 (顏色標示) |
| F | 開盤價 | `=GETOPENPRICE(A2)` | 當日開盤價 |
| G | 最高價 | `=GETHIGHPRICE(A2)` | 當日最高價 |
| H | 最低價 | `=GETLOWPRICE(A2)` | 當日最低價 |
| I | 成交量 | `=GETVOLUME(A2)` | 當日成交量 |
| J | AI 走勢分析 | `=AI(...)` | AI 生成的趨勢分析 |
| K | AI 投資建議 | `=AI(...)` | AI 生成的投資建議 |
| L | 更新時間 | `=NOW()` | 最後更新時間戳記 |

---

## API 與函數參考

### 公開函數 (可在 Google Sheets 中使用)

#### GOOGLEFINANCEPRICE(stockCode)
取得即時股價
- **參數**: `stockCode` (string) - 股票代號
- **返回**: number - 即時股價
- **範例**: `=GOOGLEFINANCEPRICE("2330")`

#### GETSPARKLINE(stockCode, days)
生成股價走勢圖
- **參數**: 
  - `stockCode` (string) - 股票代號
  - `days` (number, 可選) - 歷史天數 (預設從設定表讀取)
- **返回**: SPARKLINE 公式字串
- **範例**: `=GETSPARKLINE("2330", 30)`

#### 其他公開函數
- `GETPREVIOUSCLOSE(stockCode)` - 昨日收盤價
- `GETOPENPRICE(stockCode)` - 開盤價
- `GETHIGHPRICE(stockCode)` - 最高價
- `GETLOWPRICE(stockCode)` - 最低價
- `GETVOLUME(stockCode)` - 成交量
- `GETCHANGE(stockCode)` - 漲跌金額

### 內部函數 (Apps Script 使用)

#### updateAllPrices()
批量更新所有股票資料
- **觸發**: 選單項目 "更新所有資料"
- **流程**: 讀取清單 → 設定公式 → 重新計算 → 顯示進度

#### initializeSheetFormat()
初始化試算表格式
- **觸發**: 選單項目 "初始化試算表格式"
- **功能**: 設定標題、驗證、格式化、範例資料

#### addNewStock()
新增股票
- **觸發**: 選單項目 "新增股票"
- **流程**: 輸入對話框 → 驗證 → 設定公式 → 更新格式

#### removeStock()
刪除股票
- **觸發**: 選單項目 "刪除股票"
- **流程**: 選擇行 → 確認 → 刪除資料

---

## 設計模式與架構決策

### 使用的設計模式

1. **服務層模式**: 6 個專門服務類別，各司其職
2. **單例模式**: 全域服務實例 (marketMapper, googleFinanceService 等)
3. **策略模式**: 市場代號映射策略 (TWSE, TPEX, US)
4. **模板方法模式**: 統一的公式生成流程

### 架構決策記錄

#### 決策 1: 單一檔案架構
- **決策**: 所有程式碼集中在 `stockPrice.gs`
- **理由**: Google Apps Script 專案簡單，單一檔案易於管理
- **影響**: 檔案較大 (3,625 行)，但結構清晰

#### 決策 2: v2.0 轉向 GOOGLEFINANCE
- **決策**: 從手動 API 管理轉為使用 GOOGLEFINANCE 內建函數
- **理由**: 
  - 零 API 呼叫，效能大幅提升
  - Google 基礎設施，穩定性高
  - 無需管理 API 金鑰和配額
- **影響**: 保留 v1.0 API 程式碼但不再使用

#### 決策 3: 整合 AI() 函數
- **決策**: 使用 Google Sheets AI() 函數提供投資分析
- **理由**: 
  - 提供差異化價值
  - 無需外部 AI API 整合
  - Google Workspace 企業版原生支援
- **影響**: 需要 Workspace 企業版授權

#### 決策 4: 保留向下相容性
- **決策**: 保留 v1.0 關鍵函數介面
- **理由**: 用戶遷移便利性
- **影響**: 程式碼包含遺留功能

---

## 開發規範與最佳實務

### 編碼標準

參考 `docs/architecture/coding-standards.md`:

- **命名慣例**:
  - 類別: PascalCase (`MarketCodeMapper`)
  - 函數: camelCase (`updateAllPrices`)
  - 常數: UPPER_SNAKE_CASE (`API_TIMEOUT`)
  - 變數: camelCase (`stockCode`)

- **註解規範**:
  - 所有公開函數必須有 JSDoc 註解
  - 複雜邏輯必須有行內註解
  - 類別必須有用途說明

- **錯誤處理**:
  - 所有外部 API 呼叫必須有 try-catch
  - 提供用戶友善的錯誤訊息
  - 記錄錯誤到 Logger

### 測試策略

參考 `docs/architecture/testing-strategy.md`:

- **單元測試**: 測試各個服務類別的方法
- **整合測試**: 測試完整工作流程
- **功能測試**: 測試用戶操作場景
- **測試函數**: `testRedesignFunctionality()`, `runRedesignTestSuite()`

### 版本控制

- **Git 工作流程**: 使用 BMad 框架標準
- **提交訊息**: 結構化格式
- **分支策略**: main 分支 + feature 分支

---

## 已知問題與技術債務

### 已知問題

1. **v1.0 API 程式碼保留**: 雖然不再使用，但程式碼仍保留在檔案中
2. **快取管理器**: v2.0 主要使用 GOOGLEFINANCE 內建快取，但 CacheManager 仍存在
3. **市場判斷邏輯**: 台股上櫃和美股代號可能混淆 (4-6碼字母數字)

### 技術債務

1. **程式碼重構**: 考慮將 v1.0 遺留程式碼移至獨立模組或移除
2. **錯誤處理增強**: 部分函數錯誤處理可以更完善
3. **測試覆蓋**: 增加更多自動化測試
4. **文件更新**: 確保所有文件與 v2.0 架構一致

---

## 外部依賴與整合

### Google 服務

- **Google Sheets API**: 讀寫試算表資料
- **GOOGLEFINANCE**: 股價資料來源
- **AI() 函數**: AI 分析功能 (需要 Workspace 企業版)
- **Utilities**: 日期格式化等工具函數
- **Logger**: 記錄和除錯

### 外部 API (v1.0 遺留，v2.0 不再使用)

- **TWSE API**: `https://www.twse.com.tw`
- **TPEX API**: `https://www.tpex.org.tw`
- **Yahoo Finance API**: `https://query1.finance.yahoo.com`

---

## 效能考量

### 優化策略

1. **零 API 呼叫**: v2.0 使用 GOOGLEFINANCE，無需外部 API
2. **批量處理**: 一次設定所有公式，避免逐一更新
3. **公式快取**: GOOGLEFINANCE 自動快取機制
4. **進度顯示**: 用戶可見的進度指示

### 效能指標

- **載入速度**: 毫秒級 (GOOGLEFINANCE 內建快取)
- **穩定性**: 99%+ (Google 基礎設施)
- **支援股票數**: 100+ 支股票同時追蹤
- **更新時間**: < 10 秒 (批量更新)

---

## 安全考量

### 資料隱私

- **無敏感資料**: 不收集或儲存個人財務資訊
- **Google 隱私政策**: 符合 Google Workspace 隱私標準
- **資料加密**: 使用 Google 內建加密機制

### 輸入驗證

- **股票代號驗證**: 格式檢查 (4碼數字或字母數字)
- **資料驗證**: Google Sheets 資料驗證規則
- **錯誤處理**: 完善的異常處理機制

---

## 部署與維護

### 部署流程

1. **本地開發**: 使用 clasp 進行本地開發
2. **版本控制**: Git 提交和推送
3. **部署到 Apps Script**: `clasp push`
4. **測試驗證**: 執行測試套件
5. **用戶通知**: 更新說明文件

### 維護策略

- **版本追蹤**: Git 標籤和變更日誌
- **錯誤監控**: Apps Script 執行記錄
- **用戶支援**: README 和說明文件
- **定期更新**: 基於用戶回饋的改進

---

## 未來改進方向

### 短期 (Epic 4)

1. **參數設定功能**: 用戶可自訂走勢圖天數等參數
2. **錯誤處理優化**: 更友善的錯誤訊息和重試機制
3. **分享功能準備**: 準備範本和部署文件

### 長期

1. **更多技術指標**: RSI, MACD, 布林通道等
2. **行動裝置支援**: 優化行動版 Google Sheets 體驗
3. **團隊協作功能**: 多人共享和協作功能
4. **進階分析**: 更多 AI 分析類型和深度

---

## 相關文件

- [產品需求文件](prd.md)
- [系統架構文件](architecture.md)
- [v2.0 重新設計架構](architecture/redesign-architecture.md)
- [編碼標準](architecture/coding-standards.md)
- [測試策略](architecture/testing-strategy.md)
- [Epic 與 Story 追蹤](epics-stories.md)
- [測試結果](test-results.md)

---

**文件狀態**: ✅ Complete  
**最後更新**: 2025-01-XX  
**維護者**: Analyst Agent

