const SHEET_ID = "1OwogGQUvhvP7BDyfWyRGW2rHbAy40ppx0Ftx6L36lng";
const SHEET_NAME = "Sheet1";
const CONFIG_SHEET_NAME = "Config";
const PLAN_SHEET_NAME = "Plans";

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
  "Mã key",
  "Thiết bị",
  "Số ngày",
  "Ngày bắt đầu",
  "Đang hoạt động",
  "Cấp gói",
  "Ngày tạo",
  "Email",
  "Trạng thái gửi mail",
  "Mã gói",
  "Số tiền",
  "Mã đơn hàng",
  "Đã thanh toán",
  "Mã giao dịch",
  "Thời gian thanh toán",
  "Dữ liệu webhook"
];

const PLAN_HEADERS = [
  "Mã gói",
  "Tên gói",
  "Số ngày",
  "Giá tiền",
  "Cấp gói",
  "Đang bán",
  "Số lượng key",
  "Nhãn nổi bật",
  "Mô tả",
  "Tính năng",
  "Lớp giao diện",
  "Tên hiển thị"
];

const CONFIG_HEADERS = ["Cấu hình", "Giá trị", "Ghi chú"];

const CONFIG_DEFAULTS = [
  ["maintenance", false, "TRUE để bật chế độ bảo trì hệ thống"],
  ["systemLock", false, "TRUE để khóa hệ thống khi cần"],
  ["paymentProvider", "SEPAY", "Nhà cung cấp webhook thanh toán đang sử dụng"],
  ["sepayWebhookSecret", "", "Chuỗi bí mật đặt trong URL webhook SePay"],
  ["webhookSecret", "", "Secret cũ, chỉ dùng dự phòng khi sepayWebhookSecret còn trống"],
  ["requireWebhookSecret", true, "Giữ TRUE trên môi trường thật"],
  ["mailFromName", "Timemark", "Tên hiển thị trong email"],
  ["bankBin", "", "Mã BIN của ngân hàng đã liên kết với SePay"],
  ["bankName", "", "Tên ngân hàng hiển thị cho khách"],
  ["bankAccount", "", "Số tài khoản thật đã liên kết với SePay, không dùng tài khoản Casso"],
  ["bankAccountName", "", "Tên chủ tài khoản dùng để tạo VietQR"],
  ["sepayGateway", "", "Giá trị gateway SePay gửi về; để trống nếu không cần đối chiếu"],
  ["orderExpiryMinutes", 30, "Thời gian chờ thanh toán của một đơn"],
  ["checkRatePerMinute", 20, "Số lần kiểm tra tối đa mỗi phút cho một đơn"]
];

