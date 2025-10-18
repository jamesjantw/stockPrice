# 股價追蹤工具測試策略

## 測試金字塔 (Testing Pyramid)

```
E2E 測試
  /  \
整合測試
   /    \
單元測試
```

## 測試組織 (Test Organization)

### Apps Script 測試 (Apps Script Tests)

```
tests/
├── services/
│   ├── test_stock_price_service.js    # 股價服務測試
│   └── test_cache_manager.js          # 快取管理器測試
├── integration/
│   └── test_api_integration.js        # API 整合測試
└── e2e/
    ├── test_sheets_integration.js     # Sheets 整合測試
    └── test_full_workflow.js          # 完整工作流程測試
```

### 手動測試 (Manual Tests)

```
manual-tests/
├── test_cases.md           # 測試案例說明
├── test_data.csv          # 測試資料
└── test_results.md        # 測試結果記錄
```

## 測試範例 (Test Examples)

### 股價服務測試 (Stock Price Service Test)

```javascript
// test_stock_price_service.js
function testTWSEPriceRetrieval() {
  // 測試 TWSE API 呼叫
  const price = getTWSEPrice("2330");
  assert(price !== null, "應該能取得台積電價格");
  assert(typeof price === "number", "價格應該是數字");
  assert(price > 0, "價格應該大於 0");
}

function testInvalidStockCode() {
  // 測試無效股票代號
  const price = getPrice("INVALID");
  assert(price === null, "無效代號應該回傳 null");
}
```

### 快取管理器測試 (Cache Manager Test)

```javascript
// test_cache_manager.js
function testCacheSetAndGet() {
  const cache = new CacheManager();

  // 測試快取設定和取得
  cache.set("test_key", "test_value");
  const value = cache.get("test_key");

  assert(value === "test_value", "應該能取得快取值");
}

function testCacheExpiration() {
  const cache = new CacheManager();

  // 設定短暫過期時間的快取
  cache.set("test_key", "test_value", 100); // 100ms
  Utilities.sleep(200); // 等待過期

  const value = cache.get("test_key");
  assert(value === null, "過期快取應該回傳 null");
}
```

### Google Sheets 整合測試 (Sheets Integration Test)

```javascript
// test_sheets_integration.js
function testStockListReading() {
  // 建立測試工作表
  const testSheet = createTestSheet();

  // 測試股票清單讀取
  const stocks = readStockList(testSheet);
  assert(stocks.length > 0, "應該能讀取股票清單");
  assert(stocks[0].code, "股票應該有代號");
  assert(stocks[0].name, "股票應該有名稱");
}
```

## 測試策略 (Testing Strategy)

### 測試目標
- **單元測試**：驗證個別函數與類別的正確性
- **整合測試**：驗證 API 呼叫與資料處理
- **E2E 測試**：驗證 Google Sheets 完整工作流程
- **效能測試**：確保 API 回應時間符合需求

### 測試框架選擇
- **主要框架**：Google Apps Script 內建測試 + 手動測試
- **模擬工具**：自訂 mock 函數
- **Sheets 測試**：手動驗證試算表功能
- **API 測試**：模擬外部 API 回應

### 測試覆蓋率目標
- **單元測試**：核心函數 80% 覆蓋率
- **整合測試**：涵蓋所有 API 整合點
- **E2E 測試**：涵蓋主要 Sheets 工作流程
- **錯誤情境**：涵蓋 API 失敗與網路錯誤

## 測試執行環境

### Apps Script 測試環境
```javascript
// 在 Apps Script 編輯器中執行測試
function runAllTests() {
  testTWSEPriceRetrieval();
  testCacheSetAndGet();
  testStockListReading();
  Logger.log("所有測試完成");
}

// 手動測試檢查清單
function manualTestChecklist() {
  Logger.log("手動測試檢查：");
  Logger.log("1. TWSTOCKPRICE('2330') 回傳數字");
  Logger.log("2. updateAllPrices() 更新多支股票");
  Logger.log("3. 自訂選單正常顯示");
  Logger.log("4. 快取功能正常運作");
}
```

