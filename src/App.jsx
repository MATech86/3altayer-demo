import React, { useEffect, useMemo, useState } from "react";

const API =
  "https://script.google.com/macros/s/AKfycbysF1gnauZbRL7GZHpIs-HpCR5OpreovQySQIwK8jJT_CD9MCewgR1GlY7P9Yj-Opzltg/exec";

const DEMO_USERS = [
  {
    username: "customer1",
    password: "123456",
    role: "customer",
    name: "عميل تجريبي"
  },
  {
    username: "captain1",
    password: "123456",
    role: "captain",
    name: "كابتن تجريبي"
  },
  {
    username: "admin1",
    password: "123456",
    role: "admin",
    name: "إدارة تجريبية"
  }
];

const STAGES = [
  { key: "placed", label: "تم الطلب" },
  { key: "accepted", label: "تم القبول" },
  { key: "picked", label: "تم الاستلام" },
  { key: "onway", label: "في الطريق" },
  { key: "delivered", label: "تم التسليم" }
];

const ZONE_PRICES = [
  { keywords: ["المناطق الداخلية", "داخل المدينة", "دمنهور"], price: 20 },
  { keywords: ["الموقف", "السوق الجديد", "أبو الريش", "الشرعية", "الشريعة"], price: 25 },
  { keywords: ["برج رنين", "نزبة اللواء", "المرور", "نادي القوات", "المسلحة", "جامع عبد", "جامع عيد"], price: 30 },
  { keywords: ["مخرطة الجندي", "كوبري فلاقة", "جامع الدراسية"], price: 35 },
  { keywords: ["مساكن القوات المسلحة", "عزبة شعير", "قراقص", "غربال"], price: 40 },
  { keywords: ["مجمع الكليات", "المجمع"], price: 45 },
  { keywords: ["مساكن شركة كهرباء زاوية غزال", "مساكن الأبعادية", "الأبعادية"], price: 50 },
  { keywords: ["كوبري زاوية غزال القديم"], price: 60 },
  { keywords: ["كوبري زاوية غزال الجديد"], price: 70 },
  { keywords: ["بني هلال"], price: 75 }
];

function stageLabel(stage) {
  const found = STAGES.find((s) => s.key === stage);
  return found ? found.label : stage || "غير معروف";
}

function stageProgress(stage) {
  const idx = STAGES.findIndex((s) => s.key === stage);
  const safe = idx === -1 ? 0 : idx;
  return ((safe + 1) / STAGES.length) * 100;
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return fallback;
  }
}

function estimateZonePrice(pickup, dropoff) {
  const combined = `${pickup} ${dropoff}`.toLowerCase();
  for (const zone of ZONE_PRICES) {
    const matched = zone.keywords.some((keyword) =>
      combined.includes(keyword.toLowerCase())
    );
    if (matched) return zone.price;
  }
  return 20;
}

function calculateAutoPriceFromDistance(distanceKm) {
  const safeKm = Number.isFinite(distanceKm) ? distanceKm : 0;
  return Math.max(20, Math.round(20 + safeKm * 2));
}

async function getGoogleMapsDistanceKm(origin, destination) {
  if (
    !window.google ||
    !window.google.maps ||
    !window.google.maps.DistanceMatrixService
  ) {
    throw new Error("Google Maps service unavailable");
  }

  return new Promise((resolve, reject) => {
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC
      },
      (response, status) => {
        if (status !== "OK") {
          reject(new Error(status));
          return;
        }
        const element = response?.rows?.[0]?.elements?.[0];
        if (!element || element.status !== "OK") {
          reject(new Error(element?.status || "NO_ROUTE"));
          return;
        }
        const meters = element.distance?.value || 0;
        resolve(meters / 1000);
      }
    );
  });
}