const PLAN_CONFIG = {
  basic1: {
    title: "Dùng thử 1 ngày",
    days: 1,
    amount: 40000,
    level: "BASIC",
    available: true,
    stock: -1,
    badge: "Bắt đầu nhanh",
    description: "Phù hợp để trải nghiệm app trước khi dùng dài hạn.",
    features: ["1 thiết bị", "Tạo ảnh không giới hạn trong thời hạn", "Hỗ trợ watermark cơ bản"],
    cssClass: "basic",
    label: "Dùng thử 1 ngày"
  },
  basic7: {
    title: "7 ngày",
    days: 7,
    amount: 99999999,
    level: "BASIC",
    available: false,
    stock: 0,
    badge: "Hết hàng",
    description: "Gói ngắn hạn hiện đang tạm ngừng bán.",
    features: ["1 thiết bị", "Thời hạn 7 ngày", "Sẽ mở lại sau"],
    cssClass: "basic",
    label: "7 ngày"
  },
  pro1: {
    title: "1 tháng",
    days: 30,
    amount: 495000,
    level: "PRO",
    available: true,
    stock: -1,
    badge: "Ổn định",
    description: "Lựa chọn phù hợp cho nhu cầu làm việc thường xuyên.",
    features: ["1 thiết bị", "Dùng đủ tính năng", "Hỗ trợ khi lỗi key"],
    cssClass: "pro",
    label: "1 tháng"
  },
  pro3: {
    title: "3 tháng",
    days: 90,
    amount: 1289000,
    level: "PRO",
    available: true,
    stock: -1,
    badge: "Đáng chọn",
    description: "Tối ưu chi phí cho người dùng đều đặn mỗi tuần.",
    features: ["1 thiết bị", "Giá tốt hơn gói tháng", "Phù hợp sale/thị trường"],
    cssClass: "pro featured",
    label: "3 tháng"
  },
  pre6: {
    title: "6 tháng",
    days: 180,
    amount: 1899000,
    level: "PREMIUM",
    available: true,
    stock: -1,
    badge: "Tiết kiệm",
    description: "Dành cho người dùng chuyên nghiệp, cần sử dụng lâu dài.",
    features: ["1 thiết bị", "Thời hạn dài", "Ưu tiên hỗ trợ"],
    cssClass: "premium featured",
    label: "6 tháng"
  },
  lifetime: {
    title: "Vĩnh viễn",
    days: 99999,
    amount: 3499000,
    level: "LIFETIME",
    available: true,
    stock: -1,
    badge: "Một lần",
    description: "Thanh toán một lần cho nhu cầu sử dụng lâu dài.",
    features: ["1 thiết bị", "Không cần gia hạn", "Phù hợp người dùng thường xuyên"],
    cssClass: "premium",
    label: "Vĩnh viễn"
  }
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
  if (existing.length === 0 || (existing[0][0] !== "key" && existing[0][0] !== CONFIG_HEADERS[0])) {
    config.clear();
    config.getRange(1, 1, 1, 3).setValues([CONFIG_HEADERS]);
    const initialConfig = CONFIG_DEFAULTS.map(function (row) {
      if (row[0] === "maintenance") return [row[0], oldMaintenance, row[2]];
      if (row[0] === "systemLock") return [row[0], oldLock, row[2]];
      return row;
    });
    config.getRange(2, 1, initialConfig.length, 3).setValues(initialConfig);
    config.setFrozenRows(1);
    config.autoResizeColumns(1, 3);
  }

  ensureConfigRows(config);

  setupPlanSheet(ss);

  return "THIẾT LẬP XONG: Sheet1 + Config + Plans đã sẵn sàng.";
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

    if (data.action === "getPlans") {
      return json({ status: "ok", plans: getPublicPlans(sheet) });
    }

    if (data.action === "createPending") {
      return json(createPending(data, sheet));
    }

    if (data.action === "checkPaid") {
      return json(checkPaid(data, sheet));
    }

    if (data.action === "resendKeyEmail") {
      return json(resendKeyEmail(data, sheet));
    }

    if (data.key) {
      return json(verifyKey(data, sheet));
    }

    const auto = paymentWebhookSePay(data, sheet);
    if (auto) return json(auto);

    return json({ status: "ignored" });
  } catch (err) {
    return json({ status: "error", message: String(err) });
  }
}

function parsePostData(e) {
  if (!e) return {};
  let data = {};
  try {
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    data = {};
  }

  const parameters = e.parameter || {};
  Object.keys(parameters).forEach(function (key) {
    if (data[key] === undefined) data[key] = parameters[key];
  });
  return data;
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

function getPaymentConfig() {
  return {
    provider: String(getConfigValue("paymentProvider", "SEPAY") || "SEPAY").trim().toUpperCase(),
    bankCode: String(getConfigValue("bankBin", "") || "").trim(),
    bankName: String(getConfigValue("bankName", "") || "").trim(),
    accountNumber: String(getConfigValue("bankAccount", "") || "").trim(),
    accountName: String(getConfigValue("bankAccountName", "") || "").trim(),
    sepayGateway: String(getConfigValue("sepayGateway", "") || "").trim()
  };
}

function getOrderExpiryMinutes() {
  const value = Number(getConfigValue("orderExpiryMinutes", 30));
  return value > 0 ? value : 30;
}

function isOrderExpired(createdAt) {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (isNaN(created.getTime())) return false;
  return Date.now() - created.getTime() > getOrderExpiryMinutes() * 60 * 1000;
}

function isSePayPaymentExpired(createdAt, transactionDate) {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (isNaN(created.getTime())) return false;

  let paidAt = null;
  const value = String(transactionDate || "").trim();
  if (value) {
    try {
      paidAt = Utilities.parseDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    } catch (err) {
      paidAt = new Date(value);
    }
  }

  if (!paidAt || isNaN(paidAt.getTime())) return isOrderExpired(createdAt);
  return paidAt.getTime() - created.getTime() > getOrderExpiryMinutes() * 60 * 1000;
}

function rateLimitKey(value) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value || ""),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(digest).slice(0, 32);
}