### 持續整合測試
- **觸發條件**：程式碼推送到 main 分支
- **測試範圍**：Apps Script 語法檢查和基本功能測試
- **品質閘門**：無語法錯誤，基本函數可執行
- **報告產出**：Apps Script 執行日誌

## 測試資料管理

### 測試資料策略
- **模擬資料**：建立逼真的測試資料集
- **資料隔離**：確保測試間資料不會互相影響
- **資料清理**：測試後自動清理測試資料
- **邊界條件**：涵蓋正常、邊界與異常資料情境

### 測試資料庫設定
- **開發環境**：使用記憶體資料庫進行快速測試
- **測試環境**：使用專用測試資料庫
- **資料庫遷移**：支援測試環境的結構遷移

## 品質保證流程

### 程式碼審查標準
- **測試需求**：新功能必須包含對應測試案例
- **測試品質**：測試案例必須明確且易於維護
- **邊界測試**：涵蓋正常與異常情境
- **效能考量**：避免測試案例影響系統效能

### 持續整合流程
1. **程式碼提交**：觸發自動語法檢查
2. **測試執行**：自動執行完整測試套件
3. **品質驗證**：確認測試通過率與覆蓋率
4. **部署準備**：僅允許通過測試的程式碼部署

## 測試類型詳細說明

### 單元測試 (Unit Tests)
- **目標**：驗證個別函數與方法的正確性
- **範圍**：隔離測試，不依賴外部資源
- **工具**：pytest, unittest.mock
- **執行時間**：快速，通常在數秒內完成

### 整合測試 (Integration Tests)
- **目標**：驗證模組間互動與資料流
- **範圍**：測試模組整合點與介面契約
- **工具**：pytest, 測試資料庫
- **執行時間**：中等，通常在數十秒內完成

### 端到端測試 (E2E Tests)
- **目標**：驗證完整使用者工作流程
- **範圍**：從使用者操作到系統回應的完整流程
- **工具**：pytest, 視覺化測試工具
- **執行時間**：較長，通常需要數分鐘

### 效能測試 (Performance Tests)
- **目標**：驗證系統效能指標符合需求
- **範圍**：回應時間、資源使用率、負載處理
- **工具**：pytest-benchmark, 效能監控工具
- **執行時間**：依測試規模而定

## 測試自動化

### 自動化測試管線
- **觸發機制**：程式碼提交、排程執行、手動觸發
- **平行執行**：支援多執行緒測試執行
- **結果報告**：自動產生測試報告與趨勢分析
- **失敗通知**：測試失敗時自動通知相關人員

### 測試環境管理
- **環境隔離**：開發、測試、生產環境分離
- **環境複製**：支援測試環境快速複製與還原
- **資源監控**：追蹤測試環境資源使用狀況

## 測試結果分析

### 測試指標追蹤
- **通過率**：整體測試通過率統計
- **執行時間**：測試執行時間趨勢分析
- **覆蓋率**：程式碼覆蓋率追蹤與改進
- **錯誤率**：測試失敗率與原因分析

### 測試報告
- **詳細報告**：包含測試結果、錯誤詳情、效能指標
- **趨勢分析**：長期測試結果趨勢追蹤
- **改進建議**：基於測試結果的品質改進建議

## 測試團隊角色

### 開發工程師
- 負責撰寫與維護單元測試
- 確保新功能包含對應測試案例
- 參與測試失敗問題診斷與修復

### QA 工程師
- 負責整合測試與 E2E 測試設計
- 執行測試驗證與品質評估
- 提供測試結果分析與改進建議

### 架構師
- 定義測試架構與策略方向
- 審查測試案例設計與覆蓋率
- 指導測試技術選型與工具使用

## 測試文件標準

### 測試案例文件
- **明確描述**：清楚說明測試目的與驗證點
- **前置條件**：列出測試執行必要條件
- **測試步驟**：詳細的操作步驟說明
- **期望結果**：明確的驗證標準與成功條件
- **測試資料**：提供測試資料範例與準備方式

### 測試報告文件
- **執行摘要**：測試結果概覽與關鍵指標
- **詳細結果**：每個測試案例的執行結果與錯誤詳情
- **趨勢分析**：長期測試結果趨勢與改進建議
- **問題追蹤**：測試發現問題的記錄與狀態追蹤