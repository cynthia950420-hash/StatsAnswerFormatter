document.addEventListener("DOMContentLoaded", () => {
  const examId = document.title.replace(/[^\w]/g, "_");
  const clsInp = document.getElementById("cls");
  const clsOther = document.getElementById("cls-other"); // 新增：自訂班級輸入
  const nameInp = document.getElementById("name");
  const sidInp = document.getElementById("sid");
  const ansInp = document.getElementById("ans1");
  const downloadBtn = document.getElementById("downloadExamBtn");
  const status = document.getElementById("status");

  const instructionsBtn = document.getElementById("instructionsBtn");
  const modal = document.getElementById("instructionsModal");
  const closeModal = document.getElementById("closeModal");

  function getClsValue() {
    return clsInp.value === "other"
      ? (clsOther.value || "").trim()
      : clsInp.value;
  }
  function metaValid() {
    return getClsValue() && nameInp.value && /^\d+$/.test(sidInp.value);
  }

  function autoSave(e) {
    // 儲存單一欄位或全部（包含 cls-other）
    if (e && e.target && e.target.id) {
      localStorage.setItem(`${examId}_${e.target.id}`, e.target.value);
    } else {
      localStorage.setItem(`${examId}_cls`, clsInp.value);
      localStorage.setItem(
        `${examId}_cls-other`,
        clsOther ? clsOther.value : ""
      );
      localStorage.setItem(`${examId}_name`, nameInp.value);
      localStorage.setItem(`${examId}_sid`, sidInp.value);
      localStorage.setItem(`${examId}_ans1`, ansInp.value);
    }
    if (metaValid()) {
      downloadBtn.disabled = false;
      status.textContent =
        "已儲存於 LocalStorage (" + new Date().toLocaleTimeString() + ")";
    } else {
      downloadBtn.disabled = true;
      status.textContent = "請填寫班級／姓名／學號，才可下載。 Please fill in your class, name, and student ID before downloading.";
    }
  }

  // 初始化欄位（含 cls-other）
  const savedCls = localStorage.getItem(`${examId}_cls`);
  const savedClsOther = localStorage.getItem(`${examId}_cls-other`);
  const savedName = localStorage.getItem(`${examId}_name`);
  const savedSid = localStorage.getItem(`${examId}_sid`);
  const savedAns = localStorage.getItem(`${examId}_ans1`);
  if (savedCls) clsInp.value = savedCls;
  if (savedClsOther && clsOther) clsOther.value = savedClsOther;
  if (savedName) nameInp.value = savedName;
  if (savedSid) sidInp.value = savedSid;
  if (savedAns) ansInp.value = savedAns;

  // 根據 cls 值顯示/隱藏 clsOther
  function updateClsOtherVisibility() {
    if (!clsOther) return;
    if (clsInp.value === "other") {
      clsOther.classList.remove("hidden");
      clsOther.focus();
    } else {
      clsOther.classList.add("hidden");
    }
  }
  updateClsOtherVisibility();

  // 綁定事件（包含 clsOther）
  [clsInp, clsOther, nameInp, sidInp, ansInp].forEach((el) => {
    if (!el) return;
    const eventType = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(eventType, autoSave);
  });
  // cls 額外處理：顯示/隱藏 other 欄
  clsInp.addEventListener("change", () => {
    updateClsOtherVisibility();
    autoSave({ target: clsInp });
  });

  downloadBtn.addEventListener("click", () => {
    const cls = getClsValue();
    const name = nameInp.value;
    const sid = sidInp.value;
    const ans = ansInp.value
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    const staticHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>Age and Viewing Habits 考卷</title>
  <style>
    body { max-width: 800px; margin: 0 auto; font-family: sans-serif; padding: 1rem; }
    h1 { text-align: center; }
    .field { margin-bottom: 1rem; }
    label { display: inline-block; width: 80px; font-weight: bold; }
    span, p { display: inline-block; width: calc(100% - 90px); margin: 0; }
  </style>
</head>
<body>
  <h1>Age and Viewing Habits 考卷</h1>
  <div class="field"><label>班級：</label><span>${cls}</span></div>
  <div class="field"><label>姓名：</label><span>${name}</span></div>
  <div class="field"><label>學號：</label><span>${sid}</span></div>
  <hr>
  <div class="field"><label>作答區：</label><p>${ans}</p></div>
</body>
</html>`;
    const blob = new Blob([staticHtml], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${cls}_${sid}_${name}.html`;
    link.click();
  });

  // 注意事項按鈕與 Modal 邏輯
  instructionsBtn.addEventListener(
    "click",
    () => (modal.style.display = "block")
  );
  closeModal.addEventListener("click", () => (modal.style.display = "none"));
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
});