function allowRequest(bucket, identity, maxRequests, seconds) {
  const cache = CacheService.getScriptCache();
  const key = "rate:" + bucket + ":" + rateLimitKey(identity);
  const count = Number(cache.get(key) || 0);
  if (count >= maxRequests) return false;
  cache.put(key, String(count + 1), seconds);
  return true;
}

function ensureConfigRows(config) {
  const rows = config.getDataRange().getValues();
  const existing = {};
  for (let i = 1; i < rows.length; i++) {
    existing[String(rows[i][0] || "").trim()] = true;
  }

  const missing = CONFIG_DEFAULTS.filter(function (row) {
    return !existing[row[0]];
  });

  if (missing.length) {
    config.getRange(config.getLastRow() + 1, 1, missing.length, 3).setValues(missing);
  }
}

function setupPlanSheet(ss) {
  let plans = ss.getSheetByName(PLAN_SHEET_NAME);
  if (!plans) plans = ss.insertSheet(PLAN_SHEET_NAME);

  const existing = plans.getDataRange().getValues();
  if (existing.length > 0 && (existing[0][0] === "plan" || existing[0][0] === PLAN_HEADERS[0])) return;

  plans.clear();
  plans.getRange(1, 1, 1, PLAN_HEADERS.length).setValues([PLAN_HEADERS]);

  const rows = Object.keys(PLAN_CONFIG).map(function (plan) {
    const cfg = PLAN_CONFIG[plan];
    return [
      plan,
      cfg.title,
      cfg.days,
      cfg.amount,
      cfg.level,
      cfg.available,
      cfg.stock,
      cfg.badge,
      cfg.description,
      cfg.features.join("|"),
      cfg.cssClass,
      cfg.label
    ];
  });

  plans.getRange(2, 1, rows.length, PLAN_HEADERS.length).setValues(rows);
  plans.setFrozenRows(1);
  plans.autoResizeColumns(1, PLAN_HEADERS.length);
}

function getPlanConfigMap() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const plans = ss.getSheetByName(PLAN_SHEET_NAME);
  if (!plans) return PLAN_CONFIG;

  const rows = plans.getDataRange().getValues();
  if (rows.length < 2 || (rows[0][0] !== "plan" && rows[0][0] !== PLAN_HEADERS[0])) return PLAN_CONFIG;

  const map = {};
  for (let i = 1; i < rows.length; i++) {
    const plan = normalizePlan(rows[i][0]);
    if (!plan) continue;

    const fallback = PLAN_CONFIG[plan] || {};
    const amount = Number(rows[i][3]);
    const days = Number(rows[i][2]);
    const stockValue = rows[i][6];
    const stock = stockValue === "" || stockValue === null ? -1 : Number(stockValue);
    const features = String(rows[i][9] || "").split("|").map(function (item) {
      return item.trim();
    }).filter(Boolean);

    map[plan] = {
      title: String(rows[i][1] || fallback.title || plan),
      days: days || fallback.days || 0,
      amount: amount || fallback.amount || 0,
      level: String(rows[i][4] || fallback.level || "PRO"),
      available: parseBoolean(rows[i][5], fallback.available !== false),
      stock: isNaN(stock) ? -1 : stock,
      badge: String(rows[i][7] || fallback.badge || ""),
      description: String(rows[i][8] || fallback.description || ""),
      features: features.length ? features : (fallback.features || []),
      cssClass: String(rows[i][10] || fallback.cssClass || ""),
      label: String(rows[i][11] || fallback.label || rows[i][1] || plan)
    };
  }

  return map;
}

