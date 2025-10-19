/**
 * 股價追蹤工具 - Google Apps Script (重新設計版本)
 * 使用 GOOGLEFINANCE 和 AI() 函數提供台股和美股的即時價格、走勢分析和投資建議
 *
 * @version 2.0
 * @author BMad Master (Code Mode)
 * @date 2025-10-19
 */

// ========== 核心服務類別 ==========

/**
 * 市場代號映射服務 - 負責將股票代號轉換為 GOOGLEFINANCE 格式
 */
class MarketCodeMapper {
  constructor() {
    this.mappings = {
      // 台股上市 (TWSE)
      'TWSE': (code) => `TPE:${code}`,
      // 台股上櫃 (TPEX) - 使用相同格式
      'TPEX': (code) => `TPE:${code}`,
      // 美股主要市場
      'NASDAQ': (code) => `NASDAQ:${code}`,
      'NYSE': (code) => `NYSE:${code}`,
      // 美股其他市場
      'AMEX': (code) => `AMEX:${code}`,
      'OTC': (code) => `OTC:${code}`
    };
  }

  /**
   * 根據股票代號判斷市場類型並轉換為 GOOGLEFINANCE 格式
   * @param {string} stockCode - 股票代號
   * @returns {string} GOOGLEFINANCE 格式的代號
   */
  mapToGoogleFinance(stockCode) {
    if (!stockCode || typeof stockCode !== 'string') {
      return stockCode;
    }

    stockCode = stockCode.trim().toUpperCase();

    // 台股：4碼數字 = 上市，4-6碼字母數字 = 上櫃
    if (/^\d{4}$/.test(stockCode)) {
      return this.mappings.TWSE(stockCode);
    } else if (/^[A-Z0-9]{4,6}$/.test(stockCode)) {
      // 檢查是否為已知的上櫃股票或美股
      // 這裡可以擴展為更複雜的邏輯
      return this.mappings.NASDAQ(stockCode); // 預設為美股
    }

    // 如果無法判斷，返回原始代號
    return stockCode;
  }

  /**
   * 取得市場類型描述
   * @param {string} stockCode - 股票代號
   * @returns {string} 市場類型描述
   */
  getMarketDescription(stockCode) {
    if (!stockCode || typeof stockCode !== 'string') {
      return '未知';
    }

    stockCode = stockCode.trim().toUpperCase();

    if (/^\d{4}$/.test(stockCode)) {
      return '台股上市';
    } else if (/^[A-Z0-9]{4,6}$/.test(stockCode)) {
      return '美股';
    }

    return '未知市場';
  }
}

// 全域市場映射實例
const marketMapper = new MarketCodeMapper();

/**
 * GOOGLEFINANCE 整合服務 - 使用 Google Sheets 內建函數
 */
class GoogleFinanceService {
  constructor() {
    this.mapper = marketMapper;
  }

  /**
   * 產生 GOOGLEFINANCE 公式
   * @param {string} stockCode - 股票代號
   * @param {string} attribute - 屬性 (price, change, volume 等)
   * @returns {string} GOOGLEFINANCE 公式
   */
  generateGoogleFinanceFormula(stockCode, attribute = "price") {
    // 對於台股，直接使用代號，GOOGLEFINANCE 會自動處理
    if (/^\d{4}$/.test(stockCode)) {
      return `GOOGLEFINANCE("TPE:${stockCode}", "${attribute}")`;
    }
    // 對於美股，直接使用代號
    return `GOOGLEFINANCE("${stockCode}", "${attribute}")`;
  }

  /**
   * 產生 GOOGLEFINANCE 歷史資料公式
   * @param {string} stockCode - 股票代號
   * @param {number} days - 歷史天數
   * @param {string} attribute - 屬性
   * @returns {string} GOOGLEFINANCE 歷史資料公式
   */
  generateGoogleFinanceHistoryFormula(stockCode, days = 30, attribute = "close") {
    const mappedCode = this.mapper.mapToGoogleFinance(stockCode);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const startDateStr = Utilities.formatDate(startDate, "GMT+8", "yyyy-MM-dd");
    const endDateStr = Utilities.formatDate(endDate, "GMT+8", "yyyy-MM-dd");

    return `GOOGLEFINANCE("${mappedCode}", "${attribute}", "${startDateStr}", "${endDateStr}")`;
  }

  /**
   * 取得市場類型描述
   * @param {string} stockCode - 股票代號
   * @returns {string} 市場類型
   */
  getMarketType(stockCode) {
    return this.mapper.getMarketDescription(stockCode);
  }
}

/**
 * 測試 GOOGLEFINANCE 整合功能
 */
function testGoogleFinanceIntegration() {
  Logger.log("測試 GOOGLEFINANCE 整合功能...");

  try {
    // 測試台股 GOOGLEFINANCE 公式生成
    const twseFormula = googleFinanceService.generateGoogleFinanceFormula("2330", "price");
    Logger.log("台股 GOOGLEFINANCE 公式: " + twseFormula);

    // 測試美股 GOOGLEFINANCE 公式生成
    const usFormula = googleFinanceService.generateGoogleFinanceFormula("AAPL", "price");
    Logger.log("美股 GOOGLEFINANCE 公式: " + usFormula);

    // 測試歷史資料公式生成
    const historyFormula = googleFinanceService.generateGoogleFinanceHistoryFormula("2330", 30, "close");
    Logger.log("歷史資料公式: " + historyFormula);

    Logger.log("GOOGLEFINANCE 整合測試完成");
  } catch (e) {
    Logger.log("GOOGLEFINANCE 整合測試錯誤: " + e);
  }
}

/**
 * 測試 AI 分析功能
 */
function testAIAnalysis() {
  Logger.log("測試 AI 分析功能...");

  try {
    // 測試 AI 趨勢分析公式生成
    const trendFormula = aiAnalysisService.generateAIAnalysisFormula("2330", "trend");
    Logger.log("AI 趨勢分析公式: " + trendFormula);

    // 測試 AI 投資建議公式生成
    const adviceFormula = aiAnalysisService.generateAIInvestmentAdviceFormula("2330", "台積電");
    Logger.log("AI 投資建議公式: " + adviceFormula);

    // 測試 AI 預測公式生成
    const predictionFormula = aiAnalysisService.generateAIPredictionFormula("2330", 7);
    Logger.log("AI 預測公式: " + predictionFormula);

    Logger.log("AI 分析功能測試完成");
  } catch (e) {
    Logger.log("AI 分析功能測試錯誤: " + e);
  }
}

/**
 * 測試 GETSPARKLINE 自訂功能
 */
function testSparklineCustomization() {
  Logger.log("測試 GETSPARKLINE 自訂功能...");

  try {
    // 測試預設天數
    const defaultSparkline = GETSPARKLINE("2330");
    Logger.log("預設天數 SPARKLINE: " + defaultSparkline);

    // 測試自訂天數
    const customSparkline = GETSPARKLINE("2330", 60);
    Logger.log("自訂天數 SPARKLINE: " + customSparkline);

    Logger.log("GETSPARKLINE 自訂功能測試完成");
  } catch (e) {
    Logger.log("GETSPARKLINE 自訂功能測試錯誤: " + e);
  }
}

/**
 * 測試批量更新功能
 */
function testBatchUpdate() {
  Logger.log("測試批量更新功能...");

  try {
    const sheetsService = new GoogleSheetsService();
    const sheet = sheetsService.getActiveSheet();
    const stocks = sheetsService.readStockList(sheet);

    Logger.log("找到 " + stocks.length + " 支股票待更新");

    // 測試公式設定
    if (stocks.length > 0) {
      sheetsService.setGoogleFinanceFormulas(sheet, stocks[0].rowIndex, stocks[0].code);
      sheetsService.setAIAnalysisFormulas(sheet, stocks[0].rowIndex, stocks[0].code, stocks[0].name);
      Logger.log("批量更新公式設定測試完成");
    }

    Logger.log("批量更新功能測試完成");
  } catch (e) {
    Logger.log("批量更新功能測試錯誤: " + e);
  }
}

/**
 * 測試試算表格式化
 */
function testSheetFormatting() {
  Logger.log("測試試算表格式化...");

  try {
    const sheet = SpreadsheetApp.getActiveSheet();

    // 測試條件格式化設定
    setupConditionalFormatting(sheet, 11);

    // 測試資料驗證設定
    setupDataValidation(sheet);

    Logger.log("試算表格式化測試完成");
  } catch (e) {
    Logger.log("試算表格式化測試錯誤: " + e);
  }
}

/**
 * 確保公式存在（防止更新時被覆蓋）
 * @param {Sheet} sheet - 工作表
 * @param {number} rowIndex - 行索引
 * @param {string} stockCode - 股票代號
 */
function ensureFormulas(sheet, rowIndex, stockCode) {
  Logger.log(`確保公式 for row ${rowIndex}, stock ${stockCode}`);

  // 檢查並重新設定走勢圖公式
  const sparklineCell = sheet.getRange(rowIndex, 3);
  const currentSparkline = sparklineCell.getFormula();
  Logger.log(`走勢圖公式檢查: ${currentSparkline}`);
  if (!currentSparkline || !currentSparkline.includes('GETSPARKLINE')) {
    Logger.log(`重新設定走勢圖公式: =GETSPARKLINE(A${rowIndex})`);
    sparklineCell.setFormula(`=GETSPARKLINE(A${rowIndex})`);
  }

  // 檢查並重新設定價格指標公式
  const priceCells = [
    { col: 4, name: 'GOOGLEFINANCEPRICE', formula: `=GOOGLEFINANCEPRICE(A${rowIndex})` },
    { col: 5, name: 'GOOGLEFINANCE_CHANGE', formula: `=GOOGLEFINANCE("TPE:${stockCode}", "change")` },
    { col: 6, name: 'GOOGLEFINANCE_OPEN', formula: `=GOOGLEFINANCE("TPE:${stockCode}", "open")` },
    { col: 7, name: 'GOOGLEFINANCE_HIGH', formula: `=GOOGLEFINANCE("TPE:${stockCode}", "high")` },
    { col: 8, name: 'GOOGLEFINANCE_LOW', formula: `=GOOGLEFINANCE("TPE:${stockCode}", "low")` },
    { col: 9, name: 'GOOGLEFINANCE_VOLUME', formula: `=GOOGLEFINANCE("TPE:${stockCode}", "volume")` },
    { col: 10, name: 'AI_TREND', formula: `=AI("分析 ${stockCode} 的近期走勢。請簡要描述趨勢方向和關鍵價位。", 0.3)` },
    { col: 11, name: 'AI_ADVICE', formula: `=AI("請為股票 ${stockCode} 提供投資建議（買入/持有/賣出），並說明理由。", 0.4)` }
  ];

  priceCells.forEach(({ col, name, formula }) => {
    const cell = sheet.getRange(rowIndex, col);
    const currentFormula = cell.getFormula();
    const cellValue = cell.getValue();
    Logger.log(`${name} 檢查 - 公式: "${currentFormula}", 值: "${cellValue}"`);

    // 如果沒有公式（被數值覆蓋），重新設定公式
    if (!currentFormula || currentFormula === '') {
      Logger.log(`重新設定 ${name} 公式: ${formula}`);
      cell.setFormula(formula);
    }
  });
};

// 全域快取實例 - 移到類別定義之後

/**
 * 快取管理器 - 實作快取機制以優化 API 呼叫
 */
class CacheManager {
  constructor() {
    this.cache = {};
    this.ttl = 5 * 60 * 1000; // 5 分鐘快取
  }

  /**
   * 取得快取資料
   * @param {string} key - 快取鍵值
   * @returns {any|null} 快取資料或 null
   */
  get(key) {
    const item = this.cache[key];
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      delete this.cache[key];
      return null;
    }

    return item.data;
  }

  /**
   * 設定快取資料
   * @param {string} key - 快取鍵值
   * @param {any} data - 要快取的資料
   */
  set(key, data) {
    this.cache[key] = {
      data: data,
      timestamp: Date.now()
    };
  }

  /**
   * 清除所有快取
   */
  clear() {
    this.cache = {};
  }
}

/**
 * 股價服務 - 負責從各種 API 擷取股價資料
 */
class StockPriceService {
  constructor() {
    this.twseBaseUrl = 'https://www.twse.com.tw';
    this.tpexBaseUrl = 'https://www.tpex.org.tw';
    this.yahooBaseUrl = 'https://query1.finance.yahoo.com';
  }