const styles = {
  appBg: {
    minHeight: "100vh",
    direction: "rtl",
    fontFamily: "Cairo, Arial, sans-serif",
    background:
      "radial-gradient(circle at top right, rgba(124,58,237,0.10), transparent 28%), linear-gradient(180deg, #FFF9F3 0%, #FFF2E7 24%, #F8FAFC 100%)",
    padding: 18
  },
  glass: {
    background: "rgba(255,255,255,0.66)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.7)",
    boxShadow: "0 14px 38px rgba(15,23,42,0.08)"
  },
  sectionCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
    border: "1px solid #e8edf3"
  },
  primaryButton: {
    border: "none",
    borderRadius: 18,
    padding: "14px 18px",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    background: "linear-gradient(135deg, #FF6B00, #FF9500)",
    boxShadow: "0 14px 28px rgba(255,107,0,0.22)",
    transition: "transform 0.18s ease, box-shadow 0.18s ease"
  },
  darkButton: {
    border: "none",
    borderRadius: 18,
    padding: "15px 18px",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    background: "#111827",
    boxShadow: "0 10px 22px rgba(17,24,39,0.16)"
  },
  secondaryButton: {
    borderRadius: 16,
    padding: "12px 16px",
    border: "1px solid #d8e0ea",
    background: "#fff",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer"
  },
  input: {
    width: "100%",
    borderRadius: 16,
    border: "1px solid #d6dde8",
    padding: "14px 14px",
    outline: "none",
    fontSize: 14,
    background: "rgba(255,255,255,0.96)",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease"
  }
};

function NavButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        border: "none",
        borderRadius: 16,
        padding: "12px 14px",
        fontWeight: 800,
        cursor: onClick ? "pointer" : "default",
        background: active ? "linear-gradient(135deg, #FF6B00, #FF9500)" : "#fff",
        color: active ? "#ffffff" : "#475569",
        boxShadow: active
          ? "0 10px 24px rgba(255,107,0,0.22)"
          : "0 2px 8px rgba(15,23,42,0.05)"
      }}
    >
      {children}
    </button>
  );
}

function SectionCard({ children, style, glass = false }) {
  return (
    <div style={{ ...(glass ? styles.glass : styles.sectionCard), ...style }}>
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  style,
  disabled,
  type = "button"
}) {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      style={{
        ...styles.primaryButton,
        ...(disabled
          ? {
              background: "#cbd5e1",
              boxShadow: "none",
              cursor: "not-allowed"
            }
          : {}),
        ...style
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{ ...styles.secondaryButton, ...style }}
    >
      {children}
    </button>
  );
}