function getPlanConfig(plan) {
  return getPlanConfigMap()[normalizePlan(plan)];
}

function parseBoolean(value, fallback) {
  if (value === true || value === false) return value;
  const text = String(value || "").trim().toLowerCase();
  if (["true", "yes", "1", "on", "ban", "available"].indexOf(text) >= 0) return true;
  if (["false", "no", "0", "off", "ngung", "het", "soldout"].indexOf(text) >= 0) return false;
  return fallback;
}

function getSoldCount(sheet, plan) {
  const rows = sheet.getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    if (normalizePlan(rows[i][COL.PLAN - 1]) !== plan) continue;
    if (rows[i][COL.KEY - 1] || rows[i][COL.PAID - 1] === true) count++;
  }
  return count;
}

function getRemainingStock(sheet, cfg, plan) {
  if (!cfg || cfg.stock < 0) return -1;
  return Math.max(0, cfg.stock - getSoldCount(sheet, plan));
}

function isPlanSellable(sheet, cfg, plan) {
  if (!cfg || cfg.available !== true) return false;
  const remaining = getRemainingStock(sheet, cfg, plan);
  return remaining < 0 || remaining > 0;
}

function getPublicPlans(sheet) {
  const map = getPlanConfigMap();
  const rows = sheet.getDataRange().getValues();
  const soldByPlan = {};

  for (let i = 1; i < rows.length; i++) {
    const rowPlan = normalizePlan(rows[i][COL.PLAN - 1]);
    if (!rowPlan) continue;
    if (rows[i][COL.KEY - 1] || rows[i][COL.PAID - 1] === true) {
      soldByPlan[rowPlan] = (soldByPlan[rowPlan] || 0) + 1;
    }
  }

  return Object.keys(map).map(function (plan) {
    const cfg = map[plan];
    const sold = soldByPlan[plan] || 0;
    const remaining = cfg.stock < 0 ? -1 : Math.max(0, cfg.stock - sold);
    const available = cfg.available === true && (remaining < 0 || remaining > 0);
    return {
      id: plan,
      title: cfg.title,
      amount: cfg.amount,
      days: cfg.days,
      level: cfg.level,
      available: available,
      stock: cfg.stock,
      sold: sold,
      remaining: remaining,
      badge: cfg.badge,
      desc: cfg.description,
      features: cfg.features,
      cls: cfg.cssClass
    };
  });
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
    const cfg = getPlanConfig(plan);
    const requestedAmount = Number(data.amount || 0);

    if (!isValidEmail(email)) {
      return { status: "fail", message: "Email không hợp lệ" };
    }

    if (!allowRequest("create", email, 5, 600)) {
      return { status: "rate_limited", message: "Bạn đã tạo quá nhiều đơn. Vui lòng thử lại sau." };
    }

    if (!cfg) {
      return { status: "fail", message: "Gói không hợp lệ" };
    }

    if (!isPlanSellable(sheet, cfg, plan)) {
      return { status: "fail", message: "Gói này đang hết key hoặc tạm ngừng bán" };
    }

    if (requestedAmount && requestedAmount !== cfg.amount) {
      return { status: "fail", message: "Số tiền không khớp với gói" };
    }

    const orderId = createUniqueOrderId(sheet, plan);
    const payment = getPaymentConfig();
    if (!payment.bankCode || !payment.bankName || !payment.accountNumber || !payment.accountName) {
      return { status: "fail", message: "Cấu hình thanh toán chưa đầy đủ. Vui lòng liên hệ hỗ trợ." };
    }

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
      planTitle: cfg.title,
      orderId,
      transferContent: orderId,
      payment
    };
  } finally {
    lock.releaseLock();
  }
}