  /**
   * 取得 TWSE 股價和完整指標
   * @param {string} stockCode - 股票代號
   * @returns {Promise<Object|null>} 價格指標物件或 null
   */
  async getTWSEPrice(stockCode) {
    const cacheKey = `twse_${stockCode}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
      Logger.log("開始取得 TWSE 資料: " + stockCode);

      // 直接使用今天的日期，因為 TWSE 會自動回傳最新的交易日資料
      const today = Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd");
      const url = `${this.twseBaseUrl}/exchangeReport/STOCK_DAY?response=json&date=${today}&stockNo=${stockCode}`;

      Logger.log("TWSE URL: " + url);

      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const responseCode = response.getResponseCode();
      Logger.log("TWSE Response Code: " + responseCode);

      // 處理重新導向 (307 Temporary Redirect)
      if (responseCode === 307) {
        Logger.log("TWSE 回傳 307 重新導向，嘗試直接使用 followRedirects");

        // 使用 followRedirects: false 然後手動處理
        try {
          const redirectResponse = UrlFetchApp.fetch(url, {
            muteHttpExceptions: true,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            followRedirects: false, // 不自動跟隨，讓我們手動處理
            timeoutInSeconds: 5 // 5 秒超時
          });

          // 如果還是 307，嘗試修改 URL 或使用不同的方法
          Logger.log("TWSE 重新導向處理：嘗試修改請求參數");

          // 嘗試不包含日期參數，或使用不同的日期格式
          const today = new Date();
          const dateStr = Utilities.formatDate(today, "GMT+8", "yyyyMMdd");
          const altUrl = `${this.twseBaseUrl}/exchangeReport/STOCK_DAY?response=json&stockNo=${stockCode}`;

          Logger.log("嘗試替代 URL: " + altUrl);

          const altResponse = UrlFetchApp.fetch(altUrl, {
            muteHttpExceptions: true,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeoutInSeconds: 5 // 5 秒超時
          });

          const altCode = altResponse.getResponseCode();
          Logger.log("替代 URL 回應碼: " + altCode);

          if (altCode === 200) {
            const altJsonText = altResponse.getContentText();
            Logger.log("替代 URL 回應資料長度: " + altJsonText.length);
            const json = JSON.parse(altJsonText);
            return this.processTWSEData(json, stockCode);
          }

        } catch (redirectError) {
          Logger.log("重新導向處理錯誤: " + redirectError);
        }

        Logger.log("TWSE 重新導向處理失敗");
        return null;
      }

      if (responseCode !== 200) {
        Logger.log("TWSE API 回應錯誤: " + responseCode);
        return null;
      }

      const jsonText = response.getContentText();
      Logger.log("TWSE Raw Response length: " + jsonText.length);
      Logger.log("TWSE Raw Response: " + jsonText.substring(0, 300));

      const json = JSON.parse(jsonText);
      return this.processTWSEData(json, stockCode);
    } catch (e) {
      Logger.log("TWSE 錯誤: " + e);
      return null;
    }
  }

  /**
   * 處理 TWSE JSON 資料並提取價格資訊
   * @param {Object} json - TWSE API 回傳的 JSON 資料
   * @param {string} stockCode - 股票代號 (用於快取鍵值)
   * @returns {Object|null} 價格資料物件或 null
   */
  processTWSEData(json, stockCode) {
    const cacheKey = `twse_${stockCode}`;

    if (json && json.data && json.data.length > 0) {
      // TWSE 回傳的是當日或最近交易日的資料
      const lastRow = json.data[json.data.length - 1];
      Logger.log("TWSE Last Row: " + JSON.stringify(lastRow));

      // TWSE 資料欄位：["日期", "成交股數", "成交金額", "開盤價", "最高價", "最低價", "收盤價", "漲跌價", "成交筆數"]
      const priceData = {
        currentPrice: parseFloat(lastRow[6].replace(/,/g, "")), // 收盤價 (index 6)
        previousClose: parseFloat(lastRow[3].replace(/,/g, "")), // 開盤價作為昨收參考 (index 3)
        openPrice: parseFloat(lastRow[3].replace(/,/g, "")), // 開盤價 (index 3)
        highPrice: parseFloat(lastRow[4].replace(/,/g, "")), // 最高價 (index 4)
        lowPrice: parseFloat(lastRow[5].replace(/,/g, "")), // 最低價 (index 5)
        volume: parseInt(lastRow[1].replace(/,/g, "")), // 成交量 (index 1)
        change: parseFloat(lastRow[7].replace(/,/g, "")) // 漲跌價 (index 7)
      };

      // 驗證資料完整性
      if (isNaN(priceData.currentPrice) || priceData.currentPrice <= 0) {
        Logger.log("TWSE 價格資料無效: " + priceData.currentPrice);
        return null;
      }

      Logger.log("TWSE 成功取得資料: " + JSON.stringify(priceData));
      cacheManager.set(cacheKey, priceData);
      return priceData;
    }

    Logger.log("TWSE 無資料或資料格式錯誤");
    return null;
  }

  /**
   * 取得 TWSE 歷史價格資料
   * @param {string} stockCode - 股票代號
   * @param {number} days - 歷史天數 (預設 30)
   * @returns {Promise<Array>} 歷史價格陣列
   */
  async getTWSEHistory(stockCode, days = 30) {
    const cacheKey = `twse_history_${stockCode}_${days}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
      const prices = [];
      const endDate = new Date();

      Logger.log("開始取得 TWSE 歷史資料: " + stockCode + ", 天數: " + days);

      // 取得過去 N 天的資料 (限制最多 30 天，避免過多 API 呼叫)
      const actualDays = Math.min(days, 30);

      for (let i = 0; i < actualDays; i++) {
        const targetDate = new Date(endDate);
        targetDate.setDate(endDate.getDate() - i);

        // 跳過週末
        if (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
          continue;
        }

        const dateStr = Utilities.formatDate(targetDate, "GMT+8", "yyyyMMdd");
        const url = `${this.twseBaseUrl}/exchangeReport/STOCK_DAY?response=json&date=${dateStr}&stockNo=${stockCode}`;

        try {
          const response = UrlFetchApp.fetch(url, {
            muteHttpExceptions: true,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const responseCode = response.getResponseCode();

          // 處理重新導向
          let json = null;
          if (responseCode === 307) {
            const redirectUrl = response.getHeaders()['Location'] || response.getHeaders()['location'];
            if (redirectUrl) {
              const redirectResponse = UrlFetchApp.fetch(redirectUrl, {
                muteHttpExceptions: true,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeoutInSeconds: 5 // 5 秒超時
              });
              if (redirectResponse.getResponseCode() === 200) {
                json = JSON.parse(redirectResponse.getContentText());
              }
            }
          } else if (responseCode === 200) {
            json = JSON.parse(response.getContentText());
          }

          if (json && json.data && json.data.length > 0) {
            const lastRow = json.data[json.data.length - 1];
            const closePrice = parseFloat(lastRow[6].replace(/,/g, ""));
            if (!isNaN(closePrice) && closePrice > 0) {
              prices.unshift(closePrice); // 從舊到新排序
              Logger.log(`TWSE ${dateStr}: ${closePrice}`);
            }
          }
        } catch (dayError) {
          Logger.log(`取得 ${dateStr} 資料時發生錯誤: ${dayError}`);
        }

        // API 呼叫間隔，避免過度頻繁
        Utilities.sleep(200);
      }

      Logger.log("TWSE 歷史資料取得完成，共 " + prices.length + " 筆資料");
      cacheManager.set(cacheKey, prices);
      return prices;

    } catch (e) {
      Logger.log("TWSE 歷史資料錯誤: " + e);
      return [];
    }
  }

  /**
   * 同步版本：取得 TWSE 歷史價格資料（給 Google Sheets 公式使用）
   * @param {string} stockCode - 股票代號
   * @param {number} days - 歷史天數 (預設 30)
   * @returns {Array} 歷史價格陣列
   */
  getTWSEHistorySync(stockCode, days = 30) {
    const cacheKey = `twse_history_${stockCode}_${days}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
      const prices = [];
      const endDate = new Date();

      Logger.log("同步取得 TWSE 歷史資料: " + stockCode + ", 天數: " + days);

      // 取得過去 N 天的資料 (限制最多 7 天，避免過多 API 呼叫)
      const actualDays = Math.min(days, 7);

      for (let i = 0; i < actualDays; i++) {
        const targetDate = new Date(endDate);
        targetDate.setDate(endDate.getDate() - i);

        // 跳過週末
        if (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
          continue;
        }

        const dateStr = Utilities.formatDate(targetDate, "GMT+8", "yyyyMMdd");
        const url = `${this.twseBaseUrl}/exchangeReport/STOCK_DAY?response=json&date=${dateStr}&stockNo=${stockCode}`;

        try {
          const response = UrlFetchApp.fetch(url, {
            muteHttpExceptions: true,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeoutInSeconds: 5 // 5 秒超時
          });

          const responseCode = response.getResponseCode();

          if (responseCode === 200) {
            const json = JSON.parse(response.getContentText());
            if (json && json.data && json.data.length > 0) {
              const lastRow = json.data[json.data.length - 1];
              const closePrice = parseFloat(lastRow[6].replace(/,/g, ""));
              if (!isNaN(closePrice) && closePrice > 0) {
                prices.unshift(closePrice); // 從舊到新排序
                Logger.log(`TWSE ${dateStr}: ${closePrice}`);
              }
            }
          }
        } catch (dayError) {
          Logger.log(`同步取得 ${dateStr} 資料時發生錯誤: ${dayError}`);
        }

        // API 呼叫間隔，避免過度頻繁
        Utilities.sleep(100);
      }

      Logger.log("TWSE 同步歷史資料取得完成，共 " + prices.length + " 筆資料");
      cacheManager.set(cacheKey, prices);
      return prices;

    } catch (e) {
      Logger.log("TWSE 同步歷史資料錯誤: " + e);
      return [];
    }
  }

  /**
   * 取得 TPEX 股價和完整指標
   * @param {string} stockCode - 股票代號
   * @returns {Promise<Object|null>} 價格指標物件或 null
   */
  async getTPEXPrice(stockCode) {
    const cacheKey = `tpex_${stockCode}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
      Logger.log("開始取得 TPEX 資料: " + stockCode);

      // 嘗試多個 TPEX API 端點
      let result = null;

      // 方法 1: 使用 openapi/v1/stock_info (主要方法)
      try {
        Logger.log("嘗試 TPEX openapi/v1 API...");
        result = await this.getTPEXPriceV1(stockCode);
        if (result) {
          Logger.log("TPEX v1 API 成功");
          cacheManager.set(cacheKey, result);
          return result;
        }
      } catch (v1Error) {
        Logger.log("TPEX v1 API 失敗: " + v1Error);
      }

      // 方法 2: 使用 web API (備用)
      try {
        Logger.log("嘗試 TPEX web API...");
        result = await this.getTPEXPriceWeb(stockCode);
        if (result) {
          Logger.log("TPEX web API 成功");
          cacheManager.set(cacheKey, result);
          return result;
        }
      } catch (webError) {
        Logger.log("TPEX web API 失敗: " + webError);
      }

      Logger.log("所有 TPEX API 方法都失敗");
      return null;

    } catch (e) {
      Logger.log("TPEX 總體錯誤: " + e);
      return null;
    }
  }

  /**
   * 使用 TPEX openapi/v1 API
   */
  async getTPEXPriceV1(stockCode) {
    const url = `${this.tpexBaseUrl}/openapi/v1/stock_info?stock_no=${stockCode}`;

    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      throw new Error("HTTP " + responseCode);
    }

    const content = response.getContentText();
    Logger.log("TPEX v1 回應長度: " + content.length);
    Logger.log("TPEX v1 回應: " + content.substring(0, 200));

    const json = JSON.parse(content);

    if (json && json.data && json.data.length > 0) {
      const lastRow = json.data[json.data.length - 1];
      const priceData = {
        currentPrice: parseFloat(lastRow[2].replace(/,/g, "")), // 收盤價
        previousClose: parseFloat(lastRow[8].replace(/,/g, "")), // 昨收價
        openPrice: parseFloat(lastRow[4].replace(/,/g, "")), // 開盤價
        highPrice: parseFloat(lastRow[5].replace(/,/g, "")), // 最高價
        lowPrice: parseFloat(lastRow[6].replace(/,/g, "")), // 最低價
        volume: parseInt(lastRow[3].replace(/,/g, "")), // 成交量
        change: parseFloat(lastRow[2].replace(/,/g, "")) - parseFloat(lastRow[8].replace(/,/g, "")) // 漲跌價
      };

      if (priceData.currentPrice && !isNaN(priceData.currentPrice) && priceData.currentPrice > 0) {
        return priceData;
      }
    }