function MetricCard({ label, value, color, soft }) {
  return (
    <div
      style={{
        background: color,
        color: "#fff",
        borderRadius: 20,
        padding: 14,
        minHeight: 88,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: soft
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.88 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = DEMO_USERS.find(
      (u) =>
        u.username === username.trim() && u.password === password.trim()
    );
    if (!found) {
      setError("بيانات الدخول غير صحيحة");
      return;
    }
    setError("");
    onLogin(found);
  };

  const quickLogin = (user) => {
    setError("");
    onLogin(user);
  };

  return (
    <div
      style={{
        ...styles.appBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <style>{`
        @keyframes soar {
          0% { transform: translateX(-12px) translateY(8px) rotate(-6deg); }
          50% { transform: translateX(10px) translateY(-6px) rotate(3deg); }
          100% { transform: translateX(-12px) translateY(8px) rotate(-6deg); }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 440 }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 30,
            padding: 24,
            marginBottom: 16,
            color: "#fff",
            background:
              "linear-gradient(135deg, #FF6B00 0%, #FF9500 42%, #7C3AED 100%)",
            boxShadow: "0 24px 42px rgba(255,107,0,0.18)"
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 22,
              top: 18,
              fontSize: 48,
              animation: "soar 3.2s ease-in-out infinite"
            }}
          >
            🦅
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              textAlign: "center",
              paddingTop: 8
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 6 }}>
              ع الطاير
            </div>
            <div style={{ opacity: 0.92, fontSize: 15 }}>
              نسخة تجريبية للعميل والكابتن والإدارة
            </div>
          </div>
        </div>

        <SectionCard glass style={{ borderRadius: 26 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 8,
              textAlign: "center"
            }}
          >
            تسجيل الدخول
          </div>
          <div
            style={{
              color: "#64748b",
              textAlign: "center",
              marginBottom: 18
            }}
          >
            جرب كل واجهة بحسابها التجريبي
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  marginBottom: 6
                }}
              >
                اسم المستخدم
              </div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: customer1"
                style={styles.input}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  marginBottom: 6
                }}
              >
                كلمة المرور
              </div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="123456"
                style={styles.input}
              />
            </div>

            {error ? (
              <div
                style={{
                  background: "#FEF2F2",
                  color: "#B91C1C",
                  border: "1px solid #FECACA",
                  borderRadius: 14,
                  padding: 12,
                  fontWeight: 700,
                  fontSize: 13
                }}
              >
                {error}
              </div>
            ) : null}

            <PrimaryButton type="submit" style={{ width: "100%" }}>
              دخول
            </PrimaryButton>
          </form>

          <div style={{ marginTop: 18 }}>
            <div
              style={{
                fontSize: 13,
                color: "#64748b",
                marginBottom: 10,
                fontWeight: 700
              }}
            >
              دخول سريع:
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {DEMO_USERS.map((user) => (
                <button
                  key={user.username}
                  type="button"
                  onClick={() => quickLogin(user)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderRadius: 16,
                    padding: "12px 14px",
                    border: "1px solid #e2e8f0",
                    background: "rgba(255,255,255,0.9)",
                    cursor: "pointer",
                    fontFamily: "inherit"
                  }}
                >
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>
                      {user.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        marginTop: 2
                      }}
                    >
                      {user.username} / {user.password}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#FF6B00"
                    }}
                  >
                    {user.role === "customer"
                      ? "👤 عميل"
                      : user.role === "captain"
                      ? "🛵 كابتن"
                      : "🧠 إدارة"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function AppHeader({ loading, user, onLogout }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 30,
        padding: 22,
        marginBottom: 18,
        color: "#fff",
        background:
          "linear-gradient(135deg, #FF6B00 0%, #FF9500 42%, #7C3AED 100%)",
        boxShadow: "0 24px 42px rgba(255,107,0,0.18)"
      }}
    >
      <style>{`
        @keyframes soar {
          0% { transform: translateX(-12px) translateY(8px) rotate(-6deg); }
          50% { transform: translateX(10px) translateY(-6px) rotate(3deg); }
          100% { transform: translateX(-12px) translateY(8px) rotate(-6deg); }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          left: 24,
          top: 18,
          fontSize: 44,
          animation: "soar 3.2s ease-in-out infinite",
          zIndex: 2
        }}
      >
        🦅
      </div>

      <div style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <div>
            <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
              ع الطاير
            </div>
            <div style={{ opacity: 0.92, fontSize: 15 }}>
              أهلاً {user?.name || "بك"}
            </div>
            <div style={{ opacity: 0.82, fontSize: 13, marginTop: 4 }}>
              {user?.role === "customer"
                ? "واجهة العميل"
                : user?.role === "captain"
                ? "واجهة الكابتن"
                : "لوحة الإدارة"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap"
            }}
          >
            <SectionCard
              glass
              style={{
                padding: "10px 14px",
                color: "#fff",
                minWidth: 120
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.9 }}>الحالة</div>
              <div style={{ fontWeight: 800, marginTop: 4 }}>
                {loading ? "جارٍ التحميل" : "جاهز الآن"}
              </div>
            </SectionCard>

            <button
              onClick={onLogout}
              type="button"
              style={{
                border: "1px solid rgba(255,255,255,0.28)",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                borderRadius: 14,
                padding: "12px 14px",
                cursor: "pointer",
                fontWeight: 800
              }}
            >
              خروج
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackingBar({ stage }) {
  return (
    <SectionCard glass style={{ borderRadius: 26 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12
        }}
      >
        <div style={{ fontWeight: 900, color: "#0f172a" }}>تتبع الطلب</div>
        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>
          LIVE • {stageLabel(stage)}
        </div>
      </div>

      <div
        style={{
          height: 12,
          background: "#e2e8f0",
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: 14
        }}
      >
        <div
          style={{
            width: `${stageProgress(stage)}%`,
            height: "100%",
            background:
              "linear-gradient(90deg, #FF6B00, #FF9500, #7C3AED)",
            borderRadius: 999,
            transition: "width 0.35s ease"
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 8
        }}
      >
        {STAGES.map((item, index) => {
          const current = STAGES.findIndex((s) => s.key === stage);
          const active = index <= (current === -1 ? 0 : current);

          return (
            <div key={item.key} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  margin: "0 auto 6px",
                  background: active
                    ? "linear-gradient(135deg, #FF6B00, #7C3AED)"
                    : "#e2e8f0",
                  color: active ? "#fff" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 12,
                  boxShadow: active
                    ? "0 8px 18px rgba(124,58,237,0.18)"
                    : "none"
                }}
              >
                {index + 1}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: active ? "#0f172a" : "#94a3b8",
                  lineHeight: 1.45
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function OrderListCard({ order, children }) {
  return (
    <SectionCard glass style={{ marginBottom: 12, borderRadius: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          gap: 12,
          marginBottom: 10
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 900,
              color: "#0f172a",
              fontSize: 16
            }}
          >
            {order.order_id}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#64748b",
              marginTop: 4
            }}
          >
            {order.details}
          </div>
        </div>

        <div
          style={{
            padding: "6px 10px",
            background: "rgba(255,255,255,0.75)",
            borderRadius: 999,
            color: "#475569",
            fontSize: 12,
            fontWeight: 700,
            border: "1px solid #e2e8f0"
          }}
        >
          {order.status}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 6,
          color: "#475569",
          fontSize: 13,
          marginBottom: 12
        }}
      >
        <div>📍 من: {order.pickup}</div>
        <div>🏁 إلى: {order.dropoff}</div>
        <div>💰 السعر: {order.price}</div>
        <div>🛰️ التتبع: {stageLabel(order.tracking_stage)}</div>
      </div>

      {children}
    </SectionCard>
  );
}

function MiniChatSupport() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "أهلاً بك 👋 أنا مساعد عالطاير. اسألني عن الطلب أو الأسعار أو التواصل مع الكابتن."
    }
  ]);
  const [input, setInput] = useState("");

  const botReply = (text) => {
    const normalized = text.trim();
    if (!normalized) return "اكتب سؤالك وسأحاول مساعدتك.";
    if (
      normalized.includes("طلبي") ||
      normalized.includes("الطلب") ||
      normalized.includes("فين")
    ) {
      return "يمكنك متابعة حالة طلبك من شريط التتبع الموجود أعلى الطلب الحالي.";
    }
    if (
      normalized.includes("سعر") ||
      normalized.includes("التوصيل") ||
      normalized.includes("تكلفة")
    ) {
      return "السعر يبدأ من 20 جنيه، ويتم حسابه أوتوماتيك حسب المسافة أو المنطقة.";
    }
    if (
      normalized.includes("كابتن") ||
      normalized.includes("اتصال") ||
      normalized.includes("واتساب")
    ) {
      return "إذا كان الطلب مُسندًا لكابتن ستظهر لك أزرار الاتصال والرسائل والواتساب أسفل بطاقة الطلب.";
    }
    if (
      normalized.includes("إلغاء") ||
      normalized.includes("تعديل")
    ) {
      return "في النسخة الحالية يمكنك التواصل مع الدعم أو الإدارة لتعديل الطلب أو إلغائه قبل التسليم.";
    }
    return "شكرًا لسؤالك. أقدر أساعدك في متابعة الطلب، التسعير، ووسائل التواصل مع الكابتن.";
  };

  const sendMessage = (presetText) => {
    const content = typeof presetText === "string" ? presetText : input;
    if (!content.trim()) return;
    const userMsg = { from: "user", text: content };
    const replyMsg = { from: "bot", text: botReply(content) };
    setMessages((prev) => [...prev, userMsg, replyMsg]);
    setInput("");
  };

  return (
    <SectionCard glass style={{ borderRadius: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10
        }}
      >
        <div style={{ fontWeight: 900, color: "#0f172a" }}>
          🤖 مساعد عالطاير
        </div>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
          ردود فورية
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 12
        }}
      >
        <SecondaryButton
          onClick={() => sendMessage("فين طلبي؟")}
          style={{ fontSize: 12, padding: "10px 12px" }}
        >
          فين طلبي؟
        </SecondaryButton>
        <SecondaryButton
          onClick={() => sendMessage("سعر التوصيل كام؟")}
          style={{ fontSize: 12, padding: "10px 12px" }}
        >
          سعر التوصيل
        </SecondaryButton>
        <SecondaryButton
          onClick={() => sendMessage("إزاي أكلم الكابتن؟")}
          style={{ fontSize: 12, padding: "10px 12px" }}
        >
          التواصل مع الكابتن
        </SecondaryButton>
      </div>

      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: 12,
          maxHeight: 260,
          overflowY: "auto",
          marginBottom: 12
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={`${msg.from}-${idx}`}
            style={{
              display: "flex",
              justifyContent:
                msg.from === "user" ? "flex-start" : "flex-end",
              marginBottom: 8
            }}
          >
            <div
              style={{
                maxWidth: "78%",
                background:
                  msg.from === "user"
                    ? "linear-gradient(135deg, #111827, #0f172a)"
                    : "#ffffff",
                color: msg.from === "user" ? "#fff" : "#334155",
                border:
                  msg.from === "user" ? "none" : "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "10px 12px",
                fontSize: 13,
                lineHeight: 1.6,
                boxShadow: "0 4px 12px rgba(15,23,42,0.06)"
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب سؤالك..."
          style={{
            flex: 1,
            borderRadius: 16,
            border: "1px solid #cbd5e1",
            padding: "12px 14px",
            outline: "none",
            fontSize: 14
          }}
        />
        <PrimaryButton
          onClick={() => sendMessage()}
          style={{ padding: "12px 16px" }}
        >
          إرسال
        </PrimaryButton>
      </div>
    </SectionCard>
  );
}

function PricingCard({
  pickup,
  setPickup,
  dropoff,
  setDropoff,
  distanceInfo,
  priceInfo,
  quoteApproved,
  setQuoteApproved
}) {
  return (
    <SectionCard glass style={{ borderRadius: 26 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          gap: 12,
          flexWrap: "wrap"
        }}
      >
        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: "#0f172a"
            }}
          >
            💰 التسعير الذكي
          </div>
          <div
            style={{
              color: "#64748b",
              marginTop: 6,
              fontSize: 13
            }}
          >
            الحد الأدنى 20 جنيه — الحساب أوتوماتيك حسب العنوان والمسافة
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.85)",
            color: "#c2410c",
            border: "1px solid #fdba74",
            padding: "10px 14px",
            borderRadius: 16,
            fontWeight: 800
          }}
        >
          {distanceInfo}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        <div>
          <div
            style={{
              fontSize: 13,
              color: "#64748b",
              marginBottom: 6
            }}
          >
            هتطلب من فين؟
          </div>
          <input
            value={pickup}
            onChange={(e) => {
              setPickup(e.target.value);
              setQuoteApproved(false);
            }}
            placeholder="مثال: شارع الجمهورية أو مشويات منيسي"
            style={styles.input}
          />
        </div>

        <div>
          <div
            style={{
              fontSize: 13,
              color: "#64748b",
              marginBottom: 6
            }}
          >
            هتودي فين؟
          </div>
          <input
            value={dropoff}
            onChange={(e) => {
              setDropoff(e.target.value);
              setQuoteApproved(false);
            }}
            placeholder="مثال: ميدان النافورة أو شارع الجيش"
            style={styles.input}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 14
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.9)",
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            padding: 12
          }}
        >
          <div style={{ fontSize: 12, color: "#64748b" }}>
            الحد الأدنى
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#0f172a"
            }}
          >
            20
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.9)",
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            padding: 12
          }}
        >
          <div style={{ fontSize: 12, color: "#64748b" }}>
            آلية الحساب
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: "#0f172a"
            }}
          >
            أوتوماتيك
          </div>
        </div>

        <div
          style={{
            background:
              "linear-gradient(135deg, #FF6B00, #7C3AED)",
            color: "#fff",
            borderRadius: 18,
            padding: 12,
            boxShadow: "0 16px 28px rgba(124,58,237,0.18)"
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.9 }}>
            السعر الحالي
          </div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>
            {priceInfo} ج
          </div>
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.8)",
          border: "1px dashed #cbd5e1",
          borderRadius: 18,
          padding: 12,
          color: "#475569",
          fontSize: 13,
          lineHeight: 1.7,
          marginBottom: 12
        }}
      >
        <div>• السعر يبدأ من 20 جنيه داخل المناطق القريبة.</div>
        <div>
          • إذا كانت Google Maps متاحة سيتم حساب السعر حسب المسافة الفعلية تلقائيًا.
        </div>
        <div>
          • إذا لم تكن متاحة، يتم استخدام تسعير المناطق المحلي كحل احتياطي.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: quoteApproved ? "#ECFDF5" : "#FFF7ED",
          border: `1px solid ${quoteApproved ? "#86EFAC" : "#FDBA74"}`,
          borderRadius: 16,
          padding: 12
        }}
      >
        <input
          type="checkbox"
          checked={quoteApproved}
          onChange={(e) => setQuoteApproved(e.target.checked)}
        />
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#334155"
          }}
        >
          أوافق على التسعيرة الحالية قبل تأكيد الأوردر
        </div>
      </div>
    </SectionCard>
  );
}

