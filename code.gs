const SHEET_ID = "1OwogGQUvhvP7BDyfWyRGW2rHbAy40ppx0Ftx6L36lng";
const SHEET_NAME = "Sheet1";
const CONFIG_SHEET_NAME = "Config";

const COL = {
  KEY: 1,
  DEVICE: 2,
  DAYS: 3,
  START_DATE: 4,
  ACTIVE: 5,
  LEVEL: 6,
  CREATED_AT: 7,
  EMAIL: 8,
  SENT: 9,
  PLAN: 10,
  AMOUNT: 11,
  ORDER_ID: 12,
  PAID: 13,
  TRANSACTION_ID: 14,
  PAID_AT: 15,
  RAW_WEBHOOK: 16
};

const HEADERS = [
  "key",
  "device",
  "days",
  "startDate",
  "active",
  "level",
  "createdAt",
  "email",
  "sent",
  "plan",
  "amount",
  "orderId",
  "paid",
  "transactionId",
  "paidAt",
  "rawWebhook"
];

const PLAN_CONFIG = {
  basic1: { days: 1, amount: 40000, level: "BASIC", label: "Dung thu 1 ngay" },
  basic7: { days: 7, amount: 99999999, level: "BASIC", label: "7 ngay" },
  pro1: { days: 30, amount: 495000, level: "PRO", label: "1 thang" },
  pro3: { days: 90, amount: 1289000, level: "PRO", label: "3 thang" },
  pre6: { days: 180, amount: 1899000, level: "PREMIUM", label: "6 thang" },
  lifetime: { days: 99999, amount: 3499000, level: "LIFETIME", label: "Vinh vien" }
};

function setupData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const oldMaintenance = sheet.getRange("G1").getValue() === true;
  const oldLock = sheet.getRange("G2").getValue() === true;

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);

  let config = ss.getSheetByName(CONFIG_SHEET_NAME);
  if (!config) config = ss.insertSheet(CONFIG_SHEET_NAME);

  const existing = config.getDataRange().getValues();
  if (existing.length === 0 || existing[0][0] !== "key") {
    config.clear();
    config.getRange(1, 1, 1, 3).setValues([["key", "value", "note"]]);
    config.getRange(2, 1, 4, 3).setValues([
      ["maintenance", oldMaintenance, "TRUE de bao tri he thong"],
      ["systemLock", oldLock, "TRUE de khoa he thong neu can"],
      ["webhookSecret", "", "Neu auto bank ho tro token, dien secret vao day"],
      ["mailFromName", "Timemark", "Ten hien thi trong email"]
    ]);
    config.setFrozenRows(1);
    config.autoResizeColumns(1, 3);
  }

  return "SETUP OK: Sheet1 + Config da san sang.";
}

function setupdata() {
  return setupData();
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = parsePostData(e);

    if (data.action === "checkLock") {
      return json({ status: "ok", lock: getConfigValue("systemLock", false) === true });
    }

    if (data.action === "createPending") {
      return json(createPending(data, sheet));
    }

    if (data.action === "checkPaid") {
      return json(checkPaid(data, sheet));
    }

    if (data.key) {
      return json(verifyKey(data, sheet));
    }

    const auto = paymentWebhook(data, sheet);
    if (auto) return json(auto);

    return json({ status: "ignored" });
  } catch (err) {
    return json({ status: "error", message: String(err) });
  }
}

function parsePostData(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return {};
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getConfigValue(key, fallback) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const config = ss.getSheetByName(CONFIG_SHEET_NAME);
  if (!config) return fallback;

  const rows = config.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) return rows[i][1];
  }
  return fallback;
}

function normalizePlan(plan) {
  return String(plan || "").trim().toLowerCase();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createPending(data, sheet) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const email = normalizeEmail(data.email);
    const plan = normalizePlan(data.plan);
    const cfg = PLAN_CONFIG[plan];
    const requestedAmount = Number(data.amount || 0);

    if (!isValidEmail(email)) {
      return { status: "fail", message: "Email khong hop le" };
    }

    if (!cfg) {
      return { status: "fail", message: "Goi khong hop le" };
    }

    if (requestedAmount && requestedAmount !== cfg.amount) {
      return { status: "fail", message: "So tien khong khop voi goi" };
    }

    const orderId = createOrderId(plan);
    sheet.appendRow([
      "", "", cfg.days, "", "", cfg.level, new Date(), email, "",
      plan, cfg.amount, orderId, false, "", "", ""
    ]);

    return {
      status: "ok",
      email,
      plan,
      amount: cfg.amount,
      days: cfg.days,
      level: cfg.level,
      orderId
    };
  } finally {
    lock.releaseLock();
  }
}