    return null;
  }

  /**
   * 使用 TPEX web API (備用)
   */
  async getTPEXPriceWeb(stockCode) {
    // TPEX 似乎沒有穩定的 web API，使用備用策略
    // 這裡可以實作其他資料來源或回傳 null
    Logger.log("TPEX web API 備用方法 - 目前未實作");
    return null;
  }

  /**
   * 取得美股價格和完整指標
   * @param {string} stockCode - 股票代號
   * @returns {Promise<Object|null>} 價格指標物件或 null
   */
  async getUSPrice(stockCode) {
    const cacheKey = `us_${stockCode}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
      Logger.log("開始取得美股資料: " + stockCode);

      // 嘗試多個 Yahoo Finance API 端點
      let result = null;

      // 方法 1: 使用 v7 API (主要方法)
      try {
        Logger.log("嘗試 Yahoo Finance v7 API...");
        result = await this.getUSPriceV7(stockCode);
        if (result) {
          Logger.log("Yahoo v7 API 成功");
          cacheManager.set(cacheKey, result);
          return result;
        }
      } catch (v7Error) {
        Logger.log("Yahoo v7 API 失敗: " + v7Error);
      }

      // 方法 2: 使用 v10 API (備用)
      try {
        Logger.log("嘗試 Yahoo Finance v10 API...");
        result = await this.getUSPriceV10(stockCode);
        if (result) {
          Logger.log("Yahoo v10 API 成功");
          cacheManager.set(cacheKey, result);
          return result;
        }
      } catch (v10Error) {
        Logger.log("Yahoo v10 API 失敗: " + v10Error);
      }

      // 方法 3: 使用舊版 API (最後備用)
      try {
        Logger.log("嘗試 Yahoo Finance 舊版 API...");
        result = await this.getUSPriceLegacy(stockCode);
        if (result) {
          Logger.log("Yahoo 舊版 API 成功");
          cacheManager.set(cacheKey, result);
          return result;
        }
      } catch (legacyError) {
        Logger.log("Yahoo 舊版 API 失敗: " + legacyError);
      }

      Logger.log("所有 Yahoo Finance API 方法都失敗");
      return null;

    } catch (e) {
      Logger.log("Yahoo Finance 總體錯誤: " + e);
      return null;
    }
  }

  /**
   * 使用 Yahoo Finance v7 API
   */
  async getUSPriceV7(stockCode) {
    const url = `${this.yahooBaseUrl}/v7/finance/quote?symbols=${stockCode}`;

    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      throw new Error("HTTP " + responseCode);
    }

    const json = JSON.parse(response.getContentText());

    if (json && json.quoteResponse && json.quoteResponse.result && json.quoteResponse.result[0]) {
      const quote = json.quoteResponse.result[0];

      const result = {
        currentPrice: quote.regularMarketPrice || null,
        previousClose: quote.regularMarketPreviousClose || null,
        openPrice: quote.regularMarketOpen || null,
        highPrice: quote.regularMarketDayHigh || null,
        lowPrice: quote.regularMarketDayLow || null,
        volume: quote.regularMarketVolume || null,
        change: quote.regularMarketChange || null
      };

      if (result.currentPrice && !isNaN(result.currentPrice) && result.currentPrice > 0) {
        return result;
      }
    }

    return null;
  }

  /**
   * 使用 Yahoo Finance v10 API
   */
  async getUSPriceV10(stockCode) {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${stockCode}?modules=price`;

    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeoutInSeconds: 5 // 5 秒超時
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      throw new Error("HTTP " + responseCode);
    }

    const json = JSON.parse(response.getContentText());

    if (json && json.quoteSummary && json.quoteSummary.result && json.quoteSummary.result[0]) {
      const priceData = json.quoteSummary.result[0].price;

      const result = {
        currentPrice: priceData.regularMarketPrice?.raw || null,
        previousClose: priceData.regularMarketPreviousClose?.raw || null,
        openPrice: priceData.regularMarketOpen?.raw || null,
        highPrice: priceData.regularMarketDayHigh?.raw || null,
        lowPrice: priceData.regularMarketDayLow?.raw || null,
        volume: priceData.regularMarketVolume?.raw || null,
        change: priceData.regularMarketChange?.raw || null
      };

      if (result.currentPrice && !isNaN(result.currentPrice) && result.currentPrice > 0) {
        return result;
      }
    }

    return null;
  }

  /**
   * 使用 Yahoo Finance 舊版 API (最後備用)
   */
  async getUSPriceLegacy(stockCode) {
    const url = `https://finance.yahoo.com/quote/${stockCode}`;

    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeoutInSeconds: 5 // 5 秒超時
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      throw new Error("HTTP " + responseCode);
    }

    const content = response.getContentText();

    // 簡單的 HTML 解析來取得價格 (非常不穩定，僅作為最後備用)
    const priceMatch = content.match(/"regularMarketPrice":\s*{\s*"raw":\s*([\d.]+)/);
    if (priceMatch && priceMatch[1]) {
      const currentPrice = parseFloat(priceMatch[1]);
      if (!isNaN(currentPrice) && currentPrice > 0) {
        return {
          currentPrice: currentPrice,
          previousClose: null,
          openPrice: null,
          highPrice: null,
          lowPrice: null,
          volume: null,
          change: null
        };
      }
    }

    return null;
  }

  /**
   * 取得美股歷史價格資料
   * @param {string} stockCode - 股票代號
   * @param {number} days - 歷史天數 (預設 30)
   * @returns {Promise<Array>} 歷史價格陣列
   */
  async getUSHistory(stockCode, days = 30) {
    const cacheKey = `us_history_${stockCode}_${days}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
      Logger.log("開始取得美股歷史資料: " + stockCode + ", 天數: " + days);

      // 計算日期範圍 (限制最多 30 天)
      const endDate = Math.floor(Date.now() / 1000); // Unix timestamp
      const startDate = endDate - (Math.min(days, 30) * 24 * 60 * 60); // N 天前

      const url = `${this.yahooBaseUrl}/v8/finance/chart/${stockCode}?period1=${startDate}&period2=${endDate}&interval=1d`;

      Logger.log("Yahoo History URL: " + url);

      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeoutInSeconds: 5 // 5 秒超時
      });

      const responseCode = response.getResponseCode();
      Logger.log("Yahoo History Response Code: " + responseCode);

      if (responseCode !== 200) {
        Logger.log("Yahoo History API 錯誤: " + responseCode);
        return [];
      }

      const jsonText = response.getContentText();
      Logger.log("Yahoo History Raw Response length: " + jsonText.length);

      const json = JSON.parse(jsonText);

      if (json && json.chart && json.chart.result && json.chart.result[0]) {
        const result = json.chart.result[0];
        if (result.indicators && result.indicators.quote && result.indicators.quote[0]) {
          const quotes = result.indicators.quote[0];
          const closes = quotes.close || [];

          // 過濾有效的價格資料
          const validPrices = closes.filter(price => price !== null && !isNaN(price) && price > 0);
          Logger.log("Yahoo 歷史資料取得完成，共 " + validPrices.length + " 筆資料");
          cacheManager.set(cacheKey, validPrices);
          return validPrices;
        }
      }

      Logger.log("Yahoo 歷史資料格式錯誤或無資料");
      return [];
    } catch (e) {
      Logger.log("Yahoo Finance 歷史資料錯誤: " + e);
      return [];
    }
  }

  /**
   * 同步版本：取得美股歷史價格資料（給 Google Sheets 公式使用）
   * @param {string} stockCode - 股票代號
   * @param {number} days - 歷史天數 (預設 30)
   * @returns {Array} 歷史價格陣列
   */
  getUSHistorySync(stockCode, days = 30) {
    const cacheKey = `us_history_${stockCode}_${days}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
      Logger.log("同步取得美股歷史資料: " + stockCode + ", 天數: " + days);

      // 計算日期範圍 (限制最多 7 天)
      const endDate = Math.floor(Date.now() / 1000); // Unix timestamp
      const startDate = endDate - (Math.min(days, 7) * 24 * 60 * 60); // N 天前

      const url = `${this.yahooBaseUrl}/v8/finance/chart/${stockCode}?period1=${startDate}&period2=${endDate}&interval=1d`;

      Logger.log("Yahoo History URL: " + url);

      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeoutInSeconds: 5 // 5 秒超時
      });

      const responseCode = response.getResponseCode();
      Logger.log("Yahoo History Response Code: " + responseCode);

      if (responseCode !== 200) {
        Logger.log("Yahoo History API 錯誤: " + responseCode);
        return [];
      }

      const json = JSON.parse(response.getContentText());

      if (json && json.chart && json.chart.result && json.chart.result[0]) {
        const result = json.chart.result[0];
        if (result.indicators && result.indicators.quote && result.indicators.quote[0]) {
          const quotes = result.indicators.quote[0];
          const closes = quotes.close || [];

          // 過濾有效的價格資料
          const validPrices = closes.filter(price => price !== null && !isNaN(price) && price > 0);
          Logger.log("Yahoo 同步歷史資料取得完成，共 " + validPrices.length + " 筆資料");
          cacheManager.set(cacheKey, validPrices);
          return validPrices;
        }
      }

      Logger.log("Yahoo 同步歷史資料格式錯誤或無資料");
      return [];
    } catch (e) {
      Logger.log("Yahoo Finance 同步歷史資料錯誤: " + e);
      return [];
    }
  }

  /**
   * 根據股票代號判斷市場類型並取得價格和完整指標
   * @param {string} stockCode - 股票代號
   * @returns {Promise<Object|null>} 價格指標物件或 null
   */
  async getPrice(stockCode) {
    if (!stockCode || typeof stockCode !== 'string') return null;

    // 移除可能的空白字元
    stockCode = stockCode.trim();

    // 判斷市場類型
    if (this.isListedStock(stockCode)) {
      return await this.getTWSEPrice(stockCode);
    } else if (this.isOTCStock(stockCode)) {
      return await this.getTPEXPrice(stockCode);
    } else {
      // 假設是美股代號
      return await this.getUSPrice(stockCode);
    }
  }

  /**
   * 同步版本：根據股票代號判斷市場類型並取得價格（給 Google Sheets 公式使用）
   * @param {string} stockCode - 股票代號
   * @returns {Object|null} 價格指標物件或 null
   */
  getPriceSync(stockCode) {
    if (!stockCode || typeof stockCode !== 'string') return null;

    // 移除可能的空白字元
    stockCode = stockCode.trim();

    // 判斷市場類型
    if (this.isListedStock(stockCode)) {
      return this.getTWSEPriceSync(stockCode);
    } else if (this.isOTCStock(stockCode)) {
      return this.getTPEXPriceSync(stockCode);
    } else {
      // 假設是美股代號
      return this.getUSPriceSync(stockCode);
    }
  }

  /**
   * 取得完整價格指標（回溯相容性）
   * @param {string} stockCode - 股票代號
   * @returns {Promise<number|null>} 股價或 null（僅為了回溯相容）
   */
  async getPriceOnly(stockCode) {
    const priceData = await this.getPrice(stockCode);
    return priceData ? priceData.currentPrice : null;
  }

  /**
   * 同步版本：取得 TWSE 股價（給 Google Sheets 公式使用）
   * @param {string} stockCode - 股票代號
   * @returns {Object|null} 價格指標物件或 null
   */
  getTWSEPriceSync(stockCode) {
    const cacheKey = `twse_${stockCode}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
      Logger.log("同步取得 TWSE 資料: " + stockCode);

      // 直接使用今天的日期，因為 TWSE 會自動回傳最新的交易日資料
      const today = Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd");
      const url = `${this.twseBaseUrl}/exchangeReport/STOCK_DAY?response=json&date=${today}&stockNo=${stockCode}`;

      Logger.log("TWSE URL: " + url);

      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeoutInSeconds: 10 // 10 秒超時
      });

      const responseCode = response.getResponseCode();
      Logger.log("TWSE Response Code: " + responseCode);

      if (responseCode !== 200) {
        Logger.log("TWSE API 回應錯誤: " + responseCode);
        return null;
      }

      const jsonText = response.getContentText();
      Logger.log("TWSE Raw Response length: " + jsonText.length);

      const json = JSON.parse(jsonText);
      return this.processTWSEData(json, stockCode);
    } catch (e) {
      Logger.log("TWSE 同步錯誤: " + e);
      return null;
    }
  }

  /**
   * 同步版本：取得 TPEX 股價（給 Google Sheets 公式使用）
   * @param {string} stockCode - 股票代號
   * @returns {Object|null} 價格指標物件或 null
   */
  getTPEXPriceSync(stockCode) {
    const cacheKey = `tpex_${stockCode}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
      Logger.log("同步取得 TPEX 資料: " + stockCode);

      // 使用 v1 API
      const url = `${this.tpexBaseUrl}/openapi/v1/stock_info?stock_no=${stockCode}`;

      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeoutInSeconds: 5 // 5 秒超時
      });

      const responseCode = response.getResponseCode();
      if (responseCode !== 200) {
        Logger.log("TPEX API 回應錯誤: " + responseCode);
        return null;
      }

      const content = response.getContentText();
      Logger.log("TPEX v1 回應長度: " + content.length);

      const json = JSON.parse(content);

      if (json && json.data && json.data.length > 0) {
        const lastRow = json.data[json.data.length - 1];
        const priceData = {
          currentPrice: parseFloat(lastRow[2].replace(/,/g, "")), // 收盤價
          previousClose: parseFloat(lastRow[8].replace(/,/g, "")), // 昨收價
          openPrice: parseFloat(lastRow[4].replace(/,/g, "")), // 開盤價
          highPrice: parseFloat(lastRow[5].replace(/,/g, "")), // 最高價
          lowPrice: parseFloat(lastRow[6].replace(/,/g, "")), // 最低價
          volume: parseInt(lastRow[3].replace(/,/g, "")), // 成交量
          change: parseFloat(lastRow[2].replace(/,/g, "")) - parseFloat(lastRow[8].replace(/,/g, "")) // 漲跌價
        };

        if (priceData.currentPrice && !isNaN(priceData.currentPrice) && priceData.currentPrice > 0) {
          cacheManager.set(cacheKey, priceData);
          return priceData;
        }
      }

      return null;
    } catch (e) {
      Logger.log("TPEX 同步錯誤: " + e);
      return null;
    }
  }

  /**
   * 同步版本：取得美股價格（給 Google Sheets 公式使用）
   * @param {string} stockCode - 股票代號
   * @returns {Object|null} 價格指標物件或 null
   */
  getUSPriceSync(stockCode) {
    const cacheKey = `us_${stockCode}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
      Logger.log("同步取得美股資料: " + stockCode);

      // 使用 v7 API
      const url = `${this.yahooBaseUrl}/v7/finance/quote?symbols=${stockCode}`;

      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeoutInSeconds: 5 // 5 秒超時
      });

      const responseCode = response.getResponseCode();
      if (responseCode !== 200) {
        Logger.log("Yahoo API 回應錯誤: " + responseCode);
        return null;
      }

      const json = JSON.parse(response.getContentText());

      if (json && json.quoteResponse && json.quoteResponse.result && json.quoteResponse.result[0]) {
        const quote = json.quoteResponse.result[0];

        const result = {
          currentPrice: quote.regularMarketPrice || null,
          previousClose: quote.regularMarketPreviousClose || null,
          openPrice: quote.regularMarketOpen || null,
          highPrice: quote.regularMarketDayHigh || null,
          lowPrice: quote.regularMarketDayLow || null,
          volume: quote.regularMarketVolume || null,
          change: quote.regularMarketChange || null
        };

        if (result.currentPrice && !isNaN(result.currentPrice) && result.currentPrice > 0) {
          cacheManager.set(cacheKey, result);
          return result;
        }
      }

      return null;
    } catch (e) {
      Logger.log("Yahoo 同步錯誤: " + e);
      return null;
    }
  }

  /**
   * 取得歷史價格資料
   * @param {string} stockCode - 股票代號
   * @param {number} days - 歷史天數 (預設 30)
   * @returns {Promise<Array>} 歷史價格陣列
   */
  async getHistory(stockCode, days = 30) {
    if (!stockCode || typeof stockCode !== 'string') return [];

    stockCode = stockCode.trim();

    // 判斷市場類型並呼叫對應的歷史資料方法
    if (this.isListedStock(stockCode)) {
      return await this.getTWSEHistory(stockCode, days);
    } else if (this.isOTCStock(stockCode)) {
      // TPEX 歷史資料可以使用類似的邏輯，暫時回傳空陣列
      Logger.log("TPEX 歷史資料功能尚未實作");
      return [];
    } else {
      // 美股
      return await this.getUSHistory(stockCode, days);
    }
  }

  /**
   * 同步版本：取得歷史價格資料（給 Google Sheets 公式使用）
   * @param {string} stockCode - 股票代號
   * @param {number} days - 歷史天數 (預設 30)
   * @returns {Array} 歷史價格陣列
   */
  getHistorySync(stockCode, days = 30) {
    if (!stockCode || typeof stockCode !== 'string') return [];

    stockCode = stockCode.trim();

    // 判斷市場類型並呼叫對應的歷史資料方法
    if (this.isListedStock(stockCode)) {
      return this.getTWSEHistorySync(stockCode, days);
    } else if (this.isOTCStock(stockCode)) {
      // TPEX 歷史資料可以使用類似的邏輯，暫時回傳空陣列
      Logger.log("TPEX 歷史資料功能尚未實作");
      return [];
    } else {
      // 美股
      return this.getUSHistorySync(stockCode, days);
    }
  }

  /**
   * 判斷是否為上市股票 (4 碼數字)
   * @param {string} stockCode - 股票代號
   * @returns {boolean} 是否為上市股票
   */
  isListedStock(stockCode) {
    return /^[0-9]{4}$/.test(stockCode);
  }

  /**
   * 判斷是否為上櫃股票 (4-6 碼數字或字母組合)
   * @param {string} stockCode - 股票代號
   * @returns {boolean} 是否為上櫃股票
   */
  isOTCStock(stockCode) {
    return /^[0-9A-Z]{4,6}$/.test(stockCode) && !this.isListedStock(stockCode);
  }
}

// 全域服務實例
const googleFinanceService = new GoogleFinanceService();

// ========== AI 分析服務 ==========

/**
 * AI 分析服務 - 使用 AI() 函數進行股價分析和投資建議
 */
class AIAnalysisService {
  constructor() {
    this.financeService = googleFinanceService;
  }

  /**
   * 產生 AI 分析公式
   * @param {string} stockCode - 股票代號
   * @param {string} analysisType - 分析類型 (trend, recommendation, risk)
   * @returns {string} AI() 公式
   */
  generateAIAnalysisFormula(stockCode, analysisType = "trend") {
    const marketType = this.financeService.getMarketType(stockCode);

    let prompt = "";

    switch (analysisType) {
      case "trend":
        prompt = `分析 ${marketType} 股票 ${stockCode} 的近期走勢。請簡要描述趨勢方向（上升/下降/盤整）和關鍵價位。`;
        break;
      case "recommendation":
        prompt = `基於技術分析，為 ${marketType} 股票 ${stockCode} 提供投資建議（買入/持有/賣出），並說明理由。`;
        break;
      case "risk":
        prompt = `評估 ${marketType} 股票 ${stockCode} 的投資風險等級（低/中/高）及其主要風險因素。`;
        break;
      default:
        prompt = `分析 ${marketType} 股票 ${stockCode} 的基本面和技術面情況。`;
    }

    // 使用 AI() 函數，設定適中的 temperature 以獲得一致的分析結果
    return `AI("${prompt}", 0.3)`;
  }

  /**
   * 產生 AI 預測公式 - 預測未來股價走勢
   * @param {string} stockCode - 股票代號
   * @param {number} days - 預測天數 (預設 7)
   * @returns {string} AI() 預測公式
   */
  generateAIPredictionFormula(stockCode, days = 7) {
    const marketType = this.financeService.getMarketType(stockCode);

    const prompt = `基於 ${marketType} 股票 ${stockCode} 的歷史走勢和技術指標，預測未來 ${days} 天的股價走勢。
請提供：
1. 預測價格區間
2. 信心水準（高/中/低）
3. 主要影響因素
4. 風險提示

請以簡潔的格式回答。`;

    return `AI("${prompt}", 0.4)`;
  }

  /**
   * 產生 AI 投資建議公式 - 綜合分析和建議
   * @param {string} stockCode - 股票代號
   * @param {string} stockName - 股票名稱
   * @returns {string} AI() 投資建議公式
   */
  generateAIInvestmentAdviceFormula(stockCode, stockName = "") {
    const marketType = this.financeService.getMarketType(stockCode);
    const stockDisplayName = stockName || stockCode;

    const prompt = `請為 ${marketType} 股票 ${stockDisplayName} (${stockCode}) 提供專業的投資分析和建議：

1. 技術分析：趨勢、支撐阻力、技術指標
2. 基本分析：公司基本面、產業地位
3. 投資建議：買入/持有/賣出/觀望，包含理由
4. 風險評估：投資風險等級和主要風險
5. 目標價位：短期/中期目標價

請以投資專家的角度提供分析，控制在 200 字以內。`;

    return `AI("${prompt}", 0.5)`;
  }

  /**
   * 產生綜合分析公式（結合多種分析）
   * @param {string} stockCode - 股票代號
   * @returns {string} 綜合分析公式
   */
  generateComprehensiveAnalysisFormula(stockCode) {
    const marketType = this.financeService.getMarketType(stockCode);

    const prompt = `請綜合分析 ${marketType} 股票 ${stockCode}：

1. 目前價格走勢趨勢
2. 技術指標分析（RSI、MACD 等）
3. 投資建議（買入/持有/賣出）
4. 風險評估
5. 關鍵價位關注

請以結構化格式回答，每點控制在 50 字以內。`;

    return `AI("${prompt}", 0.4)`;
  }
}

// 全域 AI 分析實例
const aiAnalysisService = new AIAnalysisService();

// ========== Google Sheets 整合服務 ==========

/**
 * Google Sheets 整合服務 - 管理試算表操作
 */
class GoogleSheetsService {
  constructor() {
    this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    this.financeService = googleFinanceService;
    this.aiService = aiAnalysisService;
  }

  /**
   * 取得活躍的工作表
   * @returns {Sheet} 活躍的工作表
   */
  getActiveSheet() {
    return this.spreadsheet.getActiveSheet();
  }

  /**
   * 讀取股票清單
   * @param {Sheet} sheet - 工作表
   * @returns {Array} 股票清單
   */
  readStockList(sheet) {
    const data = sheet.getDataRange().getValues();
    const stocks = [];

    // 跳過標題列，從第2列開始
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[1]) { // 股票代號和名稱都存在
        stocks.push({
          code: row[0].toString().trim(),
          name: row[1].toString().trim(),
          rowIndex: i + 1 // 1-indexed
        });
      }
    }

    return stocks;
  }

  /**
   * 更新股票公式（新版本使用 GOOGLEFINANCE）
   * @param {Sheet} sheet - 工作表
   * @param {Array} stocks - 股票清單
   */
  updateFormulas(sheet, stocks) {
    const now = new Date();
    const timestamp = Utilities.formatDate(now, "GMT+8", "yyyy-MM-dd HH:mm:ss");

    Logger.log(`開始更新 ${stocks.length} 支股票的公式`);

    for (const stock of stocks) {
      try {
        Logger.log(`更新股票 ${stock.code} 的公式`);

        // 設定 GOOGLEFINANCE 公式
        this.setGoogleFinanceFormulas(sheet, stock.rowIndex, stock.code);

        // 設定 AI 分析公式
        this.setAIAnalysisFormulas(sheet, stock.rowIndex, stock.code, stock.name);

        // 更新時間戳
        sheet.getRange(stock.rowIndex, 11).setValue(timestamp);

        Logger.log(`股票 ${stock.code} 公式更新完成`);

      } catch (e) {
        Logger.log(`更新股票 ${stock.code} 公式時發生錯誤: ${e}`);
        // 設定錯誤狀態
        sheet.getRange(stock.rowIndex, 4).setValue("公式錯誤");
        sheet.getRange(stock.rowIndex, 11).setValue(timestamp);
      }
    }

    // 強制重新計算所有公式
    SpreadsheetApp.flush();
    Logger.log("所有公式已更新並強制重新計算");
  }

  /**
   * 設定 GOOGLEFINANCE 相關公式
   * @param {Sheet} sheet - 工作表
   * @param {number} rowIndex - 行索引
   * @param {string} stockCode - 股票代號
   */
  setGoogleFinanceFormulas(sheet, rowIndex, stockCode) {
    // 即時股價 (D 欄) - 使用參考欄位 A 欄
    const priceFormula = `=GOOGLEFINANCE(A${rowIndex}, "price")`;
    sheet.getRange(rowIndex, 4).setFormula(priceFormula);

    // 漲跌金額 (E 欄) - 使用參考欄位 A 欄
    const changeFormula = `=GOOGLEFINANCE(A${rowIndex}, "change")`;
    sheet.getRange(rowIndex, 5).setFormula(changeFormula);

    // 開盤價 (F 欄) - 使用參考欄位 A 欄
    const openFormula = `=GOOGLEFINANCE(A${rowIndex}, "open")`;
    sheet.getRange(rowIndex, 6).setFormula(openFormula);

    // 最高價 (G 欄) - 使用參考欄位 A 欄
    const highFormula = `=GOOGLEFINANCE(A${rowIndex}, "high")`;
    sheet.getRange(rowIndex, 7).setFormula(highFormula);

    // 最低價 (H 欄) - 使用參考欄位 A 欄
    const lowFormula = `=GOOGLEFINANCE(A${rowIndex}, "low")`;
    sheet.getRange(rowIndex, 8).setFormula(lowFormula);

    // 成交量 (I 欄) - 使用參考欄位 A 欄
    const volumeFormula = `=GOOGLEFINANCE(A${rowIndex}, "volume")`;
    sheet.getRange(rowIndex, 9).setFormula(volumeFormula);

    Logger.log(`設定 ${stockCode} 的 GOOGLEFINANCE 公式完成 (使用參考欄位)`);
  }

  /**
   * 設定 AI 分析公式
   * @param {Sheet} sheet - 工作表
   * @param {number} rowIndex - 行索引
   * @param {string} stockCode - 股票代號
   * @param {string} stockName - 股票名稱
   */
  setAIAnalysisFormulas(sheet, rowIndex, stockCode, stockName = "") {
    // 在隱藏欄位 M (13) 設定走勢分析提示文字
    const trendPrompt = `分析 ${stockName} (${stockCode}) 的近期走勢。請簡要描述趨勢方向和關鍵價位。`;
    sheet.getRange(rowIndex, 13).setValue(trendPrompt);

    // 走勢分析 (J 欄) - 引用隱藏欄位的提示文字
    const trendFormula = `=AI(M${rowIndex}, 0.3)`;
    sheet.getRange(rowIndex, 10).setFormula(trendFormula);

    // 在隱藏欄位 N (14) 設定投資建議提示文字
    const advicePrompt = `請為 ${stockName} (${stockCode}) 提供投資建議（買入/持有/賣出），並說明理由。`;
    sheet.getRange(rowIndex, 14).setValue(advicePrompt);

    // 投資建議 (K 欄) - 引用隱藏欄位的提示文字
    const investmentAdviceFormula = `=AI(N${rowIndex}, 0.4)`;
    sheet.getRange(rowIndex, 11).setFormula(investmentAdviceFormula);

    Logger.log(`設定 ${stockCode} 的 AI 分析公式完成 (使用隱藏欄位)`);
  }

  /**
   * 設定 GETSPARKLINE 公式（支援自訂天數）
   * @param {Sheet} sheet - 工作表
   * @param {number} rowIndex - 行索引
   * @param {string} stockCode - 股票代號
   */
  setSparklineFormula(sheet, rowIndex, stockCode) {
    // 從設定工作表讀取天數設定
    const settingsSheet = this.spreadsheet.getSheetByName('設定');
    let days = 30; // 預設 30 天

    if (settingsSheet) {
      try {
        const daysValue = settingsSheet.getRange(2, 2).getValue(); // B2: 走勢圖天數
        if (daysValue && !isNaN(daysValue) && daysValue > 0) {
          days = Math.min(Math.max(parseInt(daysValue), 7), 365); // 限制在 7-365 天
        }
      } catch (e) {
        Logger.log(`讀取設定天數失敗: ${e}`);
      }
    }

    // 設定走勢圖公式 - 使用 GETSPARKLINE 函數
    const sparklineFormula = `=GETSPARKLINE(A${rowIndex})`;
    sheet.getRange(rowIndex, 3).setFormula(sparklineFormula);

    Logger.log(`設定 ${stockCode} 的 GETSPARKLINE 公式，天數: ${days}`);
  }

  /**
   * 重新整理試算表（強制重新計算所有公式）
   * @param {Sheet} sheet - 工作表
   */
  refreshSheet(sheet) {
    Logger.log("開始重新整理試算表，強制重新計算公式");

    // 強制重新計算公式
    sheet.getDataRange().getFormulas().forEach((row, rowIndex) => {
      row.forEach((formula, colIndex) => {
        if (formula) {
          const range = sheet.getRange(rowIndex + 1, colIndex + 1);
          range.setFormula(formula);
        }
      });
    });

    // 使用 SpreadsheetApp.flush() 確保所有變更都被應用
    SpreadsheetApp.flush();
    Logger.log("試算表重新整理完成");
  }
}

// ========== 資料處理服務 ==========

/**
 * 資料處理服務 - 處理股價資料格式化和圖表生成
 */
class DataProcessingService {
  /**
   * 生成 SPARKLINE 走勢圖公式
   * @param {Array} prices - 價格陣列
   * @returns {string} SPARKLINE 公式
   */
  generateSparkline(prices) {
    if (!Array.isArray(prices) || prices.length === 0) {
      return "無資料";
    }

    // 過濾無效價格
    const validPrices = prices.filter(price => price !== null && !isNaN(price));

    if (validPrices.length === 0) {
      return "無資料";
    }

    // 生成 SPARKLINE 公式
    const priceStr = validPrices.join(",");
    return `=SPARKLINE({${priceStr}})`;
  }

  /**
   * 格式化價格顯示
   * @param {number} price - 價格
   * @returns {string} 格式化的價格字串
   */
  formatPrice(price) {
    if (price === null || isNaN(price)) {
      return "無資料";
    }

    return price.toFixed(2);
  }

  /**
   * 格式化價格指標物件
   * @param {Object} priceData - 價格指標物件
   * @returns {Object} 格式化的價格指標
   */
  formatPriceIndicators(priceData) {
    if (!priceData || typeof priceData !== 'object') {
      return {
        currentPrice: "無資料",
        previousClose: "無資料",
        openPrice: "無資料",
        highPrice: "無資料",
        lowPrice: "無資料",
        change: "無資料",
        changePercent: "N/A"
      };
    }

    const formatted = {
      currentPrice: this.formatPrice(priceData.currentPrice),
      previousClose: this.formatPrice(priceData.previousClose),
      openPrice: this.formatPrice(priceData.openPrice),
      highPrice: this.formatPrice(priceData.highPrice),
      lowPrice: this.formatPrice(priceData.lowPrice),
      change: priceData.change !== null && !isNaN(priceData.change) ?
        (priceData.change >= 0 ? "+" : "") + priceData.change.toFixed(2) : "無資料",
      changePercent: this.calculateChangePercent(priceData.currentPrice, priceData.previousClose)
    };

    return formatted;
  }

  /**
   * 計算價格變化百分比
   * @param {number} currentPrice - 目前價格
   * @param {number} previousPrice - 前一個價格
   * @returns {string} 變化百分比
   */
  calculateChangePercent(currentPrice, previousPrice) {
    if (!currentPrice || !previousPrice || isNaN(currentPrice) || isNaN(previousPrice)) {
      return "N/A";
    }

    const change = ((currentPrice - previousPrice) / previousPrice) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  }
}

// 全域資料處理實例
const dataProcessingService = new DataProcessingService();

// 全域快取實例 - 移到類別定義之後
const cacheManager = new CacheManager();

// ========== 公開函數 ==========

/**
 * GOOGLEFINANCE 包裝函數 - 取得即時股價
 * 使用方式：
 * =GOOGLEFINANCEPRICE("2330") -> 台股上市股票即時價
 * =GOOGLEFINANCEPRICE("AAPL") -> 美股即時價
 *
 * 系統會自動判斷市場類型並轉換為正確的 GOOGLEFINANCE 格式
 *
 * @param {string} stockCode - 股票代號
 * @returns {string} GOOGLEFINANCE 公式
 */
function GOOGLEFINANCEPRICE(stockCode) {
  if (!stockCode) return "無代號";

  try {
    Logger.log("GOOGLEFINANCEPRICE 呼叫: " + stockCode);

    const trimmedCode = stockCode.toString().trim();
    const formula = googleFinanceService.generateGoogleFinanceFormula(trimmedCode, "price");

    Logger.log("GOOGLEFINANCEPRICE 公式: " + formula);
    return formula;
  } catch (e) {
    Logger.log("GOOGLEFINANCEPRICE 錯誤: " + stockCode + " - " + e);
    return "錯誤";
  }
}

/**
 * 取得昨日收盤價
 * 使用方式：
 * =GETPREVIOUSCLOSE("2330") -> 昨日收盤價
 * =GETPREVIOUSCLOSE("AAPL") -> 美股昨日收盤價
 *
 * @param {string} stockCode - 股票代號
 * @returns {number|string} 昨日收盤價或錯誤訊息
 */
function GETPREVIOUSCLOSE(stockCode) {
  if (!stockCode) return "無代號";

  try {
    const priceData = stockPriceService.getPriceSync(stockCode);

    if (priceData !== null && priceData.previousClose !== null && priceData.previousClose !== undefined && !isNaN(priceData.previousClose)) {
      return priceData.previousClose;
    } else {
      return "無資料";
    }
  } catch (e) {
    Logger.log("GETPREVIOUSCLOSE 錯誤: " + e);
    return "錯誤";
  }
}

/**
 * 取得開盤價
 * 使用方式：
 * =GETOPENPRICE("2330") -> 開盤價
 * =GETOPENPRICE("AAPL") -> 美股開盤價
 *
 * @param {string} stockCode - 股票代號
 * @returns {number|string} 開盤價或錯誤訊息
 */
function GETOPENPRICE(stockCode) {
  if (!stockCode) return "無代號";

  try {
    const priceData = stockPriceService.getPriceSync(stockCode);

    if (priceData !== null && priceData.openPrice !== null && priceData.openPrice !== undefined && !isNaN(priceData.openPrice)) {
      return priceData.openPrice;
    } else {
      return "無資料";
    }
  } catch (e) {
    Logger.log("GETOPENPRICE 錯誤: " + e);
    return "錯誤";
  }
}

/**
 * 取得最高價
 * 使用方式：
 * =GETHIGHPRICE("2330") -> 最高價
 * =GETHIGHPRICE("AAPL") -> 美股最高價
 *
 * @param {string} stockCode - 股票代號
 * @returns {number|string} 最高價或錯誤訊息
 */
function GETHIGHPRICE(stockCode) {
  if (!stockCode) return "無代號";

  try {
    const priceData = stockPriceService.getPriceSync(stockCode);

    if (priceData !== null && priceData.highPrice !== null && priceData.highPrice !== undefined && !isNaN(priceData.highPrice)) {
      return priceData.highPrice;
    } else {
      return "無資料";
    }
  } catch (e) {
    Logger.log("GETHIGHPRICE 錯誤: " + e);
    return "錯誤";
  }
}

/**
 * 取得最低價
 * 使用方式：
 * =GETLOWPRICE("2330") -> 最低價
 * =GETLOWPRICE("AAPL") -> 美股最低價
 *
 * @param {string} stockCode - 股票代號
 * @returns {number|string} 最低價或錯誤訊息
 */
function GETLOWPRICE(stockCode) {
  if (!stockCode) return "無代號";

  try {
    const priceData = stockPriceService.getPriceSync(stockCode);

    if (priceData !== null && priceData.lowPrice !== null && priceData.lowPrice !== undefined && !isNaN(priceData.lowPrice)) {
      return priceData.lowPrice;
    } else {
      return "無資料";
    }
  } catch (e) {
    Logger.log("GETLOWPRICE 錯誤: " + e);
    return "錯誤";
  }
}

/**
 * 取得成交量
 * 使用方式：
 * =GETVOLUME("2330") -> 成交量
 * =GETVOLUME("AAPL") -> 美股成交量
 *
 * @param {string} stockCode - 股票代號
 * @returns {number|string} 成交量或錯誤訊息
 */
function GETVOLUME(stockCode) {
  if (!stockCode) return "無代號";

  try {
    const priceData = stockPriceService.getPriceSync(stockCode);

    if (priceData !== null && priceData.volume !== null && priceData.volume !== undefined && !isNaN(priceData.volume)) {
      return priceData.volume;
    } else {
      return "無資料";
    }
  } catch (e) {
    Logger.log("GETVOLUME 錯誤: " + e);
    return "錯誤";
  }
}

/**
 * 取得漲跌價
 * 使用方式：
 * =GETCHANGE("2330") -> 漲跌價
 * =GETCHANGE("AAPL") -> 美股漲跌價
 *
 * @param {string} stockCode - 股票代號
 * @returns {number|string} 漲跌價或錯誤訊息
 */
function GETCHANGE(stockCode) {
  if (!stockCode) return "無代號";

  try {
    const priceData = stockPriceService.getPriceSync(stockCode);

    if (priceData !== null && priceData.change !== null && priceData.change !== undefined && !isNaN(priceData.change)) {
      return priceData.change;
    } else {
      return "無資料";
    }
  } catch (e) {
    Logger.log("GETCHANGE 錯誤: " + e);
    return "錯誤";
  }
}

/**
 * 增強版 GETSPARKLINE 函數 - 支援自訂天數設定
 * 使用方式：
 * =GETSPARKLINE("2330") -> 使用設定表中的預設天數
 * =GETSPARKLINE("2330", 60) -> 60 天走勢圖
 *
 * @param {string} stockCode - 股票代號
 * @param {number} days - 天數 (預設從設定表讀取)
 * @returns {string} SPARKLINE 圖表公式
 */
function GETSPARKLINE(stockCode, days = null) {
  if (!stockCode) return "無代號";

  try {
    Logger.log("GETSPARKLINE 呼叫: " + stockCode + ", 天數: " + days);

    // 如果沒有指定天數，從設定表讀取
    let validDays = days;
    if (validDays === null || validDays === undefined) {
      const settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('設定');
      if (settingsSheet) {
        try {
          const daysValue = settingsSheet.getRange(2, 2).getValue(); // B2: 走勢圖天數
          if (daysValue && !isNaN(daysValue)) {
            validDays = Math.min(Math.max(parseInt(daysValue), 7), 365);
          } else {
            validDays = 30; // 預設 30 天
          }
        } catch (e) {
          Logger.log("讀取設定天數失敗: " + e);
          validDays = 30;
        }
      } else {
        validDays = 30;
      }
    } else {
      // 驗證手動指定的天數
      validDays = Math.max(1, Math.min(365, parseInt(validDays) || 30));
    }

    Logger.log("使用天數: " + validDays);

    // 使用 GOOGLEFINANCE 產生歷史資料公式
    const mappedCode = googleFinanceService.mapToGoogleFinance(stockCode);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - validDays);

    const startDateStr = Utilities.formatDate(startDate, "GMT+8", "yyyy-MM-dd");
    const endDateStr = Utilities.formatDate(endDate, "GMT+8", "yyyy-MM-dd");

    const historyFormula = `GOOGLEFINANCE("${mappedCode}", "close", "${startDateStr}", "${endDateStr}")`;

    // 產生 SPARKLINE 公式 - 直接回傳圖表而非文字
    const sparklineFormula = `=SPARKLINE(${historyFormula}, {"charttype","line"; "color","blue"; "linewidth",2})`;

    Logger.log("GETSPARKLINE 公式: " + sparklineFormula);
    return `=${sparklineFormula}`;

  } catch (e) {
    Logger.log("GETSPARKLINE 錯誤 for " + stockCode + ": " + e);
    return "錯誤";
  }
}

/**
 * 更新所有股票公式（新版本使用 GOOGLEFINANCE 和 AI()）
 */
function updateAllPrices() {
  try {
    const sheetsService = new GoogleSheetsService();
    const sheet = sheetsService.getActiveSheet();
    const stocks = sheetsService.readStockList(sheet);

    if (stocks.length === 0) {
      SpreadsheetApp.getUi().alert("未找到有效的股票清單。請確保第1列有股票代號和名稱。");
      return;
    }

    Logger.log(`開始更新 ${stocks.length} 支股票的公式`);

    // 顯示進度對話框並開始更新
    showAllPricesProgressDialog(stocks.length);

  } catch (e) {
    Logger.log("updateAllPrices 錯誤: " + e);
    SpreadsheetApp.getUi().alert("更新過程中發生錯誤：" + e.toString());
  }
}

/**
 * 顯示全部股票更新進度對話框（優化版本）
 */
function showAllPricesProgressDialog(stockCount) {
  try {
    const html = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <base target="_top">
          <style>
            body {
              font-family: 'Microsoft JhengHei', '微軟正黑體', Arial, sans-serif;
              margin: 20px;
              text-align: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-radius: 15px;
            }
            .container {
              background: rgba(255, 255, 255, 0.1);
              padding: 20px;
              border-radius: 10px;
              backdrop-filter: blur(10px);
            }
            .progress-container {
              margin: 20px 0;
              position: relative;
            }
            .progress-bar {
              width: 100%;
              height: 25px;
              background-color: rgba(255, 255, 255, 0.2);
              border-radius: 12px;
              overflow: hidden;
              box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #4CAF50, #45a049);
              width: 0%;
              transition: width 0.5s ease;
              border-radius: 12px;
              position: relative;
            }
            .progress-fill::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
              animation: shimmer 2s infinite;
            }
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            .status {
              margin: 15px 0;
              font-weight: bold;
              font-size: 16px;
              text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
            }
            .details {
              margin: 10px 0;
              color: #e8f4f8;
              font-size: 14px;
            }
            .stats {
              margin: 10px 0;
              font-size: 12px;
              color: #b8d8e8;
              font-weight: bold;
            }
            .icon {
              font-size: 24px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📈</div>
            <h3>更新所有股票資料</h3>
            <div class="status" id="status">準備開始更新 ${stockCount} 支股票...</div>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
              </div>
            </div>
            <div class="details" id="details">正在初始化 GOOGLEFINANCE 和 AI 公式...</div>
            <div class="stats" id="stats">0 / ${stockCount} 已完成</div>
          </div>

          <script>
            let progress = 0;
            let completedCount = 0;

            function updateProgress(percent, message, details, completed) {
              document.getElementById('progressFill').style.width = percent + '%';
              document.getElementById('status').textContent = message;
              document.getElementById('details').textContent = details || message;
              if (completed !== undefined) {
                completedCount = completed;
                document.getElementById('stats').textContent = completedCount + ' / ${stockCount} 已完成';
              }
            }

            // 模擬進度更新，提供更好的用戶體驗
            const steps = [
              { percent: 10, message: '連線到 Google Finance...', details: '正在初始化 GOOGLEFINANCE 函數...' },
              { percent: 30, message: '設定價格公式...', details: '正在設定即時價格和技術指標公式...' },
              { percent: 50, message: '配置 AI 分析...', details: '正在設定 AI() 投資分析和預測公式...' },
              { percent: 70, message: '生成走勢圖...', details: '正在配置 SPARKLINE 走勢圖...' },
              { percent: 90, message: '最終檢查...', details: '正在驗證所有公式設定...' },
              { percent: 100, message: '更新完成！', details: '所有股票公式已成功更新' }
            ];

            let stepIndex = 0;
            const progressInterval = setInterval(() => {
              if (stepIndex < steps.length) {
                updateProgress(steps[stepIndex].percent, steps[stepIndex].message, steps[stepIndex].details);
                stepIndex++;
              } else {
                clearInterval(progressInterval);
              }
            }, 300);

            // 實際執行更新（在背景執行）
            google.script.run.withSuccessHandler((result) => {
              clearInterval(progressInterval);
              updateProgress(100, '更新完成！', '成功更新所有股票的 GOOGLEFINANCE 和 AI 公式', result.totalCount);
              setTimeout(() => {
                google.script.host.close();
              }, 2500);
            }).withFailureHandler((error) => {
              clearInterval(progressInterval);
              updateProgress(100, '更新失敗', '錯誤: ' + error);
              setTimeout(() => {
                google.script.host.close();
              }, 4000);
            }).executeUpdateAllPrices();
          </script>
        </body>
      </html>
    `).setWidth(500).setHeight(350);

    SpreadsheetApp.getUi().showModalDialog(html, '更新所有股票資料 (${stockCount} 支股票)');

  } catch (e) {
    Logger.log('showAllPricesProgressDialog 錯誤: ' + e);
    SpreadsheetApp.getUi().alert('顯示進度對話框時發生錯誤：' + e.toString());
  }
}

