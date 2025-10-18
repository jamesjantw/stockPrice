# Google App Script - 編碼標準 (Coding Standards)

**版本:** 1.0
**作者:** James (Developer)
**日期:** 2025-10-18

## 1. 介紹 (Introduction)

本文件定義了 Google App Script 開發的編碼標準、風格指南與最佳實踐。所有開發人員都應遵守本文件，以確保程式碼的可讀性、一致性與可維護性。

---

## 2. 通用原則 (General Principles)

*   **清晰優於簡潔:** 程式碼首先是寫給人看的，其次才是給機器執行的。
*   **遵守 The Zen of Python:** 在終端機輸入 `import this`。
*   **DRY (Don't Repeat Yourself):** 避免重複的程式碼，盡可能地將其抽象化為可重用的函式或類別。
*   **KISS (Keep It Simple, Stupid):** 除非有充分的理由，否則應選擇最簡單直接的解決方案。
*   **請以正體中文回覆與文件撰寫** 
*   **內部工具** 請使用 read_file 取代 read_many_files, write_file 取代 replace
*   **修改前請請重新讀取檔案** 更新記憶 確保原有的功能不會被影響
*   **註解** 請加上 日期 agent人員 story task
*   **OS環境** Windows
*   **所有 Agent 角色** 請參考 docs/architecture/definition-of-done.md 理解 & align 相關定義
*   **處理方式與結果** 請詳實記錄 並更新文件狀態

---

### 2.1 Agent 執行清單（Mandatory for Agents）

以下清單為 Agent 在進行任何變更時「必須」遵循的具體步驟，確保可追蹤、可回溯、不中斷既有功能：

1) 準備階段
   - 使用 read_file 讀取將被修改的檔案與相鄰關聯檔案（避免猜測）。
   - 若需查找位置，先使用精確搜尋（grep 或 codebase_search），再讀取檔案。
   - 更新記憶（workspace memory）：紀錄關鍵規則或決策點。

2) 依循規範
   - 後端：PEP 8；提交前使用 Black/isort；靜態分析以 Ruff/Flake8 為準。

3) 變更實施
   - 變更前於目標檔案附近加入註記（日期/作者/Story/Task），例如：`/* 2025-09-22, James (DEV), STORY-107, TASK: ... */`。
   - 使用最小化編輯；避免無關重排。
   - 有待辦追蹤時，完成一步就更新 TODO 狀態。

4) 驗證與一致性
   - 針對剛修改的檔案執行 read_lints，修正 Lint 問題。

5) 文件同步
   - 如規範被細化或新增，立即更新：

6) 提交說明（Conventional Commits）
   - 依第 7.2 節規範撰寫摘要，能反映上述清單中的實作。

---

## 3. Python 後端標準

### 3.1. 風格與格式化

*   **風格指南:** 所有 Python 程式碼都必須遵循 **PEP 8** 風格指南。
*   **自動格式化:**
    *   **`Black`:** 我們使用 `Black` 來統一程式碼格式。在提交程式碼前，開發者應使用 `black .` 來格式化所有變更。
    *   **`isort`:** 我們使用 `isort` 來自動排序 `import` 語句。`isort` 會將 `import` 分為三組：標準函式庫、第三方套件、本地應用程式。
*   **Linter:**
    *   **`Ruff` / `Flake8`:** 專案使用 `Ruff` 或 `Flake8` 進行靜態分析，以捕捉潛在的錯誤和不符合規範的寫法。CI/CD 流程會強制執行 Lint 檢查。

### 3.2. 命名慣例 (Naming Conventions)

*   **變數 (variables):** `snake_case` (小寫蛇形命名)，例如 `project_cost`。
*   **函式 (functions):** `snake_case`，例如 `calculate_total_price()`。
*   **類別 (classes):** `PascalCase` (大寫駝峰命名)，例如 `ProjectFinancialsView`。
*   **常數 (constants):** `UPPER_SNAKE_CASE` (大寫蛇形命名)，例如 `DEFAULT_CURRENCY`。

### 3.3. 文件字串 (Docstrings)

*   所有公開的模組 (modules)、類別 (classes) 和函式 (functions) 都**必須**包含文件字串 (docstring)，並遵循 **PEP 257** 規範。
*   文件字串應簡潔地描述該單元的功能、參數 (Args) 和回傳值 (Returns)。

```python
def get_erp_project(project_id: str) -> dict:
    """從 ERP 系統中獲取單一專案的資料。

    Args:
        project_id: 專案在 ERP 系統中的唯一識別碼。

    Returns:
        一個包含專案詳細資料的字典。
    """
    # ... 程式碼 ...
```

---

## 4. 安全性 (Security)

*   **絕不提交密鑰:** 所有敏感資訊（`SECRET_KEY`, 資料庫密碼, API 金鑰等）都必須儲存在 `.env` 檔案中，並且 `.env` 檔案必須被列在 `.gitignore` 中。
*   **善用 Django 內建安全機制:**
    *   **SQL Injection:** 始終使用 Django ORM，絕不手動拼接 SQL 查詢字串。
    *   **XSS:** 預設情況下 Django 模板會進行 HTML 轉義。絕不在未經審查的情況下對使用者輸入使用 `|safe` 過濾器。
    *   **CSRF:** 確保所有 `POST` 表單都包含 `{% csrf_token %}`。

---

## 5. 測試 (Testing)

*   **框架:** 使用 `pytest-django` 作為主要的測試框架。
*   **位置:** 測試案例應放置在各個 App 的 `tests/` 目錄下。
*   **單元測試:** 專注於測試單一函式或類別的邏輯。應使用 `unittest.mock` 來模擬外部依賴（如 API 呼叫、資料庫）。
*   **整合測試:** 專注於測試 Django 元件之間的互動，例如 View 是否能成功渲染、API 是否能從資料庫中正確取回資料。

---

## 6. 版本控制 (Version Control)

### 6.1. 分支策略

我們採用 `GitFlow` 的簡化版：
*   `main`: 代表穩定、可隨時發布的版本。只接受來自 `develop` 分支的合併。
*   `develop`: 開發分支，整合所有已完成的功能。
*   `feature/<feature-name>`: 開發新功能的分支，基於 `develop` 建立，完成後合併回 `develop`。

### 6.2. Commit 訊息

我們遵循 **Conventional Commits** 規範，這有助於自動化版本管理和變更日誌的生成。

**格式:** `<type>[optional scope]: <description>`

*   **`feat`:** 新增功能 (feature)。
*   **`fix`:** 修復錯誤 (bug fix)。
*   **`docs`:** 只修改了文件。
*   **`style`:** 不影響程式碼意義的格式變更。
*   **`refactor`:** 既不是新增功能也不是修復錯誤的程式碼重構。
*   **`test`:** 新增或修改測試。

**範例:**
```
feat: Add user authentication via OIDC

fix: Correct calculation error in project cost analysis

docs: Update coding standards for Windows RPA
```