function checkPaid(data, sheet) {
  const orderId = normalizeOrderId(data.orderId);
  const email = normalizeEmail(data.email);
  const rows = sheet.getDataRange().getValues();

  if (orderId) {
    for (let i = rows.length - 1; i >= 1; i--) {
      if (normalizeOrderId(rows[i][COL.ORDER_ID - 1]) === orderId) {
        return {
          paid: !!rows[i][COL.KEY - 1],
          keySent: rows[i][COL.SENT - 1] === "DONE"
        };
      }
    }
    return { paid: false };
  }

  if (email) {
    for (let i = rows.length - 1; i >= 1; i--) {
      if (normalizeEmail(rows[i][COL.EMAIL - 1]) === email) {
        return {
          paid: !!rows[i][COL.KEY - 1],
          keySent: rows[i][COL.SENT - 1] === "DONE"
        };
      }
    }
  }

  return { paid: false };
}

function verifyKey(data, sheet) {
  const rows = sheet.getDataRange().getValues();
  const now = new Date();
  const maintenance = getConfigValue("maintenance", false) === true;

  for (let i = 1; i < rows.length; i++) {
    const rowKey = rows[i][COL.KEY - 1];
    const rowDevice = rows[i][COL.DEVICE - 1];
    const days = Number(rows[i][COL.DAYS - 1]) || 0;
    const start = rows[i][COL.START_DATE - 1];
    const active = rows[i][COL.ACTIVE - 1];
    const level = rows[i][COL.LEVEL - 1] || "PRO";

    if (rowKey === data.key) {
      if (maintenance) {
        return { status: "ok", maintenance: true, message: "He thong dang bao tri" };
      }

      if (active !== true) {
        return { status: "fail", message: "Key da bi khoa" };
      }

      if (rowDevice && rowDevice !== data.device) {
        return { status: "fail", message: "Key da kich hoat tren thiet bi khac" };
      }

      const startDate = start ? new Date(start) : now;

      if (!start) {
        sheet.getRange(i + 1, COL.DEVICE).setValue(data.device);
        sheet.getRange(i + 1, COL.START_DATE).setValue(startDate);
      }

      const expire = new Date(startDate);
      expire.setDate(expire.getDate() + days);

      if (now > expire) {
        return { status: "fail", message: "Key da het han" };
      }

      const daysLeft = Math.ceil((expire - now) / (1000 * 60 * 60 * 24));
      return {
        status: "ok",
        maintenance: false,
        level,
        type: days + " ngay",
        startDate,
        expireDate: expire,
        daysLeft
      };
    }
  }

  if (maintenance) {
    return { status: "ok", maintenance: true, message: "He thong dang bao tri" };
  }

  return { status: "fail", message: "Key khong ton tai" };
}

function paymentWebhook(data, sheet) {
  const secret = String(getConfigValue("webhookSecret", "") || "").trim();
  if (secret) {
    const received = String(data.secret || data.token || data.webhookSecret || "").trim();
    if (received !== secret) return;
  }

  const content = getPaymentContent(data);
  const orderId = findOrderId(content);
  if (!orderId) return;

  const paidAmount = getPaymentAmount(data);
  const transactionId = getTransactionId(data);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const rows = sheet.getDataRange().getValues();

    for (let i = rows.length - 1; i >= 1; i--) {
      const rowOrderId = normalizeOrderId(rows[i][COL.ORDER_ID - 1]);
      if (rowOrderId !== orderId) continue;

      const existingKey = rows[i][COL.KEY - 1];
      if (existingKey) {
        return { status: "ok", duplicate: true };
      }

      const plan = normalizePlan(rows[i][COL.PLAN - 1]);
      const cfg = PLAN_CONFIG[plan];
      const expectedAmount = Number(rows[i][COL.AMOUNT - 1] || (cfg && cfg.amount) || 0);

      if (!cfg) {
        return { status: "fail", message: "Plan khong hop le" };
      }

      if (!paidAmount || paidAmount < expectedAmount) {
        return { status: "fail", message: "So tien thanh toan khong du" };
      }

      const key = generateUniqueTMKey(sheet);
      const row = i + 1;

      sheet.getRange(row, COL.KEY).setValue(key);
      sheet.getRange(row, COL.DAYS).setValue(cfg.days);
      sheet.getRange(row, COL.ACTIVE).setValue(true);
      sheet.getRange(row, COL.LEVEL).setValue(cfg.level);
      sheet.getRange(row, COL.PAID).setValue(true);
      sheet.getRange(row, COL.TRANSACTION_ID).setValue(transactionId);
      sheet.getRange(row, COL.PAID_AT).setValue(new Date());
      sheet.getRange(row, COL.RAW_WEBHOOK).setValue(JSON.stringify(data).slice(0, 45000));

      try {
        sendKeyMailForRow(sheet, row);
      } catch (mailErr) {
        sheet.getRange(row, COL.SENT).setValue("MAIL_ERROR: " + String(mailErr).slice(0, 200));
      }

      return { status: "ok", orderId, amount: paidAmount };
    }

    return;
  } finally {
    lock.releaseLock();
  }
}