function checkPaid(data, sheet) {
  const orderId = normalizeOrderId(data.orderId);
  const email = normalizeEmail(data.email);

  if (!orderId || !isValidEmail(email)) {
    return { status: "not_found", paid: false, message: "Không tìm thấy đơn hàng." };
  }

  const maxChecks = Number(getConfigValue("checkRatePerMinute", 20)) || 20;
  if (!allowRequest("check", orderId + "|" + email, maxChecks, 60)) {
    return {
      status: "rate_limited",
      paid: false,
      message: "Bạn đang kiểm tra quá nhanh. Vui lòng chờ một chút rồi thử lại."
    };
  }

  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (normalizeOrderId(rows[i][COL.ORDER_ID - 1]) !== orderId) continue;
    if (normalizeEmail(rows[i][COL.EMAIL - 1]) !== email) break;

    const key = String(rows[i][COL.KEY - 1] || "").trim();
    const paymentReceived = rows[i][COL.PAID - 1] === true || !!key;
    const sentStatus = String(rows[i][COL.SENT - 1] || "");
    const plan = normalizePlan(rows[i][COL.PLAN - 1]);
    const cfg = getPlanConfig(plan);
    const days = Number(rows[i][COL.DAYS - 1] || (cfg && cfg.days) || 0);

    if (paymentReceived && key) {
      return {
        status: "paid",
        paid: true,
        key,
        emailSent: sentStatus === "DONE",
        emailStatus: sentStatus || "PENDING",
        plan,
        planTitle: cfg ? cfg.title : plan,
        days,
        duration: days >= 99999 ? "Vĩnh viễn" : days + " ngày"
      };
    }

    if (paymentReceived) {
      return {
        status: "processing_key",
        paid: true,
        key: "",
        emailSent: false,
        plan,
        planTitle: cfg ? cfg.title : plan,
        days
      };
    }

    if (isOrderExpired(rows[i][COL.CREATED_AT - 1])) {
      return { status: "expired", paid: false, message: "Đơn hàng đã hết thời gian chờ thanh toán." };
    }

    return { status: "pending", paid: false };
  }

  return { status: "not_found", paid: false, message: "Không tìm thấy đơn hàng." };
}

function resendKeyEmail(data, sheet) {
  const orderId = normalizeOrderId(data.orderId);
  const email = normalizeEmail(data.email);

  if (!orderId || !isValidEmail(email)) {
    return { status: "not_found", message: "Không tìm thấy đơn hàng." };
  }

  if (!allowRequest("resend", orderId + "|" + email, 3, 3600)) {
    return { status: "rate_limited", message: "Bạn đã yêu cầu gửi lại quá nhiều lần. Vui lòng thử lại sau." };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const rows = sheet.getDataRange().getValues();
    for (let i = rows.length - 1; i >= 1; i--) {
      if (normalizeOrderId(rows[i][COL.ORDER_ID - 1]) !== orderId) continue;
      if (normalizeEmail(rows[i][COL.EMAIL - 1]) !== email) break;

      const key = String(rows[i][COL.KEY - 1] || "").trim();
      const paymentReceived = rows[i][COL.PAID - 1] === true || !!key;
      const sentStatus = String(rows[i][COL.SENT - 1] || "");

      if (!paymentReceived || !key) {
        return { status: "not_ready", message: "Đơn hàng chưa có key để gửi." };
      }

      if (sentStatus === "DONE") {
        return { status: "ok", emailSent: true, alreadySent: true };
      }

      try {
        sendKeyMailForRow(sheet, i + 1);
        return { status: "ok", emailSent: true };
      } catch (mailErr) {
        sheet.getRange(i + 1, COL.SENT).setValue("MAIL_ERROR: " + String(mailErr).slice(0, 200));
        return { status: "mail_error", emailSent: false, message: "Chưa thể gửi email. Key vẫn có thể sao chép trên trang." };
      }
    }
  } finally {
    lock.releaseLock();
  }

  return { status: "not_found", message: "Không tìm thấy đơn hàng." };
}

