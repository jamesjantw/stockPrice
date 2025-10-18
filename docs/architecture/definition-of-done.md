# Definition of Done (完成的定義)

**版本:** 1.0
**日期:** 2025-09-20

---

## 介紹

本文件定義了在 Windows RPA 專案中，一個使用者故事 (User Story) 或任務被視為「完成」所需滿足的標準清單。所有團隊成員 (PM, Dev, QA) 都應遵守此標準，以確保交付的品質與一致性。

---

## 通用標準 (General Criteria)

- [ ] **程式碼完成 (Code Complete):** 所有相關的程式碼都已撰寫完成。
- [ ] **符合編碼標準 (Coding Standards):** 程式碼遵循 `docs/architecture/coding-standards.md` 中定義的所有規範。
- [ ] **同儕審核 (Peer Reviewed):** 程式碼已經過至少一位其他開發人員的審核 (Code Review)，並已處理所有回饋。
- [ ] **沒有已知的錯誤 (No Known Bugs):** 在交付當下，沒有任何與此 Story 相關的已知錯誤。

---

## 後端 (Backend)

- [ ] **單元測試通過 (Unit Tests Pass):** 針對新或修改的業務邏輯，已撰寫單元測試，且所有測試案例皆已通過。
- [ ] **整合測試通過 (Integration Tests Pass):** 相關的 API 端點或模組互動，已有整合測試覆蓋，且所有測試案例皆已通過。
- [ ] **API 文件更新 (API Docs Updated):** 若有新增或修改 API，相關的 API 文件 (例如 Swagger/OpenAPI) 已同步更新。
- [ ] **資料庫遷移 (Migrations):** 若有資料庫結構變更，已產生對應的 Django migration 檔案。

---

## 前端 (Frontend)

- [ ] **單元測試通過 (Unit Tests Pass):** 針對新的 Pinia stores、composables 或複雜的業務邏輯，已撰寫單元測試，且所有測試案例皆已通過。
- [ ] **元件測試通過 (Component Tests Pass):** 針對新的 Vue 元件，已撰寫元件測試，確保其 props、events 與 slots 運作正常。
- [ ] **Linter / Formatter 通過:** 所有程式碼都已通過 Linter (Ruff/ESLint) 檢查，且已使用 Formatter (Prettier) 格式化。
- [ ] **瀏覽器相容性 (Browser Compatibility):** 在專案指定的目標瀏覽器 (最新版的 Chrome, Firefox, Edge) 上功能正常。

---

## QA / 測試

- [ ] **QA 審核通過 (QA Reviewed):** QA 人員已完成程式碼審核。
- [ ] **測試案例撰寫 (Test Cases Written):** 已根據驗收標準 (Acceptance Criteria) 撰寫測試案例。
- [ ] **手動測試通過 (Manual Testing Passed):** QA 人員或指定測試者已根據測試案例完成手動測試，且所有案例皆已通過。
- [ ] **響應式 UI 檢查 (Responsive UI Check):** **(From STORY-105)** 已在模擬的手機、平板和桌面視圖中，確認 UI 佈局與功能皆正常。

---

## 部署與交付 (Deployment & Delivery)

- [ ] **建置成功 (Build Successful):** 專案可以成功建置/打包，沒有任何錯誤。
- [ ] **合併至主幹 (Merged to Develop):** 功能分支已成功合併至 `develop` 分支。