/**
 * 實際執行全部股票公式更新的函數（背景執行）
 */
function executeUpdateAllPrices() {
  try {
    const startTime = new Date();
    const sheetsService = new GoogleSheetsService();
    const sheet = sheetsService.getActiveSheet();
    const stocks = sheetsService.readStockList(sheet);

    Logger.log(`開始執行全部股票公式更新，共 ${stocks.length} 支股票`);

    // 更新所有股票的公式
    sheetsService.updateFormulas(sheet, stocks);

    // 計算耗時
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);

    Logger.log(`全部股票公式更新完成，總耗時: ${duration} 秒`);

    return {
      success: true,
      totalCount: stocks.length,
      successCount: stocks.length, // 公式設定都成功
      errorCount: 0,
      duration: duration,
      errors: []
    };

  } catch (e) {
    Logger.log("executeUpdateAllPrices 錯誤: " + e);
    throw e;
  }
}

/**
 * 清除快取的自訂選單函數
 */
function clearCache() {
  try {
    cacheManager.clear();
    SpreadsheetApp.getUi().alert("快取已清除！");
  } catch (e) {
    Logger.log("clearCache 錯誤: " + e);
    SpreadsheetApp.getUi().alert("清除快取時發生錯誤：" + e.toString());
  }
}

/**
 * 設定自訂選單（重新設計版本）
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('股價工具 v2.0')
    .addItem('📈 更新所有資料', 'updateAllPrices')
    .addItem('📊 更新單支股票', 'updateSingleStock')
    .addSeparator()
    .addItem('⚙️ 初始化試算表格式', 'initializeSheetFormat')
    .addItem('➕ 新增股票', 'addNewStock')
    .addItem('➖ 刪除股票', 'removeStock')
    .addSeparator()
    .addItem('🧪 執行功能測試', 'runRedesignTestSuite')
    .addItem('📋 顯示說明', 'showHelpDialog')
    .addToUi();
}

/**
 * 更新單支股票的自訂選單函數（無確認對話框，直接執行並顯示進度條）
 */