function verifyKey(data, sheet) {
  const identity = String(data.device || "") + "|" + String(data.key || "");
  if (!allowRequest("key", identity, 30, 60)) {
    return { status: "fail", message: "Bạn đang kiểm tra key quá nhanh. Vui lòng thử lại sau." };
  }

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

function paymentWebhookSePay(data, sheet) {
  if (!isSePayWebhookPayload(data)) return;

  const payload = getSePayPayload(data);
  const configuredSecret = String(
    getConfigValue("sepayWebhookSecret", "") ||
    getConfigValue("webhookSecret", "") ||
    ""
  ).trim();
  const requireSecret = parseBoolean(getConfigValue("requireWebhookSecret", true), true);
  const receivedSecret = String(
    data.sepaySecret || data.secret || data.webhookSecret || data.token || ""
  ).trim();

  if (requireSecret && !configuredSecret) {
    return sePayResponse(false, "configuration_error", "Chưa cấu hình sepayWebhookSecret.");
  }
  if (configuredSecret && receivedSecret !== configuredSecret) {
    return sePayResponse(false, "unauthorized", "Webhook secret không hợp lệ.");
  }

  const paymentConfig = getPaymentConfig();
  if (paymentConfig.provider !== "SEPAY") {
    return sePayResponse(false, "configuration_error", "paymentProvider phải là SEPAY.");
  }

  const transferType = String(payload.transferType || "").trim().toLowerCase();
  if (transferType !== "in") {
    return sePayResponse(true, "ignored", "Giao dịch không phải tiền vào.");
  }

  const orderId = findOrderId(payload.content) ||
    findOrderId(payload.code) ||
    findOrderId(payload.description);
  if (!orderId) {
    return sePayResponse(true, "ignored", "Không tìm thấy mã đơn Timemark trong nội dung chuyển khoản.");
  }

  const transactionId = getSePayTransactionId(payload);
  if (!transactionId) {
    return sePayResponse(false, "invalid_payload", "Webhook SePay thiếu id giao dịch.");
  }

  const paidAmount = getSePayAmount(payload);
  const expectedAccount = normalizeAccountNumber(paymentConfig.accountNumber);
  const receivedAccounts = [payload.accountNumber, payload.subAccount]
    .map(normalizeAccountNumber)
    .filter(Boolean);
  if (!expectedAccount) {
    return sePayResponse(false, "configuration_error", "Chưa cấu hình bankAccount.");
  }
  if (receivedAccounts.indexOf(expectedAccount) < 0) {
    return sePayResponse(true, "rejected", "Tài khoản nhận tiền không khớp.", { orderId: orderId });
  }

  const expectedGateway = normalizeBank(paymentConfig.sepayGateway);
  const receivedGateway = normalizeBank(payload.gateway);
  if (expectedGateway && receivedGateway !== expectedGateway) {
    return sePayResponse(true, "rejected", "Gateway ngân hàng không khớp.", { orderId: orderId });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      const usedTransaction = String(rows[i][COL.TRANSACTION_ID - 1] || "").trim();
      const usedOrder = normalizeOrderId(rows[i][COL.ORDER_ID - 1]);
      if (usedTransaction === transactionId && usedOrder !== orderId) {
        return sePayResponse(true, "rejected", "Giao dịch đã được dùng cho đơn khác.", {
          orderId: orderId
        });
      }
    }

    for (let i = rows.length - 1; i >= 1; i--) {
      const rowOrderId = normalizeOrderId(rows[i][COL.ORDER_ID - 1]);
      if (rowOrderId !== orderId) continue;

      const existingKey = String(rows[i][COL.KEY - 1] || "").trim();
      if (existingKey) {
        return sePayResponse(true, "ok", "Giao dịch đã được xử lý trước đó.", {
          duplicate: true,
          orderId: orderId
        });
      }

      if (isSePayPaymentExpired(rows[i][COL.CREATED_AT - 1], payload.transactionDate)) {
        return sePayResponse(true, "expired", "Đơn hàng đã hết thời gian chờ thanh toán.", {
          orderId: orderId
        });
      }

      const plan = normalizePlan(rows[i][COL.PLAN - 1]);
      const cfg = getPlanConfig(plan);
      const expectedAmount = Number(rows[i][COL.AMOUNT - 1] || (cfg && cfg.amount) || 0);

      if (!cfg) {
        return sePayResponse(true, "rejected", "Gói thanh toán không hợp lệ.", { orderId: orderId });
      }

      if (!isPlanSellable(sheet, cfg, plan)) {
        return sePayResponse(true, "rejected", "Gói đã hết key hoặc tạm ngừng bán.", {
          orderId: orderId
        });
      }

      if (!paidAmount || paidAmount !== expectedAmount) {
        return sePayResponse(true, "rejected", "Số tiền thanh toán không khớp với đơn.", {
          orderId: orderId,
          receivedAmount: paidAmount,
          expectedAmount: expectedAmount
        });
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
      sheet.getRange(row, COL.RAW_WEBHOOK).setValue(JSON.stringify(sanitizeWebhookData(data)).slice(0, 45000));

      try {
        sendKeyMailForRow(sheet, row);
      } catch (mailErr) {
        sheet.getRange(row, COL.SENT).setValue("MAIL_ERROR: " + String(mailErr).slice(0, 200));
      }

      return sePayResponse(true, "ok", "Đã xác nhận thanh toán.", {
        orderId: orderId,
        amount: paidAmount
      });
    }

    return sePayResponse(true, "ignored", "Không tìm thấy đơn hàng phù hợp.", { orderId: orderId });
  } finally {
    lock.releaseLock();
  }
}

function paymentWebhook(data, sheet) {
  return paymentWebhookSePay(data, sheet);
}

function getSePayPayload(data) {
  return data && data.data && typeof data.data === "object" ? data.data : (data || {});
}

function isSePayWebhookPayload(data) {
  const payload = getSePayPayload(data);
  return payload.accountNumber !== undefined &&
    payload.transferType !== undefined &&
    payload.transferAmount !== undefined &&
    (payload.gateway !== undefined || payload.transactionDate !== undefined);
}

function getSePayTransactionId(payload) {
  const id = payload && payload.id;
  if (id === undefined || id === null || String(id).trim() === "") return "";
  return "SEPAY-" + String(id).trim();
}

function getSePayAmount(payload) {
  const raw = payload ? payload.transferAmount : 0;
  if (typeof raw === "number") return raw;
  return Number(String(raw || "").replace(/[^\d]/g, "")) || 0;
}

function sePayResponse(success, status, message, extra) {
  const response = {
    success: success === true,
    status: status
  };
  if (message) response.message = message;
  if (extra) {
    Object.keys(extra).forEach(function (key) {
      response[key] = extra[key];
    });
  }
  return response;
}

function getPaymentContent(data) {
  return String(
    (data.data && (data.data.content || data.data.transferContent || data.data.description || data.data.addInfo)) ||
    data.addInfo ||
    data.transferContent ||
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
    (data.data && (data.data.transactionId || data.data.referenceCode || data.data.reference || data.data.tid || data.data.id)) ||
    data.transactionId ||
    data.referenceCode ||
    data.reference ||
    data.tid ||
    data.id ||
    ""
  ).trim();
}

function getPaymentAccount(data) {
  return String(
    (data.data && (
      data.data.accountNumber ||
      data.data.bankAccount ||
      data.data.bank_sub_acc_id ||
      data.data.subAccount ||
      data.data.subAccId ||
      data.data.virtualAccount
    )) ||
    data.accountNumber ||
    data.bankAccount ||
    data.bank_sub_acc_id ||
    data.subAccount ||
    data.subAccId ||
    data.virtualAccount ||
    ""
  );
}

function getPaymentBank(data) {
  return String(
    (data.data && (
      data.data.bankBin ||
      data.data.bankCode ||
      data.data.bankAbbreviation ||
      data.data.gateway ||
      data.data.bankName
    )) ||
    data.bankBin ||
    data.bankCode ||
    data.bankAbbreviation ||
    data.gateway ||
    data.bankName ||
    ""
  );
}

function normalizeAccountNumber(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizeBank(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isIncomingPayment(data) {
  const direction = String(
    (data.data && (data.data.transferType || data.data.transactionType || data.data.direction)) ||
    data.transferType ||
    data.transactionType ||
    data.direction ||
    ""
  ).trim().toUpperCase();

  const status = String(
    (data.data && (data.data.transactionStatus || data.data.paymentStatus || data.data.status)) ||
    data.transactionStatus ||
    data.paymentStatus ||
    data.status ||
    ""
  ).trim().toUpperCase();

  if (direction && ["IN", "CREDIT", "RECEIVE", "RECEIVED", "MONEYIN"].indexOf(direction) < 0) {
    return false;
  }

  if (status && ["SUCCESS", "SUCCEEDED", "COMPLETED", "PAID", "OK"].indexOf(status) < 0) {
    return false;
  }

  return true;
}

function sanitizeWebhookData(data) {
  const clone = JSON.parse(JSON.stringify(data || {}));
  ["sepaySecret", "secret", "token", "webhookSecret", "apiKey", "authorization"].forEach(function (key) {
    delete clone[key];
    if (clone.data && typeof clone.data === "object") delete clone.data[key];
  });
  return clone;
}

function findOrderId(content) {
  const normalized = String(content || "").toUpperCase().replace(/\s/g, "");
  const match = normalized.match(/TMK[A-Z0-9]{10,}/);
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

function createUniqueOrderId(sheet, plan) {
  const rows = sheet.getDataRange().getValues();
  const used = {};
  for (let i = 1; i < rows.length; i++) {
    const orderId = normalizeOrderId(rows[i][COL.ORDER_ID - 1]);
    if (orderId) used[orderId] = true;
  }

  for (let tries = 0; tries < 20; tries++) {
    const orderId = createOrderId(plan);
    if (!used[orderId]) return orderId;
  }

  throw new Error("Không tạo được mã đơn duy nhất");
}

function generateTMKey() {
  const raw = Utilities.getUuid().replace(/-/g, "").toUpperCase().slice(0, 8);
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
  const cfg = getPlanConfig(plan);
  const planTitle = cfg ? cfg.title : plan;
  const duration = Number(days) >= 99999 ? "Vĩnh viễn" : days + " ngày";
  const safeKey = escapeEmailHtml(key);
  const safePlan = escapeEmailHtml(planTitle || "--");
  const safeDuration = escapeEmailHtml(duration);

  const html = `
<div style="margin:0;padding:0;background:#08111f;font-family:Arial,Helvetica,sans-serif;color:#fff;">
  <div style="max-width:560px;margin:auto;padding:24px 14px;">
    <div style="background:linear-gradient(135deg,#101827,#d8670f,#2563eb);border-radius:18px;padding:26px;text-align:center;box-shadow:0 16px 30px rgba(0,0,0,.35);">
      <div style="font-size:22px;font-weight:bold;margin-bottom:8px;">TIMEMARK PREMIUM</div>
      <div style="font-size:14px;opacity:.88;margin-bottom:18px;">Cảm ơn bạn đã sử dụng Timemark.</div>
      <div style="background:rgba(255,255,255,.12);border-radius:14px;padding:16px;margin-bottom:16px;">
        <div style="font-size:12px;opacity:.75;">MÃ KÍCH HOẠT</div>
        <div style="font-size:24px;font-weight:bold;letter-spacing:1px;color:#fff4e6;">${safeKey}</div>
      </div>
      <div style="font-size:14px;margin-bottom:8px;">Gói: <b>${safePlan}</b></div>
      <div style="font-size:14px;margin-bottom:16px;">Thời hạn: <b>${safeDuration}</b></div>
      <div style="font-size:13px;opacity:.9;line-height:1.6;margin-bottom:16px;">
        Mỗi key dùng cho 1 thiết bị. Không chia sẻ key để tránh bị khóa.
      </div>
      <a href="https://timemark.id.vn/app/" style="display:inline-block;padding:12px 18px;background:#ff8a1f;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:bold;">Mở Timemark App</a>
    </div>
    <div style="text-align:center;font-size:12px;color:#cbd5e1;margin-top:12px;">© Timemark License System</div>
  </div>
</div>`;

  MailApp.sendEmail({
    to: email,
    subject: "Mã kích hoạt Timemark của bạn",
    name: String(getConfigValue("mailFromName", "Timemark") || "Timemark"),
    htmlBody: html
  });

  sheet.getRange(row, COL.SENT).setValue("DONE");
}

function escapeEmailHtml(value) {
  return String(value || "").replace(/[&<>"']/g, function (char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char];
  });
}