function getPaymentContent(data) {
  return String(
    (data.data && (data.data.content || data.data.description || data.data.addInfo)) ||
    data.addInfo ||
    data.description ||
    data.content ||
    data.memo ||
    ""
  ).toUpperCase().replace(/\s/g, "");
}

function getPaymentAmount(data) {
  const raw =
    (data.data && (data.data.amount || data.data.transferAmount || data.data.value)) ||
    data.amount ||
    data.transferAmount ||
    data.value ||
    data.money ||
    0;

  if (typeof raw === "number") return raw;
  return Number(String(raw).replace(/[^\d]/g, "")) || 0;
}

function getTransactionId(data) {
  return String(
    (data.data && (data.data.transactionId || data.data.reference || data.data.id)) ||
    data.transactionId ||
    data.reference ||
    data.id ||
    ""
  );
}

function findOrderId(content) {
  const match = String(content || "").match(/TMK[A-Z0-9]{10,}/);
  return match ? match[0] : "";
}

function normalizeOrderId(orderId) {
  return String(orderId || "").toUpperCase().replace(/\s/g, "");
}

function createOrderId(plan) {
  const now = new Date();
  const stamp = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMddHHmmss");
  const random = Math.floor(1000 + Math.random() * 9000);
  return ("TMK" + String(plan).toUpperCase() + stamp + random).replace(/[^A-Z0-9]/g, "");
}

function generateTMKey() {
  const raw = Utilities.getUuid().replace(/-/g, "").toUpperCase().slice(0, 16);
  return "TM-" + raw.match(/.{1,4}/g).join("-");
}

function generateUniqueTMKey(sheet) {
  const rows = sheet.getDataRange().getValues();
  const used = {};
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][COL.KEY - 1]) used[rows[i][COL.KEY - 1]] = true;
  }

  for (let tries = 0; tries < 20; tries++) {
    const key = generateTMKey();
    if (!used[key]) return key;
  }

  throw new Error("Khong tao duoc key duy nhat");
}

function sendKeyMail() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][COL.KEY - 1] && rows[i][COL.EMAIL - 1] && rows[i][COL.SENT - 1] !== "DONE") {
      sendKeyMailForRow(sheet, i + 1);
    }
  }
}

function sendKeyMailForRow(sheet, row) {
  const values = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  const key = values[COL.KEY - 1];
  const days = values[COL.DAYS - 1];
  const email = values[COL.EMAIL - 1];
  const plan = values[COL.PLAN - 1];
  const sent = values[COL.SENT - 1];

  if (!key || !days || !email || sent === "DONE") return;

  const html = `
<div style="margin:0;padding:0;background:#08111f;font-family:Arial,Helvetica,sans-serif;color:#fff;">
  <div style="max-width:560px;margin:auto;padding:24px 14px;">
    <div style="background:linear-gradient(135deg,#101827,#d8670f,#2563eb);border-radius:18px;padding:26px;text-align:center;box-shadow:0 16px 30px rgba(0,0,0,.35);">
      <div style="font-size:22px;font-weight:bold;margin-bottom:8px;">TIMEMARK PREMIUM</div>
      <div style="font-size:14px;opacity:.88;margin-bottom:18px;">Cam on ban da su dung Timemark.</div>
      <div style="background:rgba(255,255,255,.12);border-radius:14px;padding:16px;margin-bottom:16px;">
        <div style="font-size:12px;opacity:.75;">LICENSE KEY</div>
        <div style="font-size:24px;font-weight:bold;letter-spacing:1px;color:#fff4e6;">${key}</div>
      </div>
      <div style="font-size:14px;margin-bottom:8px;">Goi: <b>${plan || "--"}</b></div>
      <div style="font-size:14px;margin-bottom:16px;">Thoi han: <b>${days} ngay</b></div>
      <div style="font-size:13px;opacity:.9;line-height:1.6;margin-bottom:16px;">
        Moi key dung cho 1 thiet bi. Khong chia se key de tranh bi khoa.
      </div>
      <a href="https://timemark.id.vn/app/" style="display:inline-block;padding:12px 18px;background:#ff8a1f;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:bold;">Mo Timemark App</a>
    </div>
    <div style="text-align:center;font-size:12px;color:#cbd5e1;margin-top:12px;">© Timemark License System</div>
  </div>
</div>`;

  MailApp.sendEmail({
    to: email,
    subject: "Timemark License Key cua ban",
    htmlBody: html
  });

  sheet.getRange(row, COL.SENT).setValue("DONE");
}