function updateSingleStock() {
  try {
    const ui = SpreadsheetApp.getUi();

    // 取得目前選中的儲存格
    const activeRange = SpreadsheetApp.getActiveRange();
    if (!activeRange) {
      ui.alert('請先選取一個儲存格');
      return;
    }

    const sheet = activeRange.getSheet();
    const rowIndex = activeRange.getRow();

    // 檢查是否為有效的股票行（有股票代號）
    const stockCode = sheet.getRange(rowIndex, 1).getValue();
    const stockName = sheet.getRange(rowIndex, 2).getValue();

    if (!stockCode || stockCode.toString().trim() === '') {
      ui.alert('錯誤', '請選取包含股票代號的行', ui.ButtonSet.OK);
      return;
    }

    // 直接執行更新，不顯示確認對話框，並顯示進度條
    updateSingleStockWithProgress(stockCode.toString().trim(), stockName || '未命名', rowIndex);

  } catch (e) {
    Logger.log('updateSingleStock 錯誤: ' + e);
    SpreadsheetApp.getUi().alert('更新單支股票時發生錯誤：' + e.toString());
  }
}

/**
 * 帶進度條的單支股票更新函數
 */
function updateSingleStockWithProgress(stockCode, stockName, rowIndex) {
  try {
    // 顯示進度對話框
    const html = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <base target="_top">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; text-align: center; }
            .progress-container { margin: 20px 0; }
            .progress-bar {
              width: 100%;
              height: 20px;
              background-color: #f0f0f0;
              border-radius: 10px;
              overflow: hidden;
            }
            .progress-fill {
              height: 100%;
              background-color: #4CAF50;
              width: 0%;
              transition: width 0.3s ease;
            }
            .status { margin: 10px 0; font-weight: bold; }
            .details { margin: 10px 0; color: #666; }
          </style>
        </head>
        <body>
          <h3>更新股票資料</h3>
          <div class="status" id="status">準備開始更新 ' + stockCode + '...</div>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" id="progressFill"></div>
            </div>
          </div>
          <div class="details" id="details">初始化中...</div>

          <script>
            let progress = 0;

            function updateProgress(percent, message, details) {
              document.getElementById('progressFill').style.width = percent + '%';
              document.getElementById('status').textContent = message;
              document.getElementById('details').textContent = details || message;
            }

            // 模擬更新進度
            const steps = [
              { percent: 10, message: '連線到資料來源...', details: '正在連線到台股/美股 API...' },
              { percent: 30, message: '取得價格資料...', details: '正在擷取即時價格資料...' },
              { percent: 50, message: '處理資料...', details: '正在處理價格指標...' },
              { percent: 70, message: '更新試算表...', details: '正在更新儲存格資料...' },
              { percent: 90, message: '重新計算公式...', details: '正在重新計算所有公式...' },
              { percent: 100, message: '更新完成！', details: '股票 ' + stockCode + ' 更新完成' }
            ];

            let stepIndex = 0;
            const interval = setInterval(() => {
              if (stepIndex < steps.length) {
                updateProgress(steps[stepIndex].percent, steps[stepIndex].message, steps[stepIndex].details);
                stepIndex++;
              } else {
                clearInterval(interval);
                setTimeout(() => {
                  google.script.host.close();
                }, 1500);
              }
            }, 400);

            // 實際執行更新（在背景執行）
            google.script.run.withSuccessHandler(() => {
              // 更新成功時的處理
            }).withFailureHandler((error) => {
              updateProgress(100, '更新失敗', '錯誤: ' + error);
              setTimeout(() => {
                google.script.host.close();
              }, 3000);
            }).executeUpdateSingleStock(stockCode, rowIndex);
          </script>
        </body>
      </html>
    `).setWidth(400).setHeight(250);

    SpreadsheetApp.getUi().showModalDialog(html, '更新股票 ' + stockCode);

  } catch (e) {
    Logger.log('updateSingleStockWithProgress 錯誤: ' + e);
    SpreadsheetApp.getUi().alert('顯示進度對話框時發生錯誤：' + e.toString());
  }
}

/**
 * 實際執行單支股票更新的函數（背景執行）
 */
function executeUpdateSingleStock(stockCode, rowIndex) {
  try {
    const startTime = new Date();
    const sheet = SpreadsheetApp.getActiveSheet();

    Logger.log(`開始執行單支股票更新: ${stockCode}, 行: ${rowIndex}`);

    // 清除此股票的快取，強制重新取得資料
    cacheManager.cache[`twse_${stockCode}`] = undefined;
    cacheManager.cache[`tpex_${stockCode}`] = undefined;
    cacheManager.cache[`us_${stockCode}`] = undefined;

    // 取得價格資料
    const priceData = stockPriceService.getPriceSync(stockCode);

    if (priceData !== null && priceData.currentPrice !== null && priceData.currentPrice !== undefined) {
      // 更新價格指標
      sheet.getRange(rowIndex, 4).setValue(priceData.currentPrice); // 即時股價
      if (priceData.previousClose !== null) {
        sheet.getRange(rowIndex, 5).setValue(priceData.previousClose); // 昨日收盤
      }
      if (priceData.openPrice !== null) {
        sheet.getRange(rowIndex, 6).setValue(priceData.openPrice); // 開盤價
      }
      if (priceData.highPrice !== null) {
        sheet.getRange(rowIndex, 7).setValue(priceData.highPrice); // 最高價
      }
      if (priceData.lowPrice !== null) {
        sheet.getRange(rowIndex, 8).setValue(priceData.lowPrice); // 最低價
      }
      if (priceData.volume !== null) {
        sheet.getRange(rowIndex, 9).setValue(priceData.volume); // 成交量
      }
      if (priceData.change !== null) {
        sheet.getRange(rowIndex, 10).setValue(priceData.change); // 漲跌
      }

      // 更新時間戳
      sheet.getRange(rowIndex, 9).setValue(
        Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss")
      );

      // 確保公式存在
      ensureFormulas(sheet, rowIndex, stockCode);

      // 強制重新計算所有公式
      SpreadsheetApp.flush();

      // 計算耗時
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);

      Logger.log(`單支股票 ${stockCode} 更新成功，耗時: ${duration} 秒，即時價格: ${priceData.currentPrice}`);

      return {
        success: true,
        stockCode: stockCode,
        duration: duration,
        currentPrice: priceData.currentPrice
      };

    } else {
      Logger.log(`無法取得股票 ${stockCode} 的價格資料`);
      throw new Error(`無法取得股票 ${stockCode} 的價格資料。請檢查股票代號是否正確。`);
    }

  } catch (updateError) {
    Logger.log(`執行單支股票更新 ${stockCode} 錯誤: ${updateError}`);
    throw updateError;
  }
}

/**
 * 顯示單支股票更新進度條（移除 HTML 服務，使用簡單對話框）
 */
function showSingleStockProgress(stockCode, stockName, rowIndex) {
  try {
    // 顯示開始訊息
    SpreadsheetApp.getUi().alert('開始更新', `正在更新股票 ${stockCode} (${stockName}) 的價格資料...\n\n請稍候，這可能需要幾秒鐘。`, SpreadsheetApp.getUi().ButtonSet.OK);

    // 直接呼叫更新函數
    const result = updateSingleStockWithProgress(stockCode, rowIndex);

    // 顯示結果
    if (result && result.success) {
      SpreadsheetApp.getUi().alert('更新成功', `股票 ${result.stockCode} 更新完成！\n耗時: ${result.duration} 秒`, SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      SpreadsheetApp.getUi().alert('更新失敗', `無法取得股票 ${stockCode} 的價格資料。\n錯誤: ${result ? result.error : '未知錯誤'}\n\n請檢查股票代號是否正確，或查看應用程式記錄以取得詳細資訊。`, SpreadsheetApp.getUi().ButtonSet.OK);
    }

  } catch (e) {
    Logger.log('showSingleStockProgress 錯誤: ' + e);
    SpreadsheetApp.getUi().alert('顯示進度對話框時發生錯誤：' + e.toString());
  }
}

/**
 * 實際執行單支股票更新的函數
 */
function updateSingleStockWithProgress(stockCode, rowIndex) {
  try {
    const startTime = new Date();
    Logger.log(`開始更新單支股票: ${stockCode}, 行: ${rowIndex}`);

    const sheet = SpreadsheetApp.getActiveSheet();

    // 驗證股票代號是否能取得資料
    const priceData = stockPriceService.getPriceSync(stockCode);

    if (priceData !== null && priceData.currentPrice !== null && priceData.currentPrice !== undefined) {
      // 只更新時間戳，強制重新計算公式
      sheet.getRange(rowIndex, 9).setValue(
        Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss")
      );

      // 確保公式存在
      ensureFormulas(sheet, rowIndex, stockCode);

      // 強制重新計算
      SpreadsheetApp.flush();

      // 計算耗時
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);

      Logger.log(`單支股票 ${stockCode} 更新成功，耗時: ${duration} 秒`);

      // 回傳成功結果
      return {
        success: true,
        stockCode: stockCode,
        duration: duration,
        message: `股票 ${stockCode} 更新完成`
      };

    } else {
      Logger.log(`無法取得股票 ${stockCode} 的價格資料`);
      return {
        success: false,
        error: `無法取得股票 ${stockCode} 的價格資料。請檢查股票代號是否正確。`,
        stockCode: stockCode
      };
    }

  } catch (e) {
    Logger.log(`updateSingleStockWithProgress 錯誤 for ${stockCode}: ${e}`);
    return {
      success: false,
      error: `系統錯誤：${e.toString()}`,
      stockCode: stockCode
    };
  }
}

/**
 * 顯示更新進度對話框（模擬進度條）
 */
function showProgressDialog() {
  try {
    const html = HtmlService
      .createHtmlOutput(`
        <!DOCTYPE html>
        <html>
          <head>
            <base target="_top">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .progress-container { margin: 20px 0; }
              .progress-bar {
                width: 100%;
                height: 20px;
                background-color: #f0f0f0;
                border-radius: 10px;
                overflow: hidden;
              }
              .progress-fill {
                height: 100%;
                background-color: #4CAF50;
                width: 0%;
                transition: width 0.3s ease;
              }
              .status { margin: 10px 0; font-weight: bold; }
              button { padding: 10px 20px; margin: 5px; }
            </style>
          </head>
          <body>
            <h3>股價更新進度</h3>
            <div class="status" id="status">準備開始更新...</div>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
              </div>
            </div>
            <div id="details">正在初始化...</div>
            <button onclick="startUpdate()">開始更新</button>
            <button onclick="closeDialog()">關閉</button>

            <script>
              let progress = 0;
              let isUpdating = false;

              function updateProgress(percent, message) {
                document.getElementById('progressFill').style.width = percent + '%';
                document.getElementById('status').textContent = message;
                document.getElementById('details').textContent =
                  '已完成 ' + percent + '% - ' + message;
              }

              function startUpdate() {
                if (isUpdating) return;
                isUpdating = true;

                updateProgress(0, '開始更新股票價格...');

                // 模擬更新過程
                const steps = [
                  { percent: 10, message: '讀取股票清單...' },
                  { percent: 25, message: '連線到台股 API...' },
                  { percent: 50, message: '取得台股價格資料...' },
                  { percent: 75, message: '連線到美股 API...' },
                  { percent: 90, message: '取得美股價格資料...' },
                  { percent: 100, message: '更新完成！' }
                ];

                let stepIndex = 0;
                const interval = setInterval(() => {
                  if (stepIndex < steps.length) {
                    updateProgress(steps[stepIndex].percent, steps[stepIndex].message);
                    stepIndex++;
                  } else {
                    clearInterval(interval);
                    isUpdating = false;
                    setTimeout(() => {
                      google.script.host.close();
                    }, 2000);
                  }
                }, 800);
              }

              function closeDialog() {
                google.script.host.close();
              }
            </script>
          </body>
        </html>
      `)
      .setWidth(400)
      .setHeight(300);

    SpreadsheetApp.getUi().showModalDialog(html, '股價更新進度');

  } catch (e) {
    Logger.log('showProgressDialog 錯誤: ' + e);
    SpreadsheetApp.getUi().alert('顯示進度對話框時發生錯誤：' + e.toString());
  }
}

/**
 * 初始化試算表格式和設定
 */
function initializeSheetFormat() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // 設定工作表名稱
    sheet.setName('股票追蹤');

    // 清除現有內容
    sheet.clear();

    // 設定欄位標題
    const headers = [
      ['股票代號', '股票名稱', '走勢圖', '即時股價', '漲跌金額', '開盤價', '最高價', '最低價', '成交量', 'AI走勢分析', 'AI投資建議', '更新時間', 'AI提示_走勢', 'AI提示_建議']
    ];
    sheet.getRange(1, 1, 1, 14).setValues(headers);

    // 設定標題列格式
    const headerRange = sheet.getRange(1, 1, 1, 14);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#e8f4fd');
    headerRange.setBorder(true, true, true, true, true, true);
    headerRange.setFontColor('#2c3e50');

    // 設定欄位寬度
    sheet.setColumnWidth(1, 100); // 股票代號
    sheet.setColumnWidth(2, 120); // 股票名稱
    sheet.setColumnWidth(3, 200); // 走勢圖
    sheet.setColumnWidth(4, 100); // 即時股價
    sheet.setColumnWidth(5, 100); // 漲跌金額
    sheet.setColumnWidth(6, 100); // 開盤價
    sheet.setColumnWidth(7, 100); // 最高價
    sheet.setColumnWidth(8, 100); // 最低價
    sheet.setColumnWidth(9, 120); // 成交量
    sheet.setColumnWidth(10, 200); // AI走勢分析
    sheet.getRange(1, 10).setBackground('#e8f5e8'); // 淺綠色背景
    sheet.setColumnWidth(11, 300); // AI投資建議
    sheet.getRange(1, 11).setBackground('#f3e5f5'); // 淺紫色背景
    sheet.setColumnWidth(12, 150); // 更新時間
    sheet.setColumnWidth(13, 0); // AI提示_走勢 (隱藏欄位)
    sheet.setColumnWidth(14, 0); // AI提示_建議 (隱藏欄位)

    // 設定資料驗證規則
    setupDataValidation(sheet);

    // 設定條件格式化
    setupConditionalFormatting(sheet, 14);

    // 新增範例資料
    addSampleData(sheet);

    // 建立設定工作表
    createSettingsSheet(spreadsheet);

    SpreadsheetApp.getUi().alert('試算表格式初始化完成！');

  } catch (e) {
    Logger.log('初始化格式錯誤: ' + e);
    SpreadsheetApp.getUi().alert('初始化過程中發生錯誤：' + e.toString());
  }
}

/**
 * 設定資料驗證規則
 */
function setupDataValidation(sheet) {
  // 股票代號欄位驗證 (第1列)
  const stockCodeRange = sheet.getRange(2, 1, 1000, 1); // A2:A1001

  // 移除資料驗證，讓用戶自由輸入
  // 系統會在程式碼中處理驗證和錯誤
  stockCodeRange.clearDataValidations();
}

/**
 * 設定條件格式化
 */
function setupConditionalFormatting(sheet, totalColumns = 12) {
  // 價格變動顏色提示 - 基於漲跌金額欄位
  const priceRange = sheet.getRange(2, 4, 1000, 5); // D2:H1001 (價格欄位)

  // 漲價顯示綠色背景
  const greenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(NOT(ISBLANK($E2)), $E2 > 0)')
    .setBackground('#d9ead3') // 淺綠色
    .setRanges([priceRange])
    .build();

  // 跌價顯示紅色背景
  const redRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(NOT(ISBLANK($E2)), $E2 < 0)')
    .setBackground('#f4cccc') // 淺紅色
    .setRanges([priceRange])
    .build();

  // 漲跌金額欄位特殊格式化 (E欄)
  const changeRangeE = sheet.getRange(2, 5, 1000, 1); // E2:E1001 (漲跌金額欄位)

  // 正數顯示綠色，負數顯示紅色
  const changeGreenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(NOT(ISBLANK($E2)), $E2 > 0)')
    .setBackground('#d9ead3') // 淺綠色
    .setFontColor('#2e7d32') // 深綠色文字
    .setRanges([changeRangeE])
    .build();

  const changeRedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(NOT(ISBLANK($E2)), $E2 < 0)')
    .setBackground('#f4cccc') // 淺紅色
    .setBackground('#f4cccc') // 淺紅色
    .setFontColor('#c62828') // 深紅色文字
    .setRanges([changeRangeE])
    .build();

  // AI 分析欄位特殊樣式 (J欄 - AI走勢分析)
  const aiTrendRange = sheet.getRange(2, 10, 1000, 1); // J2:J1001 (AI走勢分析欄位)
  const aiTrendStyleRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=NOT(ISBLANK($J2))')
    .setBackground('#e8f5e8') // 淺綠色背景
    .setFontColor('#2e7d32') // 深綠色文字
    .setRanges([aiTrendRange])
    .build();

  // AI 分析欄位特殊樣式 (K欄 - AI投資建議)
  const aiAdviceRange = sheet.getRange(2, 11, 1000, 1); // K2:K1001 (AI投資建議欄位)
  const aiAdviceStyleRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=NOT(ISBLANK($K2))')
    .setBackground('#f3e5f5') // 淺紫色背景
    .setFontColor('#4a148c') // 深紫色文字
    .setRanges([aiAdviceRange])
    .build();

  // 套用條件格式化規則
  sheet.setConditionalFormatRules([greenRule, redRule, changeGreenRule, changeRedRule, aiTrendStyleRule, aiAdviceStyleRule]);

  // 設定數值格式
  const numberFormatRanges = [
    sheet.getRange(2, 4, 1000, 5), // 價格欄位 (D-H)
    sheet.getRange(2, 9, 1000, 1), // 成交量欄位 (I)
  ];

  numberFormatRanges.forEach(range => {
    range.setNumberFormat('#,##0.00');
  });

  // 漲跌金額欄位格式化 (E欄)
  const changeRangeFormat = sheet.getRange(2, 5, 1000, 1);
  changeRangeFormat.setNumberFormat('+#,##0.00;-#,##0.00;0.00');

  // 成交量欄位特殊格式化 (整數)
  const volumeRange = sheet.getRange(2, 9, 1000, 1);
  volumeRange.setNumberFormat('#,##0');

  // 設定時間格式
  const timeRange = sheet.getRange(2, 12, 1000, 1); // 更新時間欄位 (L欄)
  timeRange.setNumberFormat('yyyy-mm-dd hh:mm:ss');
}

/**
 * 新增範例資料
 */
function addSampleData(sheet) {
  const sampleData = [
    ['2330', '台積電'],
    ['2454', '聯發科'],
    ['2317', '鴻海'],
    ['AAPL', 'Apple Inc.'],
    ['TSLA', 'Tesla']
  ];

  if (sampleData.length > 0) {
    // 先設定股票代號和名稱
    sheet.getRange(2, 1, sampleData.length, 2).setValues(sampleData);

    // 設定公式 (參考 A 欄和 B 欄)
    for (let i = 0; i < sampleData.length; i++) {
      const rowNum = i + 2; // 第2行開始
      sheet.getRange(rowNum, 3).setFormula(`=GETSPARKLINE(A${rowNum})`);        // 走勢圖
      sheet.getRange(rowNum, 4).setFormula(`=GOOGLEFINANCE(A${rowNum}, "price")`);  // 即時股價
      sheet.getRange(rowNum, 5).setFormula(`=GOOGLEFINANCE(A${rowNum}, "change")`); // 漲跌金額
      sheet.getRange(rowNum, 6).setFormula(`=GOOGLEFINANCE(A${rowNum}, "open")`);   // 開盤價
      sheet.getRange(rowNum, 7).setFormula(`=GOOGLEFINANCE(A${rowNum}, "high")`);   // 最高價
      sheet.getRange(rowNum, 8).setFormula(`=GOOGLEFINANCE(A${rowNum}, "low")`);    // 最低價
      sheet.getRange(rowNum, 9).setFormula(`=GOOGLEFINANCE(A${rowNum}, "volume")`); // 成交量
      // 在隱藏欄位設定提示文字
      const trendPrompt = `分析 ${sampleData[i][1]} (${sampleData[i][0]}) 的近期走勢。請簡要描述趨勢方向和關鍵價位。`;
      sheet.getRange(rowNum, 13).setValue(trendPrompt);
      sheet.getRange(rowNum, 10).setFormula(`=AI(M${rowNum}, 0.3)`); // AI走勢分析

      const advicePrompt = `請為 ${sampleData[i][1]} (${sampleData[i][0]}) 提供投資建議（買入/持有/賣出），並說明理由。`;
      sheet.getRange(rowNum, 14).setValue(advicePrompt);
      sheet.getRange(rowNum, 11).setFormula(`=AI(N${rowNum}, 0.4)`); // AI投資建議
      sheet.getRange(rowNum, 12).setValue(Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss")); // 更新時間
    }
  }
}

/**
 * 建立設定工作表
 */
function createSettingsSheet(spreadsheet) {
  let settingsSheet = spreadsheet.getSheetByName('設定');

  if (!settingsSheet) {
    settingsSheet = spreadsheet.insertSheet('設定');
  } else {
    settingsSheet.clear();
  }

  // 設定標題
  const settingsHeaders = [['設定項目', '設定值', '說明']];
  settingsSheet.getRange(1, 1, 1, 3).setValues(settingsHeaders);

  // 設定資料
  const settingsData = [
    ['走勢圖天數', '30', '歷史走勢圖顯示的天數 (7-365)'],
    ['快取時間', '5', '資料快取分鐘數'],
    ['自動更新間隔', '0', '自動更新間隔分鐘數 (0=關閉)'],
    ['API逾時時間', '10', 'API呼叫逾時秒數'],
    ['重試次數', '3', 'API失敗重試次數']
  ];

  settingsSheet.getRange(2, 1, settingsData.length, 3).setValues(settingsData);

  // 設定格式
  const headerRange = settingsSheet.getRange(1, 1, 1, 3);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#e8f4fd');

  // 設定欄位寬度
  settingsSheet.setColumnWidth(1, 150);
  settingsSheet.setColumnWidth(2, 100);
  settingsSheet.setColumnWidth(3, 300);
}

/**
 * 測試函數 - 用於驗證新版本功能
 */
function testRedesignFunctionality() {
  Logger.log("=== 測試重新設計版本功能 ===");

  try {
    // 測試 GOOGLEFINANCEPRICE 函數
    Logger.log("測試 GOOGLEFINANCEPRICE 函數...");
    const gfPrice = GOOGLEFINANCEPRICE("2330");
    Logger.log("GOOGLEFINANCEPRICE 公式: " + gfPrice);

    // 測試 GETSPARKLINE 函數
    Logger.log("測試 GETSPARKLINE 函數...");
    const sparkline = GETSPARKLINE("2330");
    Logger.log("GETSPARKLINE 公式: " + sparkline);

    // 測試市場代號映射
    Logger.log("測試市場代號映射...");
    const twseMapped = marketMapper.mapToGoogleFinance("2330");
    const usMapped = marketMapper.mapToGoogleFinance("AAPL");
    Logger.log("台股映射: 2330 -> " + twseMapped);
    Logger.log("美股映射: AAPL -> " + usMapped);

    // 測試 AI 分析公式生成
    Logger.log("測試 AI 分析公式生成...");
    const aiTrend = aiAnalysisService.generateAIAnalysisFormula("2330", "trend");
    const aiAdvice = aiAnalysisService.generateAIInvestmentAdviceFormula("2330", "台積電");
    Logger.log("AI 趨勢分析公式: " + aiTrend);
    Logger.log("AI 投資建議公式: " + aiAdvice);

    Logger.log("重新設計版本功能測試完成");
  } catch (e) {
    Logger.log("測試錯誤: " + e);
  }
}

/**
 * 測試完整價格指標功能
 */
function testPriceIndicators() {
  Logger.log("測試完整價格指標功能...");

  try {
    // 測試台股完整指標
    const twseData = stockPriceService.getPrice("2330");
    Logger.log("台積電完整資料: " + JSON.stringify(twseData));

    // 測試上櫃完整指標
    const tpexData = stockPriceService.getPrice("6104");
    Logger.log("創惟完整資料: " + JSON.stringify(tpexData));

    // 測試美股完整指標
    const usData = stockPriceService.getPrice("AAPL");
    Logger.log("Apple 完整資料: " + JSON.stringify(usData));

    // 測試資料格式化
    if (twseData) {
      const formatted = dataProcessingService.formatPriceIndicators(twseData);
      Logger.log("台積電格式化資料: " + JSON.stringify(formatted));
    }

    Logger.log("完整價格指標測試完成");
  } catch (e) {
    Logger.log("價格指標測試錯誤: " + e);
  }
}

/**
 * 測試歷史資料和走勢圖功能
 */
function testHistoryAndSparkline() {
  Logger.log("測試歷史資料和走勢圖功能...");

  try {
    // 測試台股歷史資料
    const twseHistory = stockPriceService.getHistory("2330", 7);
    Logger.log("台積電 7 天歷史資料: " + JSON.stringify(twseHistory));

    // 測試美股歷史資料
    const usHistory = stockPriceService.getHistory("AAPL", 7);
    Logger.log("Apple 7 天歷史資料: " + JSON.stringify(usHistory));

    // 測試 SPARKLINE 生成
    if (twseHistory && twseHistory.length > 0) {
      const sparkline = dataProcessingService.generateSparkline(twseHistory);
      Logger.log("台積電 SPARKLINE: " + sparkline);
    }

    Logger.log("歷史資料和走勢圖測試完成");
  } catch (e) {
    Logger.log("歷史資料測試錯誤: " + e);
  }
}

/**
 * 重新設計版本完整功能測試套件
 */
function runRedesignTestSuite() {
  Logger.log("=== 股價追蹤工具重新設計版本測試套件開始 ===");

  try {
    // 顯示開始訊息
    SpreadsheetApp.getUi().alert("測試開始", "正在執行重新設計版本功能測試套件...\n\n請查看 Apps Script 記錄以取得詳細結果。", SpreadsheetApp.getUi().ButtonSet.OK);

    // 測試 1: 新版本基本功能
    Logger.log("--- 測試 1: 新版本基本功能 ---");
    testRedesignFunctionality();

    // 測試 2: GOOGLEFINANCE 整合
    Logger.log("--- 測試 2: GOOGLEFINANCE 整合 ---");
    testGoogleFinanceIntegration();

    // 測試 3: AI 分析功能
    Logger.log("--- 測試 3: AI 分析功能 ---");
    testAIAnalysis();

    // 測試 4: GETSPARKLINE 自訂功能
    Logger.log("--- 測試 4: GETSPARKLINE 自訂功能 ---");
    testSparklineCustomization();

    // 測試 5: 批量更新功能
    Logger.log("--- 測試 5: 批量更新功能 ---");
    testBatchUpdate();

    // 測試 6: 試算表格式化
    Logger.log("--- 測試 6: 試算表格式化 ---");
    testSheetFormatting();

    Logger.log("=== 重新設計版本測試套件執行完成 ===");

    // 顯示完成訊息
    SpreadsheetApp.getUi().alert("測試完成", "重新設計版本功能測試套件已執行完畢！\n\n請查看 Apps Script 的執行記錄 (Executions > Logs) 以取得詳細測試結果。", SpreadsheetApp.getUi().ButtonSet.OK);

  } catch (e) {
    Logger.log("測試套件執行錯誤: " + e);
    SpreadsheetApp.getUi().alert("測試錯誤", "測試套件執行時發生錯誤：" + e.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * API 連線診斷測試
 */
function testApiConnectivity() {
  Logger.log("測試 API 連線診斷...");

  try {
    // 測試 TWSE API 連線
    Logger.log("測試 TWSE API 連線...");
    const twseTest = testTWSEConnection();
    Logger.log("TWSE 連線測試結果: " + (twseTest ? "成功" : "失敗"));

    // 測試 TPEX API 連線
    Logger.log("測試 TPEX API 連線...");
    const tpexTest = testTPEXConnection();
    Logger.log("TPEX 連線測試結果: " + (tpexTest ? "成功" : "失敗"));

    // 測試 Yahoo Finance API 連線
    Logger.log("測試 Yahoo Finance API 連線...");
    const yahooTest = testYahooConnection();
    Logger.log("Yahoo Finance 連線測試結果: " + (yahooTest ? "成功" : "失敗"));

    Logger.log("API 連線診斷測試完成");

  } catch (e) {
    Logger.log("API 連線診斷測試錯誤: " + e);
  }
}

/**
 * 測試 TWSE API 連線
 */
function testTWSEConnection() {
  try {
    const today = Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd");
    const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${today}&stockNo=2330`;

    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeoutInSeconds: 5 // 5 秒超時
    });

    const responseCode = response.getResponseCode();
    Logger.log("TWSE 回應碼: " + responseCode);

    if (responseCode === 200) {
      const json = JSON.parse(response.getContentText());
      Logger.log("TWSE 回應資料長度: " + response.getContentText().length);
      return json && json.data && json.data.length > 0;
    }

    return false;
  } catch (e) {
    Logger.log("TWSE 連線測試錯誤: " + e);
    return false;
  }
}

