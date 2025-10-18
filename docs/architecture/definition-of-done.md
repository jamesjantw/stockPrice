# Definition of Done (完成的定義)

**版本:** 1.0
**日期:** 2025-10-18

---

## 介紹

本文件定義了在股價追蹤工具專案中，一個使用者故事 (User Story) 或任務被視為「完成」所需滿足的標準清單。所有團隊成員 (PM, Dev, QA) 都應遵守此標準，以確保交付的品質與一致性。

---

## 通用標準 (General Criteria)

- [ ] **程式碼完成 (Code Complete):** 所有相關的程式碼都已撰寫完成。
- [ ] **符合編碼標準 (Coding Standards):** 程式碼遵循 `docs/architecture/coding-standards.md` 中定義的所有規範。
- [ ] **同儕審核 (Peer Reviewed):** 程式碼已經過至少一位其他開發人員的審核 (Code Review)，並已處理所有回饋。
- [ ] **沒有已知的錯誤 (No Known Bugs):** 在交付當下，沒有任何與此 Story 相關的已知錯誤。

---

## Apps Script (Backend)

- [ ] **單元測試通過 (Unit Tests Pass):** 針對新或修改的業務邏輯，已撰寫單元測試，且所有測試案例皆已通過。
- [ ] **整合測試通過 (Integration Tests Pass):** 相關的 API 呼叫和 Google Sheets 互動，已有整合測試覆蓋，且所有測試案例皆已通過。
- [ ] **函數文件更新 (Function Docs Updated):** 若有新增或修改公開函數，相關的 JSDoc 文件已同步更新。
- [ ] **快取策略驗證 (Cache Strategy Validated):** 快取機制正常運作，不會過度呼叫外部 API。

---

## Google Sheets (UI/UX)

- [ ] **公式測試通過 (Formula Tests Pass):** 針對新的試算表公式，已驗證在各種輸入情況下的正確性。
- [ ] **介面測試通過 (Interface Tests Pass):** 試算表欄位格式和資料驗證規則正常運作。
- [ ] **Linter / Formatter 通過:** 所有程式碼都已通過 ESLint 檢查，且已使用 Prettier 格式化。
- [ ] **Sheets 相容性 (Sheets Compatibility):** 在 Google Sheets 網頁版和應用程式上功能正常。

---

## QA / 測試

- [ ] **QA 審核通過 (QA Reviewed):** QA 人員已完成程式碼和功能審核。
- [ ] **測試案例撰寫 (Test Cases Written):** 已根據驗收標準 (Acceptance Criteria) 撰寫測試案例。
- [ ] **手動測試通過 (Manual Testing Passed):** QA 人員或指定測試者已根據測試案例完成手動測試，且所有案例皆已通過。
- [ ] **Sheets 功能檢查 (Sheets Functionality Check):** 在 Google Sheets 中驗證所有公式和功能正常運作。

---

## 部署與交付 (Deployment & Delivery)

- [ ] **Apps Script 部署成功 (Apps Script Deploy Successful):** 程式碼可以成功推送到 Google Apps Script，沒有語法錯誤。
- [ ] **合併至主幹 (Merged to Main):** 功能分支已成功合併至 `main` 分支。
