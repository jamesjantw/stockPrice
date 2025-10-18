/**
 * 股價追蹤工具 - Google Apps Script
 * 提供台股和美股的即時價格查詢和歷史走勢圖功能
 */

// ========== 核心服務類別 ==========

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

// 全域快取實例
const cacheManager = new CacheManager();

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
   * 取得 TWSE 股價
   * @param {string} stockCode - 股票代號
   * @returns {Promise<number|null>} 股價或 null
   */
  async getTWSEPrice(stockCode) {
    const cacheKey = `twse_${stockCode}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
      const today = Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd");
      const url = `${this.twseBaseUrl}/exchangeReport/STOCK_DAY?response=json&date=${today}&stockNo=${stockCode}`;

      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const json = JSON.parse(response.getContentText());

      if (json && json.data && json.data.length > 0) {
        const lastRow = json.data[json.data.length - 1];
        const closePrice = parseFloat(lastRow[6].replace(/,/g, ""));
        cacheManager.set(cacheKey, closePrice);
        return closePrice;
      }

      return null;
    } catch (e) {
      Logger.log("TWSE 錯誤: " + e);
      return null;
    }
  }

  /**
   * 取得 TPEX 股價
   * @param {string} stockCode - 股票代號
   * @returns {Promise<number|null>} 股價或 null
   */
  async getTPEXPrice(stockCode) {
    const cacheKey = `tpex_${stockCode}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
      const url = `${this.tpexBaseUrl}/openapi/v1/stock_info?stock_no=${stockCode}`;

      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const json = JSON.parse(response.getContentText());

      if (json && json.data && json.data.length > 0) {
        const lastRow = json.data[json.data.length - 1];
        const closePrice = parseFloat(lastRow[2].replace(/,/g, ""));
        cacheManager.set(cacheKey, closePrice);
        return closePrice;
      }

      return null;
    } catch (e) {
      Logger.log("TPEX 錯誤: " + e);
      return null;
    }
  }

  /**
   * 取得美股價格
   * @param {string} stockCode - 股票代號
   * @returns {Promise<number|null>} 股價或 null
   */
  async getUSPrice(stockCode) {
    const cacheKey = `us_${stockCode}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
      const url = `${this.yahooBaseUrl}/v8/finance/chart/${stockCode}`;

      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const json = JSON.parse(response.getContentText());

      if (json && json.chart && json.chart.result && json.chart.result[0]) {
        const result = json.chart.result[0];
        if (result.meta && result.meta.regularMarketPrice) {
          const price = result.meta.regularMarketPrice;
          cacheManager.set(cacheKey, price);
          return price;
        }
      }

      return null;
    } catch (e) {
      Logger.log("Yahoo Finance 錯誤: " + e);
      return null;
    }
  }

  /**
   * 根據股票代號判斷市場類型並取得價格
   * @param {string} stockCode - 股票代號
   * @returns {Promise<number|null>} 股價或 null
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
const stockPriceService = new StockPriceService();

// ========== Google Sheets 整合服務 ==========

/**
 * Google Sheets 整合服務 - 管理試算表操作
 */
class GoogleSheetsService {
  constructor() {
    this.spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
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
   * 更新股票價格
   * @param {Sheet} sheet - 工作表
   * @param {Array} stocks - 股票清單
   */
  async updatePrices(sheet, stocks) {
    const now = new Date();
    const timestamp = Utilities.formatDate(now, "GMT+8", "yyyy-MM-dd HH:mm:ss");

    for (const stock of stocks) {
      try {
        const price = await stockPriceService.getPrice(stock.code);

        if (price !== null) {
          // 更新價格 (D 欄，index 3)
          sheet.getRange(stock.rowIndex, 4).setValue(price);
          // 更新時間戳 (I 欄，index 9)
          sheet.getRange(stock.rowIndex, 9).setValue(timestamp);
        } else {
          // 設定為無資料
          sheet.getRange(stock.rowIndex, 4).setValue("無資料");
          sheet.getRange(stock.rowIndex, 9).setValue(timestamp);
        }

        // 避免 API 限制，加入小延遲
        Utilities.sleep(100);

      } catch (e) {
        Logger.log(`更新股票 ${stock.code} 時發生錯誤: ${e}`);
        sheet.getRange(stock.rowIndex, 4).setValue("錯誤");
      }
    }
  }

  /**
   * 重新整理試算表
   * @param {Sheet} sheet - 工作表
   */
  refreshSheet(sheet) {
    // 強制重新計算公式
    sheet.getDataRange().getFormulas().forEach((row, rowIndex) => {
      row.forEach((formula, colIndex) => {
        if (formula) {
          const range = sheet.getRange(rowIndex + 1, colIndex + 1);
          range.setFormula(formula);
        }
      });
    });
  }
}

// ========== 公開函數 ==========

/**
 * 主要的股價查詢函數
 * 使用方式：
 * =TWSTOCKPRICE("2330") -> 上市股票
 * =TWSTOCKPRICE("6104") -> 上櫃股票
 * =TWSTOCKPRICE("AAPL") -> 美股
 *
 * @param {string} stockCode - 股票代號
 * @returns {number|string} 股價或錯誤訊息
 */
function TWSTOCKPRICE(stockCode) {
  if (!stockCode) return "無代號";

  try {
    // 使用同步方式取得價格（Google Sheets 公式限制）
    const price = stockPriceService.getPrice(stockCode);

    if (price !== null) {
      return price;
    } else {
      return "無資料";
    }
  } catch (e) {
    Logger.log("TWSTOCKPRICE 錯誤: " + e);
    return "錯誤";
  }
}

/**
 * 更新所有股票價格的自訂選單函數
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

    // 顯示進度
    SpreadsheetApp.getUi().alert(`開始更新 ${stocks.length} 支股票的價格...`);

    // 更新價格（使用同步方式，因為 Apps Script 限制）
    for (const stock of stocks) {
      try {
        const price = stockPriceService.getPrice(stock.code);

        if (price !== null) {
          sheet.getRange(stock.rowIndex, 4).setValue(price);
          sheet.getRange(stock.rowIndex, 9).setValue(
            Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss")
          );
        } else {
          sheet.getRange(stock.rowIndex, 4).setValue("無資料");
          sheet.getRange(stock.rowIndex, 9).setValue(
            Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss")
          );
        }

        // API 呼叫間隔
        Utilities.sleep(200);

      } catch (e) {
        Logger.log(`更新股票 ${stock.code} 時發生錯誤: ${e}`);
        sheet.getRange(stock.rowIndex, 4).setValue("錯誤");
      }
    }

    // 重新整理試算表
    sheetsService.refreshSheet(sheet);

    SpreadsheetApp.getUi().alert("價格更新完成！");

  } catch (e) {
    Logger.log("updateAllPrices 錯誤: " + e);
    SpreadsheetApp.getUi().alert("更新過程中發生錯誤：" + e.toString());
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
 * 設定自訂選單
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('股價工具')
    .addItem('更新所有價格', 'updateAllPrices')
    .addItem('清除快取', 'clearCache')
    .addToUi();
}

/**
 * 測試函數 - 用於驗證基本功能
 */
function testBasicFunctionality() {
  Logger.log("測試 TWSTOCKPRICE 函數...");

  // 測試台股
  const twsePrice = TWSTOCKPRICE("2330");
  Logger.log("台積電價格: " + twsePrice);

  // 測試上櫃
  const tpexPrice = TWSTOCKPRICE("6104");
  Logger.log("創惟價格: " + tpexPrice);

  // 測試美股
  const usPrice = TWSTOCKPRICE("AAPL");
  Logger.log("Apple 價格: " + usPrice);

  Logger.log("基本功能測試完成");
}