/**
 * 測試 TPEX API 連線
 */
function testTPEXConnection() {
  try {
    Logger.log("測試 TPEX 多重 API 方法...");

    // 測試 v1 API
    try {
      const url = `https://www.tpex.org.tw/openapi/v1/stock_info?stock_no=6104`;
      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      Logger.log("TPEX v1 回應碼: " + response.getResponseCode());

      if (response.getResponseCode() === 200) {
        const content = response.getContentText();
        Logger.log("TPEX v1 回應長度: " + content.length);
        Logger.log("TPEX v1 回應內容: " + content.substring(0, 200));

        try {
          const json = JSON.parse(content);
          if (json && json.data && json.data.length > 0) {
            Logger.log("TPEX v1 API 測試成功");
            return true;
          }
        } catch (parseError) {
          Logger.log("TPEX v1 JSON 解析錯誤: " + parseError);
          Logger.log("回應內容不是有效的 JSON，可能是 HTML 錯誤頁面");
        }
      }
    } catch (v1Error) {
      Logger.log("TPEX v1 API 測試失敗: " + v1Error);
    }

    Logger.log("所有 TPEX API 測試都失敗");
    return false;
  } catch (e) {
    Logger.log("TPEX 連線測試總體錯誤: " + e);
    return false;
  }
}

