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
   * 取得 TWSE 股價和完整指標
   * @param {string} stockCode - 股票代號
   * @returns {Promise<Object|null>} 價格指標物件或 null
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
        const priceData = {
          currentPrice: parseFloat(lastRow[6].replace(/,/g, "")), // 收盤價
          previousClose: parseFloat(lastRow[7].replace(/,/g, "")), // 昨收價
          openPrice: parseFloat(lastRow[5].replace(/,/g, "")), // 開盤價
          highPrice: parseFloat(lastRow[8].replace(/,/g, "")), // 最高價
          lowPrice: parseFloat(lastRow[9].replace(/,/g, "")), // 最低價
          volume: parseInt(lastRow[1].replace(/,/g, "")), // 成交量
          change: parseFloat(lastRow[7].replace(/,/g, "")) - parseFloat(lastRow[6].replace(/,/g, "")) // 漲跌價
        };

        // 驗證資料完整性
        if (isNaN(priceData.currentPrice)) return null;

        cacheManager.set(cacheKey, priceData);
        return priceData;
      }

      return null;
    } catch (e) {
      Logger.log("TWSE 錯誤: " + e);
      return null;
    }
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

      // 取得過去 N 天的資料
      for (let i = 0; i < days; i++) {
        const targetDate = new Date(endDate);
        targetDate.setDate(endDate.getDate() - i);

        // 跳過週末
        if (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
          continue;
        }

        const dateStr = Utilities.formatDate(targetDate, "GMT+8", "yyyyMMdd");
        const url = `${this.twseBaseUrl}/exchangeReport/STOCK_DAY?response=json&date=${dateStr}&stockNo=${stockCode}`;

        try {
          const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
          const json = JSON.parse(response.getContentText());

          if (json && json.data && json.data.length > 0) {
            const lastRow = json.data[json.data.length - 1];
            const closePrice = parseFloat(lastRow[6].replace(/,/g, ""));
            if (!isNaN(closePrice)) {
              prices.unshift(closePrice); // 從舊到新排序
            }
          }
        } catch (dayError) {
          // 單日資料錯誤，繼續下一個日期
          Logger.log(`取得 ${dateStr} 資料時發生錯誤: ${dayError}`);
        }

        // API 呼叫間隔，避免過度頻繁
        Utilities.sleep(100);
      }

      // 只保留最近的有效價格
      const validPrices = prices.slice(-days);
      cacheManager.set(cacheKey, validPrices);
      return validPrices;

    } catch (e) {
      Logger.log("TWSE 歷史資料錯誤: " + e);
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
      const url = `${this.tpexBaseUrl}/openapi/v1/stock_info?stock_no=${stockCode}`;

      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const json = JSON.parse(response.getContentText());

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

        // 驗證資料完整性
        if (isNaN(priceData.currentPrice)) return null;

        cacheManager.set(cacheKey, priceData);
        return priceData;
      }

      return null;
    } catch (e) {
      Logger.log("TPEX 錯誤: " + e);
      return null;
    }
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
      const url = `${this.yahooBaseUrl}/v8/finance/chart/${stockCode}`;

      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const json = JSON.parse(response.getContentText());

      if (json && json.chart && json.chart.result && json.chart.result[0]) {
        const result = json.chart.result[0];
        if (result.meta) {
          const meta = result.meta;
          const priceData = {
            currentPrice: meta.regularMarketPrice || null,
            previousClose: meta.previousClose || null,
            openPrice: meta.regularMarketOpen || null,
            highPrice: meta.regularMarketDayHigh || null,
            lowPrice: meta.regularMarketDayLow || null,
            volume: meta.regularMarketVolume || null,
            change: meta.regularMarketChange || null
          };

          // 驗證資料完整性
          if (isNaN(priceData.currentPrice)) return null;

          cacheManager.set(cacheKey, priceData);
          return priceData;
        }
      }

      return null;
    } catch (e) {
      Logger.log("Yahoo Finance 錯誤: " + e);
      return null;
    }
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
      // 計算日期範圍
      const endDate = Math.floor(Date.now() / 1000); // Unix timestamp
      const startDate = endDate - (days * 24 * 60 * 60); // N 天前

      const url = `${this.yahooBaseUrl}/v8/finance/chart/${stockCode}?period1=${startDate}&period2=${endDate}&interval=1d`;

      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const json = JSON.parse(response.getContentText());

      if (json && json.chart && json.chart.result && json.chart.result[0]) {
        const result = json.chart.result[0];
        if (result.indicators && result.indicators.quote && result.indicators.quote[0]) {
          const quotes = result.indicators.quote[0];
          const closes = quotes.close || [];

          // 過濾有效的價格資料
          const validPrices = closes.filter(price => price !== null && !isNaN(price));
          cacheManager.set(cacheKey, validPrices);
          return validPrices;
        }
      }

      return [];
    } catch (e) {
      Logger.log("Yahoo Finance 歷史資料錯誤: " + e);
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
   * 取得完整價格指標（回溯相容性）
   * @param {string} stockCode - 股票代號
   * @returns {Promise<number|null>} 股價或 null（僅為了回溯相容）
   */
  async getPriceOnly(stockCode) {
    const priceData = await this.getPrice(stockCode);
    return priceData ? priceData.currentPrice : null;
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
   * 更新股票價格和完整指標
   * @param {Sheet} sheet - 工作表
   * @param {Array} stocks - 股票清單
   */
  async updatePrices(sheet, stocks) {
    const now = new Date();
    const timestamp = Utilities.formatDate(now, "GMT+8", "yyyy-MM-dd HH:mm:ss");

    for (const stock of stocks) {
      try {
        const priceData = await stockPriceService.getPrice(stock.code);

        if (priceData !== null) {
          // 更新即時股價 (D 欄，index 4)
          sheet.getRange(stock.rowIndex, 4).setValue(priceData.currentPrice);

          // 更新昨日收盤價 (E 欄，index 5)
          if (priceData.previousClose !== null) {
            sheet.getRange(stock.rowIndex, 5).setValue(priceData.previousClose);
          }

          // 更新開盤價 (F 欄，index 6)
          if (priceData.openPrice !== null) {
            sheet.getRange(stock.rowIndex, 6).setValue(priceData.openPrice);
          }

          // 更新最高價 (G 欄，index 7)
          if (priceData.highPrice !== null) {
            sheet.getRange(stock.rowIndex, 7).setValue(priceData.highPrice);
          }

          // 更新最低價 (H 欄，index 8)
          if (priceData.lowPrice !== null) {
            sheet.getRange(stock.rowIndex, 8).setValue(priceData.lowPrice);
          }

          // 更新時間戳 (I 欄，index 9)
          sheet.getRange(stock.rowIndex, 9).setValue(timestamp);
        } else {
          // 設定為無資料
          sheet.getRange(stock.rowIndex, 4).setValue("無資料");
          sheet.getRange(stock.rowIndex, 5).setValue("無資料");
          sheet.getRange(stock.rowIndex, 6).setValue("無資料");
          sheet.getRange(stock.rowIndex, 7).setValue("無資料");
          sheet.getRange(stock.rowIndex, 8).setValue("無資料");
          sheet.getRange(stock.rowIndex, 9).setValue(timestamp);
        }

        // 避免 API 限制，加入小延遲
        Utilities.sleep(100);

      } catch (e) {
        Logger.log(`更新股票 ${stock.code} 時發生錯誤: ${e}`);
        sheet.getRange(stock.rowIndex, 4).setValue("錯誤");
        sheet.getRange(stock.rowIndex, 5).setValue("錯誤");
        sheet.getRange(stock.rowIndex, 6).setValue("錯誤");
        sheet.getRange(stock.rowIndex, 7).setValue("錯誤");
        sheet.getRange(stock.rowIndex, 8).setValue("錯誤");
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
 * 取得歷史走勢圖函數
 * 使用方式：
 * =GETSPARKLINE("2330") -> 產生走勢圖
 * =GETSPARKLINE("2330", 60) -> 60 天走勢圖
 *
 * @param {string} stockCode - 股票代號
 * @param {number} days - 天數 (預設 30)
 * @returns {string} SPARKLINE 公式或錯誤訊息
 */
function GETSPARKLINE(stockCode, days = 30) {
  if (!stockCode) return "無代號";

  try {
    // 驗證天數參數
    const validDays = Math.max(1, Math.min(365, parseInt(days) || 30));

    // 使用同步方式取得歷史資料（Google Sheets 公式限制）
    const history = stockPriceService.getHistory(stockCode, validDays);

    if (history && history.length > 0) {
      return dataProcessingService.generateSparkline(history);
    } else {
      return "無歷史資料";
    }
  } catch (e) {
    Logger.log("GETSPARKLINE 錯誤: " + e);
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

    // 更新價格和指標（使用同步方式，因為 Apps Script 限制）
    for (const stock of stocks) {
      try {
        const priceData = stockPriceService.getPrice(stock.code);

        if (priceData !== null) {
          // 更新即時股價 (D 欄)
          sheet.getRange(stock.rowIndex, 4).setValue(priceData.currentPrice);

          // 更新昨日收盤價 (E 欄)
          if (priceData.previousClose !== null) {
            sheet.getRange(stock.rowIndex, 5).setValue(priceData.previousClose);
          }

          // 更新開盤價 (F 欄)
          if (priceData.openPrice !== null) {
            sheet.getRange(stock.rowIndex, 6).setValue(priceData.openPrice);
          }

          // 更新最高價 (G 欄)
          if (priceData.highPrice !== null) {
            sheet.getRange(stock.rowIndex, 7).setValue(priceData.highPrice);
          }

          // 更新最低價 (H 欄)
          if (priceData.lowPrice !== null) {
            sheet.getRange(stock.rowIndex, 8).setValue(priceData.lowPrice);
          }

          // 更新時間戳 (I 欄)
          sheet.getRange(stock.rowIndex, 9).setValue(
            Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss")
          );
        } else {
          // 設定為無資料
          sheet.getRange(stock.rowIndex, 4).setValue("無資料");
          sheet.getRange(stock.rowIndex, 5).setValue("無資料");
          sheet.getRange(stock.rowIndex, 6).setValue("無資料");
          sheet.getRange(stock.rowIndex, 7).setValue("無資料");
          sheet.getRange(stock.rowIndex, 8).setValue("無資料");
          sheet.getRange(stock.rowIndex, 9).setValue(
            Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss")
          );
        }

        // API 呼叫間隔
        Utilities.sleep(200);

      } catch (e) {
        Logger.log(`更新股票 ${stock.code} 時發生錯誤: ${e}`);
        sheet.getRange(stock.rowIndex, 4).setValue("錯誤");
        sheet.getRange(stock.rowIndex, 5).setValue("錯誤");
        sheet.getRange(stock.rowIndex, 6).setValue("錯誤");
        sheet.getRange(stock.rowIndex, 7).setValue("錯誤");
        sheet.getRange(stock.rowIndex, 8).setValue("錯誤");
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
 * 完整功能測試套件
 */
function runFullTestSuite() {
  Logger.log("=== 股價追蹤工具完整測試套件開始 ===");

  try {
    // 測試 1: 基本功能
    Logger.log("--- 測試 1: 基本股價查詢 ---");
    testBasicFunctionality();

    // 測試 2: 完整價格指標
    Logger.log("--- 測試 2: 完整價格指標 ---");
    testPriceIndicators();

    // 測試 3: 歷史資料和走勢圖
    Logger.log("--- 測試 3: 歷史資料和走勢圖 ---");
    testHistoryAndSparkline();

    // 測試 4: 快取功能
    Logger.log("--- 測試 4: 快取功能 ---");
    testCacheFunctionality();

    // 測試 5: 錯誤處理
    Logger.log("--- 測試 5: 錯誤處理 ---");
    testErrorHandling();

    Logger.log("=== 完整測試套件執行完成 ===");

  } catch (e) {
    Logger.log("測試套件執行錯誤: " + e);
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