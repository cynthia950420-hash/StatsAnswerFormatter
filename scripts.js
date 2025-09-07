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
      : clsInp.value.trim();
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
      status.textContent =
        "請填寫班級／姓名／學號，才可下載。 Please fill in your class, name, and student ID before downloading.";
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

  downloadBtn.addEventListener("click", async () => {
    try {
      // 使用 trim() 移除前後空白
      const cls = getClsValue().trim();
      const name = nameInp.value.trim();
      const sid = sidInp.value.trim();
      const ans = ansInp.value;

      // 使用 JSZip 建立 DOCX 檔案
      const zip = new JSZip();

      // 建立主要文件內容
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:t>${cls}_${sid}_${name}</w:t></w:r>
    </w:p>
    ${ans
      .split("\n")
      .map(
        (line) =>
          `<w:p><w:r><w:t>${line
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</w:t></w:r></w:p>`
      )
      .join("")}
  </w:body>
</w:document>`;

      // 添加必要檔案
      zip.file("word/document.xml", documentXml);
      zip.file(
        "[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
      );

      zip.file(
        "_rels/.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
      );

      zip.file(
        "word/_rels/document.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
      );

      // 產生並下載檔案
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `${cls}_${sid}_${name}.docx`;
      link.click();
    } catch (error) {
      console.error("下載失敗:", error);
      alert("下載失敗：" + error.message);
    }
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