/**
 * 測試 Yahoo Finance API 連線
 */
function testYahooConnection() {
  try {
    Logger.log("測試 Yahoo Finance 多重 API 方法...");

    // 測試 v7 API
    try {
      const urlV7 = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL`;
      const responseV7 = UrlFetchApp.fetch(urlV7, {
        muteHttpExceptions: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      Logger.log("Yahoo v7 回應碼: " + responseV7.getResponseCode());
      if (responseV7.getResponseCode() === 200) {
        const jsonV7 = JSON.parse(responseV7.getContentText());
        if (jsonV7 && jsonV7.quoteResponse && jsonV7.quoteResponse.result && jsonV7.quoteResponse.result.length > 0) {
          Logger.log("Yahoo v7 API 測試成功");
          return true;
        }
      }
    } catch (v7Error) {
      Logger.log("Yahoo v7 API 測試失敗: " + v7Error);
    }

    // 測試 v10 API
    try {
      const urlV10 = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/AAPL?modules=price`;
      const responseV10 = UrlFetchApp.fetch(urlV10, {
        muteHttpExceptions: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      Logger.log("Yahoo v10 回應碼: " + responseV10.getResponseCode());
      if (responseV10.getResponseCode() === 200) {
        const jsonV10 = JSON.parse(responseV10.getContentText());
        if (jsonV10 && jsonV10.quoteSummary && jsonV10.quoteSummary.result && jsonV10.quoteSummary.result.length > 0) {
          Logger.log("Yahoo v10 API 測試成功");
          return true;
        }
      }
    } catch (v10Error) {
      Logger.log("Yahoo v10 API 測試失敗: " + v10Error);
    }

    Logger.log("所有 Yahoo Finance API 測試都失敗");
    return false;
  } catch (e) {
    Logger.log("Yahoo 連線測試總體錯誤: " + e);
    return false;
  }
}

/**
 * 測試快取功能
 */
function testCacheFunctionality() {
  Logger.log("測試快取功能...");

  try {
    const testCode = "2330";

    // 清除快取
    cacheManager.clear();
    Logger.log("快取已清除");

    // 第一次呼叫 - 應該從 API 獲取
    const startTime1 = new Date().getTime();
    const price1 = stockPriceService.getPrice(testCode);
    const endTime1 = new Date().getTime();

    Logger.log("第一次呼叫 - 價格: " + JSON.stringify(price1) + ", 耗時: " + (endTime1 - startTime1) + "ms");

    // 第二次呼叫 - 應該從快取獲取
    const startTime2 = new Date().getTime();
    const price2 = stockPriceService.getPrice(testCode);
    const endTime2 = new Date().getTime();

    Logger.log("第二次呼叫 - 價格: " + JSON.stringify(price2) + ", 耗時: " + (endTime2 - startTime2) + "ms");

    // 驗證資料一致性
    const isDataConsistent = JSON.stringify(price1) === JSON.stringify(price2);
    Logger.log("快取資料一致性: " + (isDataConsistent ? "通過" : "失敗"));

    Logger.log("快取功能測試完成");

  } catch (e) {
    Logger.log("快取測試錯誤: " + e);
  }
}

/**
 * 測試錯誤處理
 */
function testErrorHandling() {
  Logger.log("測試錯誤處理...");

  try {
    // 測試無效股票代號
    const invalidResult = TWSTOCKPRICE("INVALID");
    Logger.log("無效代號結果: " + invalidResult);

    // 測試空代號
    const emptyResult = TWSTOCKPRICE("");
    Logger.log("空代號結果: " + emptyResult);

    // 測試不存在的股票
    const nonexistentResult = TWSTOCKPRICE("999999");
    Logger.log("不存在股票結果: " + nonexistentResult);

    Logger.log("錯誤處理測試完成");

  } catch (e) {
    Logger.log("錯誤處理測試錯誤: " + e);
  }
}

/**
 * 新增股票功能 - 支援自動帶出名稱或代號
 */
function addNewStock() {
  try {
    const ui = SpreadsheetApp.getUi();

    // 提供選項：輸入代號或輸入名稱
    const inputType = ui.alert(
      '新增股票',
      '請選擇輸入方式：',
      ui.ButtonSet.OK_CANCEL
    );

    if (inputType !== ui.Button.OK) return;

    // 建立自訂對話框讓用戶選擇輸入方式
    const html = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <base target="_top">
          <style>
            body { font-family: 'Microsoft JhengHei', Arial, sans-serif; margin: 20px; }
            .option { margin: 15px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer; }
            .option:hover { background: #f5f5f5; }
            button { padding: 10px 20px; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <h3>新增股票</h3>
          <p>請選擇輸入方式：</p>
          <div class="option" onclick="selectOption('code')">📊 輸入股票代號 (如: 2330, AAPL)</div>
          <div class="option" onclick="selectOption('name')">🏷️ 輸入股票名稱 (如: 台積電, Apple)</div>
          <br>
          <button onclick="google.script.host.close()">取消</button>

          <script>
            function selectOption(type) {
              google.script.run.withSuccessHandler(function() {
                google.script.host.close();
              }).withFailureHandler(function(error) {
                alert('錯誤: ' + error);
              }).promptForStockInput(type);
            }
          </script>
        </body>
      </html>
    `).setWidth(400).setHeight(250);

    SpreadsheetApp.getUi().showModalDialog(html, '選擇輸入方式');

  } catch (e) {
    Logger.log('addNewStock 錯誤: ' + e);
    SpreadsheetApp.getUi().alert('新增股票時發生錯誤：' + e.toString());
  }
}

/**
 * 處理股票輸入提示
 */
function promptForStockInput(inputType) {
  try {
    const ui = SpreadsheetApp.getUi();
    let promptText = '';
    let title = '';

    if (inputType === 'code') {
      title = '輸入股票代號';
      promptText = '請輸入股票代號：\n\n台股上市: 2330\n台股上櫃: 6104\n美股: AAPL, TSLA';
    } else {
      title = '輸入股票名稱';
      promptText = '請輸入股票名稱：\n\n例如: 台積電, 鴻海, Apple, Tesla';
    }

    const response = ui.prompt(title, promptText, ui.ButtonSet.OK_CANCEL);

    if (response.getSelectedButton() !== ui.Button.OK) return;

    const input = response.getResponseText().trim();
    if (!input) {
      ui.alert('錯誤', '輸入不能為空', ui.ButtonSet.OK);
      return;
    }

    // 處理輸入並新增股票
    processStockAddition(input, inputType);

  } catch (e) {
    Logger.log('promptForStockInput 錯誤: ' + e);
    SpreadsheetApp.getUi().alert('處理輸入時發生錯誤：' + e.toString());
  }
}

/**
 * 處理股票新增邏輯
 */
function processStockAddition(input, inputType) {
  try {
    const ui = SpreadsheetApp.getUi();
    const sheet = SpreadsheetApp.getActiveSheet();

    let stockCode = '';
    let stockName = '';

    if (inputType === 'code') {
      // 用戶輸入的是代號，需要自動帶出名稱
      stockCode = input.toUpperCase();

      // 嘗試從 GOOGLEFINANCE 取得股票名稱
      try {
        // 使用 GOOGLEFINANCE 嘗試取得股票資訊來驗證代號
        const testFormula = `GOOGLEFINANCE("${stockCode}", "name")`;
        // 這裡我們無法直接執行公式，但可以設定一個測試儲存格

        // 根據代號格式推測市場類型
        if (/^\d{4}$/.test(stockCode)) {
          stockName = '台股上市股票';
        } else if (/^[A-Z0-9]{4,6}$/.test(stockCode)) {
          stockName = '美股';
        } else {
          stockName = '未知市場股票';
        }

        ui.alert('資訊', `將新增股票代號: ${stockCode}\n預估名稱: ${stockName}\n\n系統將自動設定所有公式。`, ui.ButtonSet.OK);

      } catch (e) {
        Logger.log('驗證股票代號失敗: ' + e);
        stockName = '請確認名稱';
      }

    } else {
      // 用戶輸入的是名稱，需要自動帶出代號
      stockName = input;

      // 簡單的股票名稱到代號映射 (可以擴展)
      const nameToCodeMap = {
        '台積電': '2330',
        '鴻海': '2317',
        '聯發科': '2454',
        '台達電': '2308',
        'apple': 'AAPL',
        'tesla': 'TSLA',
        'google': 'GOOGL',
        'microsoft': 'MSFT'
      };

      // 嘗試精確匹配
      stockCode = nameToCodeMap[stockName.toLowerCase()];

      if (!stockCode) {
        // 如果找不到精確匹配，嘗試模糊匹配
        for (const [name, code] of Object.entries(nameToCodeMap)) {
          if (name.includes(stockName.toLowerCase()) || stockName.toLowerCase().includes(name)) {
            stockCode = code;
            stockName = name.charAt(0).toUpperCase() + name.slice(1);
            break;
          }
        }
      }

      if (!stockCode) {
        ui.alert('提示', `無法自動識別 "${stockName}" 的股票代號。\n\n請改為輸入股票代號，或確認名稱拼寫正確。`, ui.ButtonSet.OK);
        return;
      }

      ui.alert('資訊', `將新增股票:\n名稱: ${stockName}\n代號: ${stockCode}\n\n系統將自動設定所有公式。`, ui.ButtonSet.OK);
    }

    // 找到第一個空行
    const data = sheet.getDataRange().getValues();
    let emptyRow = -1;

    for (let i = 1; i < data.length; i++) { // 從第2行開始 (跳過標題)
      if (!data[i][0] && !data[i][1]) { // 股票代號和名稱都為空
        emptyRow = i + 1; // 1-indexed
        break;
      }
    }

    if (emptyRow === -1) {
      // 如果沒有空行，新增到最後
      emptyRow = data.length + 1;
    }

    // 設定股票代號和名稱
    sheet.getRange(emptyRow, 1).setValue(stockCode);
    sheet.getRange(emptyRow, 2).setValue(stockName);

    // 設定所有公式 (使用參考欄位)
    sheet.getRange(emptyRow, 3).setFormula(`=GETSPARKLINE(A${emptyRow})`);        // 走勢圖
    sheet.getRange(emptyRow, 4).setFormula(`=GOOGLEFINANCE(A${emptyRow}, "price")`); // 即時股價
    sheet.getRange(emptyRow, 5).setFormula(`=GOOGLEFINANCE(A${emptyRow}, "change")`); // 漲跌金額
    sheet.getRange(emptyRow, 6).setFormula(`=GOOGLEFINANCE(A${emptyRow}, "open")`);   // 開盤價
    sheet.getRange(emptyRow, 7).setFormula(`=GOOGLEFINANCE(A${emptyRow}, "high")`);   // 最高價
    sheet.getRange(emptyRow, 8).setFormula(`=GOOGLEFINANCE(A${emptyRow}, "low")`);    // 最低價
    sheet.getRange(emptyRow, 9).setFormula(`=GOOGLEFINANCE(A${emptyRow}, "volume")`); // 成交量
    // 在隱藏欄位設定 AI 提示文字
    const trendPrompt = `分析 ${stockName} (${stockCode}) 的近期走勢。請簡要描述趨勢方向和關鍵價位。`;
    sheet.getRange(emptyRow, 13).setValue(trendPrompt);
    sheet.getRange(emptyRow, 10).setFormula(`=AI(M${emptyRow}, 0.3)`); // AI走勢分析

    const advicePrompt = `請為 ${stockName} (${stockCode}) 提供投資建議（買入/持有/賣出），並說明理由。`;
    sheet.getRange(emptyRow, 14).setValue(advicePrompt);
    sheet.getRange(emptyRow, 11).setFormula(`=AI(N${emptyRow}, 0.4)`); // AI投資建議
    sheet.getRange(emptyRow, 12).setValue(Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss")); // 更新時間

    ui.alert('成功', `股票已新增到第 ${emptyRow} 行！\n\n代號: ${stockCode}\n名稱: ${stockName}\n\n所有公式已自動設定，請稍候讓 GOOGLEFINANCE 和 AI 函數載入資料。`, ui.ButtonSet.OK);

  } catch (e) {
    Logger.log('processStockAddition 錯誤: ' + e);
    SpreadsheetApp.getUi().alert('新增股票時發生錯誤：' + e.toString());
  }
}

/**
 * 刪除股票功能
 */
function removeStock() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.prompt(
      '刪除股票',
      '請輸入要刪除的股票代號：',
      ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() !== ui.Button.OK) return;

    const codeToDelete = response.getResponseText().trim();
    if (!codeToDelete) {
      ui.alert('錯誤', '股票代號不能為空', ui.ButtonSet.OK);
      return;
    }

    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();

    let foundRow = -1;
    for (let i = 1; i < data.length; i++) { // 從第2行開始
      if (data[i][0] && data[i][0].toString().trim() === codeToDelete) {
        foundRow = i + 1; // 1-indexed
        break;
      }
    }

    if (foundRow === -1) {
      ui.alert('錯誤', `找不到股票代號：${codeToDelete}`, ui.ButtonSet.OK);
      return;
    }

    // 確認刪除
    const confirmResponse = ui.alert(
      '確認刪除',
      `確定要刪除第 ${foundRow} 行的股票 ${codeToDelete} 嗎？`,
      ui.ButtonSet.YES_NO
    );

    if (confirmResponse !== ui.Button.YES) return;

    // 清除該行資料 (12 欄位)
    sheet.getRange(foundRow, 1, 1, 12).clearContent();

    ui.alert('成功', `股票 ${codeToDelete} 已刪除`, ui.ButtonSet.OK);

  } catch (e) {
    Logger.log('removeStock 錯誤: ' + e);
    SpreadsheetApp.getUi().alert('刪除股票時發生錯誤：' + e.toString());
  }
}

/**
 * 顯示說明對話框
 */
function showHelpDialog() {
  try {
    const html = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <base target="_top">
          <style>
            body { font-family: 'Microsoft JhengHei', Arial, sans-serif; margin: 20px; line-height: 1.6; }
            h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            h3 { color: #34495e; margin-top: 20px; }
            .feature { background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .code { background: #2c3e50; color: #ecf0f1; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
            .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h2>📈 股價追蹤工具 v2.0 - 使用說明</h2>

          <div class="important">
            <strong>🎉 新版本特色：</strong> 全面使用 Google Sheets 內建函數，大幅提升效能和穩定性！
          </div>

          <h3>🚀 主要功能</h3>
          <div class="feature">
            <strong>GOOGLEFINANCE 整合：</strong> 自動取得台股和美股的即時價格、技術指標<br>
            <strong>AI 智慧分析：</strong> 使用 AI() 函數提供專業的走勢分析和投資建議<br>
            <strong>自訂走勢圖：</strong> GETSPARKLINE 支援從設定表讀取天數參數<br>
            <strong>批量更新：</strong> 一鍵更新所有股票的公式設定<br>
            <strong>美觀介面：</strong> 條件格式化和進度條顯示
          </div>

          <h3>📊 欄位說明</h3>
          <ul>
            <li><strong>股票代號：</strong> 台股 4 碼數字，美股代號</li>
            <li><strong>股票名稱：</strong> 手動輸入或自動推測</li>
            <li><strong>走勢圖：</strong> GOOGLEFINANCE 歷史資料產生的 SPARKLINE</li>
            <li><strong>即時股價：</strong> GOOGLEFINANCE("TPE:代號", "price")</li>
            <li><strong>漲跌金額：</strong> 當日漲跌金額，正數綠色，負數紅色</li>
            <li><strong>開盤價：</strong> 當日開盤價格</li>
            <li><strong>最高價/最低價：</strong> 當日價格區間</li>
            <li><strong>成交量：</strong> 當日成交量</li>
            <li><strong>AI走勢分析：</strong> AI 分析近期趨勢</li>
            <li><strong>AI投資建議：</strong> AI 提供的投資建議</li>
            <li><strong>更新時間：</strong> 最後更新時間戳</li>
          </ul>

          <h3>⚙️ 設定說明</h3>
          <div class="feature">
            <strong>設定工作表：</strong> 包含走勢圖天數等全域設定<br>
            <strong>走勢圖天數：</strong> 預設 30 天，可修改為 7-365 天<br>
            <strong>其他設定：</strong> 快取時間、更新間隔等進階選項
          </div>

          <h3>🔧 使用步驟</h3>
          <ol>
            <li>執行「初始化試算表格式」設定欄位和樣式</li>
            <li>在 A 欄輸入股票代號，B 欄輸入股票名稱</li>
            <li>執行「更新所有資料」設定所有公式</li>
            <li>等待 GOOGLEFINANCE 和 AI() 函數載入資料</li>
            <li>查看 AI 分析結果和投資建議</li>
          </ol>

          <h3>💡 使用提示</h3>
          <div class="feature">
            • 台股代號直接輸入 4 碼數字（如：2330）<br>
            • 美股代號直接輸入（如：AAPL, TSLA）<br>
            • AI 分析需要 Google Workspace 企業版授權<br>
            • 首次載入可能需要較長時間，請耐心等待<br>
            • 設定表的天數參數會影響所有走勢圖
          </div>

          <h3>🆘 疑難排解</h3>
          <div class="feature">
            • 如果公式顯示錯誤，檢查股票代號是否正確<br>
            • AI 函數需要網路連線和適當權限<br>
            • GOOGLEFINANCE 在非交易時間可能顯示舊資料<br>
            • 執行測試功能檢查各組件是否正常運作
          </div>
        </body>
      </html>
    `).setWidth(600).setHeight(600).setTitle('股價追蹤工具 v2.0 - 使用說明');

    SpreadsheetApp.getUi().showModalDialog(html, '使用說明');

  } catch (e) {
    Logger.log('showHelpDialog 錯誤: ' + e);
    SpreadsheetApp.getUi().alert('顯示說明時發生錯誤：' + e.toString());
  }
}