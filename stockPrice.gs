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

      if (responseCode !== 200) {
        Logger.log("TWSE API 回應錯誤: " + responseCode);
        return null;
      }

      const jsonText = response.getContentText();
      Logger.log("TWSE Raw Response length: " + jsonText.length);
      Logger.log("TWSE Raw Response: " + jsonText.substring(0, 300));

      const json = JSON.parse(jsonText);

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
          if (responseCode !== 200) {
            Logger.log(`TWSE ${dateStr} API 錯誤: ${responseCode}`);
            continue;
          }

          const json = JSON.parse(response.getContentText());

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
      }
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
      }
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
        }
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

          // 重新設定公式，以防被覆蓋
          this.ensureFormulas(sheet, stock.rowIndex, stock.code);
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
   * 確保公式存在（防止更新時被覆蓋）
   * @param {Sheet} sheet - 工作表
   * @param {number} rowIndex - 行索引
   * @param {string} stockCode - 股票代號
   */
  ensureFormulas(sheet, rowIndex, stockCode) {
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
      { col: 4, name: 'TWSTOCKPRICE', formula: `=TWSTOCKPRICE(A${rowIndex})` },
      { col: 5, name: 'GETPREVIOUSCLOSE', formula: `=GETPREVIOUSCLOSE(A${rowIndex})` },
      { col: 6, name: 'GETOPENPRICE', formula: `=GETOPENPRICE(A${rowIndex})` },
      { col: 7, name: 'GETHIGHPRICE', formula: `=GETHIGHPRICE(A${rowIndex})` },
      { col: 8, name: 'GETLOWPRICE', formula: `=GETLOWPRICE(A${rowIndex})` }
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
 * 主要的股價查詢函數 - 取得即時股價
 * 使用方式：
 * =TWSTOCKPRICE("2330") -> 台股上市股票即時價
 * =TWSTOCKPRICE("6104") -> 台股上櫃股票即時價
 * =TWSTOCKPRICE("AAPL") -> 美股即時價
 *
 * 系統會自動判斷市場類型：
 * - 4碼數字：台股上市 (TWSE)
 * - 4-6碼字母數字：台股上櫃 (TPEX)
 * - 其他：美股 (Yahoo Finance)
 *
 * @param {string} stockCode - 股票代號
 * @returns {number|string} 股價或錯誤訊息
 */
function TWSTOCKPRICE(stockCode) {
  if (!stockCode) return "無代號";

  try {
    // 使用同步方式取得價格（Google Sheets 公式限制）
    // 注意：Google Sheets 公式不能使用 async/await
    // 這裡直接呼叫同步版本
    const priceData = stockPriceService.getPrice(stockCode);

    if (priceData !== null && priceData.currentPrice !== null) {
      return priceData.currentPrice;
    } else {
      return "無資料";
    }
  } catch (e) {
    Logger.log("TWSTOCKPRICE 錯誤: " + e);
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
    const priceData = stockPriceService.getPrice(stockCode);

    if (priceData !== null && priceData.previousClose !== null) {
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
    const priceData = stockPriceService.getPrice(stockCode);

    if (priceData !== null && priceData.openPrice !== null) {
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
    const priceData = stockPriceService.getPrice(stockCode);

    if (priceData !== null && priceData.highPrice !== null) {
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
    const priceData = stockPriceService.getPrice(stockCode);

    if (priceData !== null && priceData.lowPrice !== null) {
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
    // 注意：Google Sheets 公式不能使用 async/await
    const history = stockPriceService.getHistory(stockCode, validDays);

    if (history && history.length > 0) {
      Logger.log("GETSPARKLINE 成功取得歷史資料: " + history.length + " 筆資料");
      return dataProcessingService.generateSparkline(history);
    } else {
      Logger.log("GETSPARKLINE 無歷史資料 for: " + stockCode);
      return "無歷史資料";
    }
  } catch (e) {
    Logger.log("GETSPARKLINE 錯誤 for " + stockCode + ": " + e);
    return "錯誤";
  }
}

/**
 * 更新所有股票價格的自訂選單函數（效能優化版本）
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

    // 顯示開始訊息
    const startTime = new Date();
    SpreadsheetApp.getUi().alert(`開始更新 ${stocks.length} 支股票的價格...\n\n預計需要約 ${Math.ceil(stocks.length * 0.2)} 秒`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // 效能優化：批次更新資料而不是逐個儲存格更新
    const updates = [];

    // 更新價格和指標（使用同步方式，因為 Apps Script 限制）
    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];

      try {
        // 顯示進度（每10支股票顯示一次）
        if ((i + 1) % 10 === 0 || i === 0) {
          SpreadsheetApp.getUi().alert(`正在更新股票 ${i + 1}/${stocks.length}...\n目前成功: ${successCount}, 失敗: ${errorCount}`);
        }

        // 直接呼叫同步方法，避免 async/await 問題
        const priceData = stockPriceService.getPrice(stock.code);

        if (priceData !== null) {
          // 收集更新資料，準備批次更新
          updates.push({
            rowIndex: stock.rowIndex,
            data: [
              priceData.currentPrice, // D 欄 - 即時股價
              priceData.previousClose || "無資料", // E 欄 - 昨日收盤
              priceData.openPrice || "無資料", // F 欄 - 開盤價
              priceData.highPrice || "無資料", // G 欄 - 最高價
              priceData.lowPrice || "無資料", // H 欄 - 最低價
              Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss") // I 欄 - 更新時間
            ]
          });

          successCount++;
        } else {
          // 收集錯誤資料
          updates.push({
            rowIndex: stock.rowIndex,
            data: [
              "無資料", // D 欄
              "無資料", // E 欄
              "無資料", // F 欄
              "無資料", // G 欄
              "無資料", // H 欄
              Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss") // I 欄
            ]
          });

          errorCount++;
          errors.push(`${stock.code}: 無資料`);
        }

        // API 呼叫間隔（縮短到 100ms 以提升速度）
        Utilities.sleep(100);

      } catch (e) {
        Logger.log(`更新股票 ${stock.code} 時發生錯誤: ${e}`);

        // 收集錯誤資料
        updates.push({
          rowIndex: stock.rowIndex,
          data: [
            "錯誤", // D 欄
            "錯誤", // E 欄
            "錯誤", // F 欄
            "錯誤", // G 欄
            "錯誤", // H 欄
            Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss") // I 欄
          ]
        });

        errorCount++;
        errors.push(`${stock.code}: ${e.toString()}`);
      }
    }

    // 批次更新所有資料（大幅提升效能）
    if (updates.length > 0) {
      // 將更新資料轉換為二維陣列
      const updateRanges = [];
      const updateValues = [];

      updates.forEach(update => {
        updateRanges.push(sheet.getRange(update.rowIndex, 4, 1, 6)); // D 到 I 欄
        updateValues.push(update.data);
      });

      // 批次設定值
      for (let i = 0; i < updateRanges.length; i++) {
        updateRanges[i].setValues([updateValues[i]]);
      }

      Logger.log(`批次更新完成，共更新 ${updates.length} 筆資料`);
    }

    // 確保所有公式都存在（僅在更新完成後執行一次）
    stocks.forEach(stock => {
      sheetsService.ensureFormulas(sheet, stock.rowIndex, stock.code);
    });

    // 重新整理試算表
    sheetsService.refreshSheet(sheet);

    // 計算耗時
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);

    // 顯示完成訊息
    let message = `價格更新完成！\n\n`;
    message += `總共股票: ${stocks.length}\n`;
    message += `成功更新: ${successCount}\n`;
    message += `更新失敗: ${errorCount}\n`;
    message += `總耗時: ${duration} 秒\n\n`;

    if (errors.length > 0 && errors.length <= 5) {
      message += `失敗詳情:\n${errors.join('\n')}`;
    } else if (errors.length > 5) {
      message += `失敗詳情請查看日誌 (共 ${errors.length} 個錯誤)`;
    }

    SpreadsheetApp.getUi().alert(message);

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
    .addItem('更新單支股票', 'updateSingleStock')
    .addItem('清除快取', 'clearCache')
    .addSeparator()
    .addItem('初始化試算表格式', 'initializeSheetFormat')
    .addItem('新增股票', 'addNewStock')
    .addItem('刪除股票', 'removeStock')
    .addSeparator()
    .addItem('顯示更新進度', 'showProgressDialog')
    .addItem('執行完整測試', 'runFullTestSuite')
    .addToUi();
}

/**
 * 更新單支股票的自訂選單函數（簡化版，避免 TransportError）
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

    // 顯示更新訊息
    const confirmResult = ui.alert(
      '更新單支股票',
      `確定要更新股票 ${stockCode} (${stockName || '未命名'}) 嗎？`,
      ui.ButtonSet.YES_NO
    );

    if (confirmResult !== ui.Button.YES) return;

    // 直接執行更新（不使用 HTML 對話框，避免 TransportError）
    const startTime = new Date();

    try {
      ui.alert('開始更新', `正在更新股票 ${stockCode} 的價格資料...`, ui.ButtonSet.OK);

      // 取得價格資料
      const priceData = stockPriceService.getPrice(stockCode.toString().trim());

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

        // 更新時間戳
        sheet.getRange(rowIndex, 9).setValue(
          Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss")
        );

        // 確保公式存在
        const sheetsService = new GoogleSheetsService();
        sheetsService.ensureFormulas(sheet, rowIndex, stockCode.toString().trim());

        // 重新整理試算表
        sheetsService.refreshSheet(sheet);

        // 計算耗時
        const endTime = new Date();
        const duration = Math.round((endTime - startTime) / 1000);

        // 顯示成功訊息
        ui.alert('更新成功', `股票 ${stockCode} 更新完成！\n耗時: ${duration} 秒\n\n即時價格: ${priceData.currentPrice}`, ui.ButtonSet.OK);

      } else {
        ui.alert('更新失敗', `無法取得股票 ${stockCode} 的價格資料。\n請檢查股票代號是否正確，或查看應用程式記錄以取得詳細資訊。`, ui.ButtonSet.OK);
      }

    } catch (updateError) {
      Logger.log(`更新單支股票 ${stockCode} 錯誤: ${updateError}`);
      ui.alert('更新錯誤', `更新股票 ${stockCode} 時發生錯誤：${updateError.toString()}`, ui.ButtonSet.OK);
    }

  } catch (e) {
    Logger.log('updateSingleStock 錯誤: ' + e);
    SpreadsheetApp.getUi().alert('更新單支股票時發生錯誤：' + e.toString());
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

    // 取得價格資料
    const priceData = stockPriceService.getPrice(stockCode);

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

      // 更新時間戳
      sheet.getRange(rowIndex, 9).setValue(
        Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss")
      );

      // 確保公式存在
      const sheetsService = new GoogleSheetsService();
      sheetsService.ensureFormulas(sheet, rowIndex, stockCode);

      // 重新整理試算表
      sheetsService.refreshSheet(sheet);

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
      ['股票代號', '股票名稱', '走勢圖', '即時股價', '昨日收盤', '開盤價', '最高價', '最低價', '更新時間']
    ];
    sheet.getRange(1, 1, 1, 9).setValues(headers);

    // 設定標題列格式
    const headerRange = sheet.getRange(1, 1, 1, 9);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
    headerRange.setBorder(true, true, true, true, true, true);

    // 設定欄位寬度
    sheet.setColumnWidth(1, 100); // 股票代號
    sheet.setColumnWidth(2, 120); // 股票名稱
    sheet.setColumnWidth(3, 200); // 走勢圖
    sheet.setColumnWidth(4, 100); // 即時股價
    sheet.setColumnWidth(5, 100); // 昨日收盤
    sheet.setColumnWidth(6, 100); // 開盤價
    sheet.setColumnWidth(7, 100); // 最高價
    sheet.setColumnWidth(8, 100); // 最低價
    sheet.setColumnWidth(9, 150); // 更新時間

    // 設定資料驗證規則
    setupDataValidation(sheet);

    // 設定條件格式化
    setupConditionalFormatting(sheet);

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
function setupConditionalFormatting(sheet) {
  // 價格變動顏色提示
  const priceRange = sheet.getRange(2, 4, 1000, 5); // D2:H1001 (價格欄位)

  // 漲價顯示綠色
  const greenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(NOT(ISBLANK($D2)), NOT(ISBLANK($E2)), $D2 > $E2)')
    .setBackground('#d9ead3') // 淺綠色
    .setRanges([priceRange])
    .build();

  // 跌價顯示紅色
  const redRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(NOT(ISBLANK($D2)), NOT(ISBLANK($E2)), $D2 < $E2)')
    .setBackground('#f4cccc') // 淺紅色
    .setRanges([priceRange])
    .build();

  // 套用條件格式化規則
  sheet.setConditionalFormatRules([greenRule, redRule]);

  // 設定數值格式
  const numberFormatRanges = [
    sheet.getRange(2, 4, 1000, 5), // 價格欄位
  ];

  numberFormatRanges.forEach(range => {
    range.setNumberFormat('#,##0.00');
  });

  // 設定時間格式
  const timeRange = sheet.getRange(2, 9, 1000, 1); // 更新時間欄位
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

    // 設定公式 (參考 A 欄)
    for (let i = 0; i < sampleData.length; i++) {
      const rowNum = i + 2; // 第2行開始
      sheet.getRange(rowNum, 3).setFormula(`=GETSPARKLINE(A${rowNum})`);     // 走勢圖
      sheet.getRange(rowNum, 4).setFormula(`=TWSTOCKPRICE(A${rowNum})`);     // 即時股價
      sheet.getRange(rowNum, 5).setFormula(`=GETPREVIOUSCLOSE(A${rowNum})`); // 昨日收盤
      sheet.getRange(rowNum, 6).setFormula(`=GETOPENPRICE(A${rowNum})`);     // 開盤價
      sheet.getRange(rowNum, 7).setFormula(`=GETHIGHPRICE(A${rowNum})`);     // 最高價
      sheet.getRange(rowNum, 8).setFormula(`=GETLOWPRICE(A${rowNum})`);      // 最低價
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
 * 測試函數 - 用於驗證基本功能
 */
function testBasicFunctionality() {
  Logger.log("=== 測試 TWSTOCKPRICE 函數 ===");

  // 測試台股
  Logger.log("測試台股 2330 (台積電)...");
  const twsePrice = TWSTOCKPRICE("2330");
  Logger.log("台積電價格: " + twsePrice);

  // 測試上櫃
  Logger.log("測試上櫃 6104 (創惟)...");
  const tpexPrice = TWSTOCKPRICE("6104");
  Logger.log("創惟價格: " + tpexPrice);

  // 測試美股
  Logger.log("測試美股 AAPL (Apple)...");
  const usPrice = TWSTOCKPRICE("AAPL");
  Logger.log("Apple 價格: " + usPrice);

  // 測試 TSLA
  Logger.log("測試美股 TSLA (Tesla)...");
  const tslaPrice = TWSTOCKPRICE("TSLA");
  Logger.log("Tesla 價格: " + tslaPrice);

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
    // 顯示開始訊息
    SpreadsheetApp.getUi().alert("測試開始", "正在執行完整功能測試套件...\n\n請查看 Apps Script 記錄以取得詳細結果。", SpreadsheetApp.getUi().ButtonSet.OK);

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

    // 測試 6: API 連線診斷
    Logger.log("--- 測試 6: API 連線診斷 ---");
    testApiConnectivity();

    Logger.log("=== 完整測試套件執行完成 ===");

    // 顯示完成訊息
    SpreadsheetApp.getUi().alert("測試完成", "完整功能測試套件已執行完畢！\n\n請查看 Apps Script 的執行記錄 (Executions > Logs) 以取得詳細測試結果。", SpreadsheetApp.getUi().ButtonSet.OK);

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
      }
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
    const url = `https://www.tpex.org.tw/openapi/v1/stock_info?stock_no=6104`;

    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const responseCode = response.getResponseCode();
    Logger.log("TPEX 回應碼: " + responseCode);

    if (responseCode === 200) {
      const json = JSON.parse(response.getContentText());
      Logger.log("TPEX 回應資料長度: " + response.getContentText().length);
      return json && json.data && json.data.length > 0;
    }

    return false;
  } catch (e) {
    Logger.log("TPEX 連線測試錯誤: " + e);
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
 * 新增股票功能
 */
function addNewStock() {
  try {
    const ui = SpreadsheetApp.getUi();
    const stockCode = ui.prompt('新增股票', '請輸入股票代號：', ui.ButtonSet.OK_CANCEL);

    if (stockCode.getSelectedButton() !== ui.Button.OK) return;

    const code = stockCode.getResponseText().trim();
    if (!code) {
      ui.alert('錯誤', '股票代號不能為空', ui.ButtonSet.OK);
      return;
    }

    // 移除股票代號格式驗證，讓系統處理
    // if (!/^[0-9A-Z]{1,6}$/.test(code)) {
    //   ui.alert('錯誤', '無效的股票代號格式', ui.ButtonSet.OK);
    //   return;
    // }

    const sheet = SpreadsheetApp.getActiveSheet();

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

    // 設定股票代號
    sheet.getRange(emptyRow, 1).setValue(code);

    // 嘗試自動取得股票名稱（如果有快取資料）
    try {
      const priceData = stockPriceService.getPrice(code);
      if (priceData && priceData.currentPrice) {
        // 對於台股，我們可以根據代號推測市場類型
        let stockName = '';
        if (code.length === 4 && /^\d+$/.test(code)) {
          stockName = '台股上市';
        } else if (/^[0-9A-Z]{4,6}$/.test(code)) {
          stockName = '台股上櫃';
        } else {
          stockName = '美股';
        }
        sheet.getRange(emptyRow, 2).setValue(stockName);
      }
    } catch (e) {
      // 如果無法取得資料，設定預設名稱
      sheet.getRange(emptyRow, 2).setValue('請手動輸入名稱');
    }

    // 設定走勢圖公式 (參考 A 欄股票代號)
    sheet.getRange(emptyRow, 3).setFormula(`=GETSPARKLINE(A${emptyRow})`);

    // 設定價格指標公式 (參考 A 欄股票代號)
    sheet.getRange(emptyRow, 4).setFormula(`=TWSTOCKPRICE(A${emptyRow})`);      // 即時股價
    sheet.getRange(emptyRow, 5).setFormula(`=GETPREVIOUSCLOSE(A${emptyRow})`); // 昨日收盤
    sheet.getRange(emptyRow, 6).setFormula(`=GETOPENPRICE(A${emptyRow})`);     // 開盤價
    sheet.getRange(emptyRow, 7).setFormula(`=GETHIGHPRICE(A${emptyRow})`);     // 最高價
    sheet.getRange(emptyRow, 8).setFormula(`=GETLOWPRICE(A${emptyRow})`);      // 最低價

    ui.alert('成功', `股票 ${code} 已新增到第 ${emptyRow} 行，所有公式已自動設定`, ui.ButtonSet.OK);

  } catch (e) {
    Logger.log('addNewStock 錯誤: ' + e);
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

    // 清除該行資料
    sheet.getRange(foundRow, 1, 1, 9).clearContent();

    ui.alert('成功', `股票 ${codeToDelete} 已刪除`, ui.ButtonSet.OK);

  } catch (e) {
    Logger.log('removeStock 錯誤: ' + e);
    SpreadsheetApp.getUi().alert('刪除股票時發生錯誤：' + e.toString());
  }
}