function CustomerPage({
  orders,
  pickup,
  setPickup,
  dropoff,
  setDropoff,
  distanceInfo,
  price,
  createOrder,
  quoteApproved,
  setQuoteApproved
}) {
  const latestOrder = orders[0];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SectionCard glass style={{ borderRadius: 26 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#0f172a"
              }}
            >
              👤 واجهة العميل
            </div>
            <div style={{ color: "#64748b", marginTop: 6 }}>
              اكتب منين وإلى فين، وافق على السعر، ثم أكد الطلب.
            </div>
          </div>

          <button
            onClick={createOrder}
            type="button"
            style={styles.darkButton}
          >
            يلا اطلب ع الطاير
          </button>
        </div>
      </SectionCard>

      <PricingCard
        pickup={pickup}
        setPickup={setPickup}
        dropoff={dropoff}
        setDropoff={setDropoff}
        distanceInfo={distanceInfo}
        priceInfo={Math.max(20, price)}
        quoteApproved={quoteApproved}
        setQuoteApproved={setQuoteApproved}
      />

      {latestOrder ? <TrackingBar stage={latestOrder.tracking_stage} /> : null}

      <div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 10
          }}
        >
          طلباتك
        </div>

        {orders.length === 0 ? (
          <SectionCard glass>لا توجد طلبات</SectionCard>
        ) : (
          orders.map((o) => (
            <OrderListCard key={o.order_id} order={o}>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  الكابتن: {o.captain || "في انتظار الإسناد"}
                </div>

                {o.captain_phone ? (
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    رقم الكابتن: {o.captain_phone}
                  </div>
                ) : null}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3, minmax(0, 1fr))",
                    gap: 8
                  }}
                >
                  <a
                    href={`tel:${o.captain_phone || ""}`}
                    style={{ textDecoration: "none" }}
                  >
                    <SecondaryButton style={{ width: "100%" }}>
                      اتصال
                    </SecondaryButton>
                  </a>

                  <a
                    href={`sms:${o.captain_phone || ""}`}
                    style={{ textDecoration: "none" }}
                  >
                    <SecondaryButton style={{ width: "100%" }}>
                      رسالة
                    </SecondaryButton>
                  </a>

                  <a
                    href={`https://wa.me/${String(
                      o.captain_phone || ""
                    ).replace(/^0/, "20")}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: "none" }}
                  >
                    <PrimaryButton
                      style={{
                        width: "100%",
                        padding: "12px 10px"
                      }}
                    >
                      واتساب
                    </PrimaryButton>
                  </a>
                </div>
              </div>
            </OrderListCard>
          ))
        )}
      </div>

      <MiniChatSupport />
    </div>
  );
}

function CaptainPage({
  availableOrders,
  currentOrders,
  acceptOrder,
  pickOrder,
  sendOnWay,
  deliverOrder
}) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SectionCard glass style={{ borderRadius: 26 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 6
          }}
        >
          🛵 واجهة الكابتن
        </div>
        <div style={{ color: "#64748b" }}>
          اقبل الطلبات، ثم حرّكها بين المراحل حتى التسليم.
        </div>
      </SectionCard>

      <div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 10
          }}
        >
          الطلبات المتاحة
        </div>

        {availableOrders.length === 0 ? (
          <SectionCard glass>لا توجد طلبات متاحة</SectionCard>
        ) : (
          availableOrders.map((o) => (
            <OrderListCard key={o.order_id} order={o}>
              <PrimaryButton
                onClick={() => acceptOrder(o.order_id)}
                style={{ width: "100%" }}
              >
                ⚡ قبول الطلب
              </PrimaryButton>
            </OrderListCard>
          ))
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 10
          }}
        >
          الطلبات الجارية
        </div>

        {currentOrders.length === 0 ? (
          <SectionCard glass>لا توجد طلبات جارية</SectionCard>
        ) : (
          currentOrders.map((o) => (
            <OrderListCard key={o.order_id} order={o}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(0, 1fr))",
                  gap: 8
                }}
              >
                <SecondaryButton
                  onClick={() => pickOrder(o.order_id)}
                >
                  📦 استلام
                </SecondaryButton>

                <SecondaryButton
                  onClick={() => sendOnWay(o.order_id)}
                >
                  🛵 في الطريق
                </SecondaryButton>

                <PrimaryButton
                  onClick={() => deliverOrder(o.order_id)}
                  style={{ padding: "12px 10px" }}
                >
                  ✅ تسليم
                </PrimaryButton>
              </div>
            </OrderListCard>
          ))
        )}
      </div>
    </div>
  );
}

function AdminPage({ orders, load }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SectionCard glass style={{ borderRadius: 26 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 6
          }}
        >
          🧠 لوحة الإدارة
        </div>
        <div style={{ color: "#64748b" }}>
          رؤية سريعة لكل الطلبات والحالات الحالية في النظام.
        </div>
      </SectionCard>

      {orders.length === 0 ? (
        <SectionCard glass>لا توجد طلبات</SectionCard>
      ) : (
        orders.map((o) => (
          <OrderListCard key={o.order_id} order={o}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap"
              }}
            >
              <div style={{ color: "#64748b", fontSize: 13 }}>
                الكابتن: {o.captain || "غير مسند"}
              </div>

              <SecondaryButton onClick={load}>
                تحديث الآن
              </SecondaryButton>
            </div>
          </OrderListCard>
        ))
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [distanceKm, setDistanceKm] = useState(null);
  const [distanceMode, setDistanceMode] = useState("zone");
  const [price, setPrice] = useState(20);
  const [quoteApproved, setQuoteApproved] = useState(false);

  const availableOrders = useMemo(
    () => orders.filter((o) => o.status === "available"),
    [orders]
  );

  const currentOrders = useMemo(
    () => orders.filter((o) => o.status === "current"),
    [orders]
  );

  const doneOrders = useMemo(
    () => orders.filter((o) => o.status === "done"),
    [orders]
  );

  useEffect(() => {
    let active = true;

    const computeAutoPrice = async () => {
      if (!pickup.trim() || !dropoff.trim()) {
        if (active) {
          setDistanceKm(null);
          setDistanceMode("zone");
          setPrice(20);
        }
        return;
      }

      try {
        const km = await getGoogleMapsDistanceKm(pickup, dropoff);
        if (!active) return;
        setDistanceKm(km);
        setDistanceMode("maps");
        setPrice(calculateAutoPriceFromDistance(km));
      } catch (error) {
        if (!active) return;
        setDistanceKm(null);
        setDistanceMode("zone");
        setPrice(Math.max(20, estimateZonePrice(pickup, dropoff)));
      }
    };

    computeAutoPrice();

    return () => {
      active = false;
    };
  }, [pickup, dropoff]);

  const load = async () => {
    try {
      setLoading(true);
      setMsg("⏳ جاري تحميل الطلبات...");
      const res = await fetch(`${API}?action=list_orders`);
      const text = await res.text();
      const data = safeJsonParse(text, {
        ok: false,
        message: "الرد من السيرفر غير صالح"
      });

      if (data.ok) {
        const rows = Array.isArray(data.orders) ? data.orders : [];
        setOrders(rows);
        setMsg(`✅ تم تحميل ${rows.length} طلب`);
      } else {
        setMsg(`❌ ${data.message || "فشل تحميل الطلبات"}`);
      }
    } catch (error) {
      setMsg("❌ فشل الاتصال بـ Google Sheet");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setPickup("");
    setDropoff("");
    setPrice(20);
    setQuoteApproved(false);
    setMsg("");
  };

  const createOrder = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      setMsg("❌ اكتب هتطلب من فين وهتودي فين أولاً");
      return;
    }

    if (!quoteApproved) {
      setMsg("❌ لازم توافق على التسعيرة أولاً قبل تأكيد الأوردر");
      return;
    }

    const order = {
      action: "create_order",
      order_id: "AT-" + Math.floor(Math.random() * 100000),
      created_at: new Date().toISOString(),
      customer: user?.name || "عميل جديد",
      phone: "01000000000",
      category: "أي حاجة",
      details: `طلب جديد من ${pickup} إلى ${dropoff}`,
      pickup,
      dropoff,
      price: Math.max(20, price),
      status: "available",
      tracking_stage: "placed",
      captain: "",
      captain_phone: ""
    };

    try {
      setMsg("⏳ جاري إنشاء الطلب...");
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(order)
      });

      const text = await res.text();
      const data = safeJsonParse(text, {
        ok: false,
        message: "فشل قراءة رد إنشاء الطلب"
      });

      if (data.ok) {
        setMsg(`✅ تم إنشاء الطلب ${data.order_id || ""}`);
        setPickup("");
        setDropoff("");
        setQuoteApproved(false);
        await load();
      } else {
        setMsg(`❌ ${data.message || "فشل إنشاء الطلب"}`);
      }
    } catch (error) {
      setMsg("❌ فشل الاتصال أثناء إنشاء الطلب");
      console.error(error);
    }
  };

  const updateOrder = async (payload, successMessage) => {
    try {
      setMsg("⏳ جاري تحديث الطلب...");
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "update_order", ...payload })
      });

      const text = await res.text();
      const data = safeJsonParse(text, {
        ok: false,
        message: "فشل قراءة رد التحديث"
      });

      if (data.ok) {
        setMsg(successMessage);
        await load();
      } else {
        setMsg(`❌ ${data.message || "فشل تحديث الطلب"}`);
      }
    } catch (error) {
      setMsg("❌ فشل الاتصال أثناء تحديث الطلب");
      console.error(error);
    }
  };

  const acceptOrder = async (id) => {
    await updateOrder(
      {
        order_id: id,
        status: "current",
        tracking_stage: "accepted",
        captain: user?.name || "كابتن تجريبي",
        captain_phone: "01010000000"
      },
      `🛵 تم قبول الطلب ${id}`
    );
  };

  const pickOrder = async (id) => {
    await updateOrder(
      {
        order_id: id,
        status: "current",
        tracking_stage: "picked",
        captain: user?.name || "كابتن تجريبي",
        captain_phone: "01010000000"
      },
      `📦 تم استلام الطلب ${id}`
    );
  };

  const sendOnWay = async (id) => {
    await updateOrder(
      {
        order_id: id,
        status: "current",
        tracking_stage: "onway",
        captain: user?.name || "كابتن تجريبي",
        captain_phone: "01010000000"
      },
      `🛵 الطلب ${id} في الطريق`
    );
  };

  const deliverOrder = async (id) => {
    await updateOrder(
      {
        order_id: id,
        status: "done",
        tracking_stage: "delivered",
        captain: user?.name || "كابتن تجريبي",
        captain_phone: "01010000000"
      },
      `✅ تم تسليم الطلب ${id}`
    );
  };

  const distanceInfo =
    distanceMode === "maps" && distanceKm !== null
      ? `${distanceKm.toFixed(1)} كم`
      : "حسب المنطقة";

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <div style={styles.appBg}>
      <AppHeader loading={loading} user={user} onLogout={handleLogout} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 16
        }}
      >
        <MetricCard
          label="إجمالي الطلبات"
          value={orders.length}
          color="#111827"
          soft="0 10px 22px rgba(17,24,39,0.10)"
        />
        <MetricCard
          label="المتاحة"
          value={availableOrders.length}
          color="#FF6B00"
          soft="0 10px 22px rgba(255,107,0,0.16)"
        />
        <MetricCard
          label="الجارية"
          value={currentOrders.length}
          color="#7C3AED"
          soft="0 10px 22px rgba(124,58,237,0.16)"
        />
        <MetricCard
          label="المكتملة"
          value={doneOrders.length}
          color="#0EA5E9"
          soft="0 10px 22px rgba(14,165,233,0.16)"
        />
      </div>

      <SectionCard glass style={{ marginBottom: 16, borderRadius: 24 }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 12
          }}
        >
          <NavButton active={user.role === "customer"}>👤 العميل</NavButton>
          <NavButton active={user.role === "captain"}>🛵 الكابتن</NavButton>
          <NavButton active={user.role === "admin"}>🧠 الإدارة</NavButton>
          <SecondaryButton onClick={load}>🔄 تحديث</SecondaryButton>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.72)",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 12,
            color: "#334155",
            fontWeight: 700
          }}
        >
          {msg || "جاهز"}
        </div>
      </SectionCard>

      {user.role === "customer" && (
        <CustomerPage
          orders={orders.filter(
            (o) =>
              o.customer === user.name ||
              !o.customer ||
              o.customer === "عميل جديد"
          )}
          pickup={pickup}
          setPickup={setPickup}
          dropoff={dropoff}
          setDropoff={setDropoff}
          distanceInfo={distanceInfo}
          price={price}
          createOrder={createOrder}
          quoteApproved={quoteApproved}
          setQuoteApproved={setQuoteApproved}
        />
      )}

      {user.role === "captain" && (
        <CaptainPage
          availableOrders={availableOrders}
          currentOrders={currentOrders.filter(
            (o) => !o.captain || o.captain === user.name
          )}
          acceptOrder={acceptOrder}
          pickOrder={pickOrder}
          sendOnWay={sendOnWay}
          deliverOrder={deliverOrder}
        />
      )}

      {user.role === "admin" && (
        <AdminPage orders={orders} load={load} />
      )}
    </div>
  );
}
