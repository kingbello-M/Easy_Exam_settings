/* ============================================================
   BELLO Platform — Student portal logic
   Exams (professional in-page taking) · Results · Inbox
   ============================================================ */

(function () {
    "use strict";

    const I18N = {
        en: {
            s_overview: "Exams", s_exams: "Exams", s_results: "Results", s_messages: "Messages",
            st_exams_title: "My Exams", st_exams_sub: "Available exams ready for you to take.",
            th_exam: "Exam", th_dur: "Duration", th_action: "Action", th_score: "Score", th_feedback: "AI Feedback",
            th_status: "Status", st_window: "Exam window", st_started: "Open", st_not_started: "Not started", st_expired: "Expired",
            st_exam_not_started: "You cannot enter this exam yet: it has not started.",
            st_exam_expired: "You were not able to enter the exam because the examination time has passed.",
            st_time_left: "Time left", st_time_up: "The exam time has passed. Your exam page has been closed automatically.",
            st_starts: "Starts", st_closes: "Ends",
            loading: "Loading…", exams_none: "No exams available", btn_start: "Start Exam", mins: "Mins",
            res_title: "My Results", res_sub: "Your published scores and AI feedback.", results_none: "No results published yet.",
            msg_title: "Messages", msg_sub: "Messages from your teacher.", inbox_none: "No messages yet.",
            submit_exam: "Submit Exam", submitting: "Submitting…", q_mcq: "Choose one answer:", q_struct: "Your answer:",
            points: "points", no_questions: "This exam has no questions yet.", success_submit: "Exam submitted successfully! Waiting for your teacher to publish AI results.",
            pending_feedback: "Pending AI evaluation.", unread: "unread"
        },
        fr: {
            s_overview: "Examens", s_exams: "Examens", s_results: "Résultats", s_messages: "Messages",
            st_exams_title: "Mes examens", st_exams_sub: "Les examens disponibles que vous pouvez passer.",
            th_exam: "Examen", th_dur: "Durée", th_action: "Action", th_score: "Score", th_feedback: "Retour IA",
            th_status: "Statut", st_window: "Fenêtre d'examen", st_started: "Ouvert", st_not_started: "Pas encore commencé", st_expired: "Expiré",
            st_exam_not_started: "Vous ne pouvez pas encore entrer dans cet examen : il n'a pas commencé.",
            st_exam_expired: "Vous n'avez pas pu entrer dans l'examen car le temps est écoulé.",
            st_time_left: "Temps restant", st_time_up: "Le temps de l'examen est écoulé. Votre page d'examen a été fermée automatiquement.",
            st_starts: "Commence", st_closes: "Se termine",
            loading: "Chargement…", exams_none: "Aucun examen disponible", btn_start: "Commencer", mins: "min",
            res_title: "Mes résultats", res_sub: "Vos scores publiés et retours IA.", results_none: "Aucun résultat publié.",
            msg_title: "Messages", msg_sub: "Messages de votre enseignant.", inbox_none: "Aucun message.",
            submit_exam: "Soumettre l'examen", submitting: "Soumission…", q_mcq: "Choisissez une réponse :", q_struct: "Votre réponse :",
            points: "points", no_questions: "Cet examen n'a pas encore de questions.", success_submit: "Examen soumis avec succès ! En attente de la publication des résultats IA.",
            pending_feedback: "Évaluation IA en attente.", unread: "non lus"
        }
    };

    let lang = localStorage.getItem("bello_lang") || "en";
    const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
    const token = localStorage.getItem("token");
    const API_BASE = window.location.protocol === "file:" ? "http://localhost:3000" : "";
    let tabSwitchCount = 0;
    let currentExam = null;
    let answers = [];
    let timerInterval = null;
    let examDeadline = 0;

    const pad2 = (n) => String(n).padStart(2, "0");
    const parseDT = (v) => (v ? new Date(String(v).replace(" ", "T")) : null);
    const fmtDT = (v) => {
        if (!v) return "—";
        const d = parseDT(v);
        return !d || isNaN(d.getTime()) ? String(v) : d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    // ---- Toast notifications ----
    let toastTimer = null;
    function showToast(message, type) {
        const el = document.getElementById("toast");
        if (!el) return;
        el.textContent = message;
        el.className = "toast" + (type ? " " + type : "");
        el.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove("show"), 5000);
    }

    // ---- Exam time window helpers ----
    const examStatus = (e) => {
        const now = Date.now();
        const start = e.start_time ? parseDT(e.start_time).getTime() : null;
        const end = e.end_time ? parseDT(e.end_time).getTime() : null;
        if (start && now < start) return "not_started";
        if (end && now > end) return "expired";
        return "open";
    };

    const examStatusBadge = (status) => {
        const map = { open: ["badge-success", t("st_started")], not_started: ["badge-draft", t("st_not_started")], expired: ["badge-pending", t("st_expired")] };
        const [cls, label] = map[status] || map.open;
        return `<span class="badge ${cls}">${label}</span>`;
    };

    function applyLang() {
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.dataset.i18n;
            if (I18N.en[key] !== undefined) el.textContent = t(key);
        });
        document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
        document.documentElement.lang = lang;
    }

    function initNav() {
        document.querySelectorAll(".side-item").forEach((item) => {
            item.addEventListener("click", () => {
                document.querySelectorAll(".side-item").forEach((i) => i.classList.remove("active"));
                document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
                item.classList.add("active");
                const panel = document.getElementById("panel-" + item.dataset.panel);
                if (panel) panel.classList.add("active");
                if (item.dataset.panel === "messages") loadInbox();
            });
        });
    }

    function initTheme() {
        const saved = localStorage.getItem("bello_theme");
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));
        document.getElementById("theme-toggle").addEventListener("click", () => {
            const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem("bello_theme", next);
        });
    }

    async function api(url, opts) {
        const res = await fetch(API_BASE + url, { ...opts, headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token, ...(opts && opts.headers) } });
        const data = await res.json().catch(() => ({}));
        return { res, data };
    }

    async function loadExams() {
        const { res, data } = await api("/api/student/exams");
        const exams = Array.isArray(data) ? data : [];
        const tbody = document.getElementById("exams-table");
        if (!exams.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty-state">' + t("exams_none") + "</td></tr>"; return; }
        tbody.innerHTML = exams.map((e) => {
            const status = examStatus(e);
            const startMs = e.start_time ? parseDT(e.start_time).getTime() : null;
            const endMs = e.end_time ? parseDT(e.end_time).getTime() : null;
            const windowStr = startMs && (status === "open" || status === "not_started")
                ? fmtDT(e.start_time) + " — " + (endMs ? fmtDT(e.end_time) : "…")
                : (endMs && status === "expired" ? fmtDT(e.start_time) + " — " + fmtDT(e.end_time) : t("st_window"));
            const locked = status !== "open";
            return `
            <tr>
                <td>
                    ${e.title}
                    <div class="exam-window">${windowStr}</div>
                </td>
                <td>${e.duration_minutes} ${t("mins")}</td>
                <td>${examStatusBadge(status)}</td>
                <td><button class="btn btn-primary btn-sm" ${locked ? 'style="opacity:.6"' : ""} onclick="rec.startExam(${e.id})">${t("btn_start")}</button></td>
            </tr>`;
        }).join("");
    }

    async function loadResults() {
        const { res, data } = await api("/api/student/my-results");
        const results = Array.isArray(data) ? data : [];
        const tbody = document.getElementById("results-table");
        if (!results.length) { tbody.innerHTML = '<tr><td colspan="3" class="empty-state">' + t("results_none") + "</td></tr>"; return; }
        tbody.innerHTML = results.map((r) => `
            <tr>
                <td>${r.exam_title}</td>
                <td><strong>${r.total_score}</strong></td>
                <td>${r.ai_feedback || t("pending_feedback")}</td>
            </tr>`).join("");
    }

    async function loadInbox() {
        const { res, data } = await api("/api/student/messages");
        const messages = (data && data.messages) || [];
        const list = document.getElementById("inbox-list");
        if (!messages.length) { list.innerHTML = '<p class="empty-state">' + t("inbox_none") + "</p>"; }
        list.innerHTML = messages.map((m) => {
            const tag = m.is_broadcast ? '<span class="msg-tag broadcast">' + t("s_messages") + "</span>" : "";
            return `
            <div class="message-item ${m.is_read ? "" : "unread"}" onclick="rec.markRead(${m.recipient_row}); this.classList.remove('unread')" style="cursor:pointer;">
                <div class="msg-head">
                    <strong>${m.subject} ${tag}</strong>
                    <span class="msg-meta">${m.sender_name} · ${new Date(m.created_at).toLocaleString()}</span>
                </div>
                <p>${m.body}</p>
            </div>`;
        }).join("");
        const badge = document.getElementById("msg-badge");
        if (badge) { badge.textContent = (data.unread || 0); badge.style.display = data.unread ? "inline-block" : "none"; }
    }

    function stopTimer() {
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    }

    function closeExamModal() {
        stopTimer();
        document.getElementById("exam-modal").classList.remove("open");
        document.getElementById("exam-timer-bar").style.display = "none";
        currentExam = null;
        loadExams();
    }

    function examTimeUp() {
        stopTimer();
        showToast(t("st_time_up"), "warn");
        closeExamModal();
    }

    function startTimer() {
        stopTimer();
        const el = document.getElementById("exam-timer");
        const tick = () => {
            const remaining = examDeadline - Date.now();
            if (remaining <= 0) { examTimeUp(); return; }
            const total = Math.floor(remaining / 1000);
            const mm = pad2(Math.floor(total / 60));
            const ss = pad2(total % 60);
            if (el) { el.textContent = mm + ":" + ss; el.classList.toggle("warn", remaining < 60000); }
        };
        tick();
        timerInterval = setInterval(tick, 1000);
    }

    async function startExam(examId) {
        const { res, data } = await api("/api/student/exams/" + examId);
        if (!res.ok) {
            showToast(data && data.message ? data.message : t("st_exam_expired"), "error");
            return;
        }
        currentExam = data;
        if (!currentExam.questions || !currentExam.questions.length) { showToast(t("no_questions"), "error"); return; }
        answers = currentExam.questions.map(() => "");
        renderExam();

        const durMs = (parseInt(currentExam.duration_minutes) || 0) * 60000;
        examDeadline = Date.now() + (durMs > 0 ? durMs : 30 * 60000);
        if (currentExam.end_time) {
            const endDate = parseDT(currentExam.end_time);
            if (endDate && !isNaN(endDate.getTime())) examDeadline = Math.min(examDeadline, endDate.getTime());
        }
        document.getElementById("exam-timer-bar").style.display = "flex";
        document.getElementById("exam-modal").classList.add("open");
        startTimer();
    }

    function renderExam() {
        document.getElementById("exam-modal-title").textContent = currentExam.title;
        const box = document.getElementById("exam-questions");
        box.innerHTML = currentExam.questions.map((q, i) => {
            const isMcq = q.question_type === "multiple_choice";
            let inner = `<div class="qa-item" data-idx="${i}">`;
            inner += `<div class="q-text">${i + 1}. (${q.points} ${t("points")}) ${q.question_text}</div>`;
            if (isMcq) {
                const opts = q.options || {};
                const letters = ["A", "B", "C", "D", "E", "F"];
                const values = Array.isArray(opts) ? opts : letters.map((l) => opts[l]).filter((v) => v !== undefined && v !== null && v !== "");
                values.forEach((v, j) => {
                    const val = Array.isArray(opts) ? letters[j] : Object.keys(opts)[j];
                    inner += `
                        <label class="qa-option">
                            <input type="radio" name="q-${i}" value="${val}" data-idx="${i}" data-letter="${letters[j]}">
                            <span>${letters[j]}) ${v}</span>
                        </label>`;
                });
            } else {
                inner += `<textarea class="qa-textarea" data-idx="${i}" placeholder="${t("q_struct")}"></textarea>`;
            }
            inner += `</div>`;
            return inner;
        }).join("");

        box.querySelectorAll('input[type="radio"][data-idx]').forEach((r) => {
            r.addEventListener("change", () => answers[parseInt(r.dataset.idx)] = r.value);
        });
        box.querySelectorAll("textarea[data-idx]").forEach((tx) => {
            tx.addEventListener("input", () => answers[parseInt(tx.dataset.idx)] = tx.value);
        });
    }

    async function submitExam() {
        const btn = document.getElementById("exam-submit");
        const status = document.getElementById("exam-status");
        if (!currentExam) return;
        for (let i = 0; i < currentExam.questions.length; i++) {
            const q = currentExam.questions[i];
            const answer = answers[i];
            if (!answer) {
                if (q.question_type === "structural") { setStatus(status, t("q_struct") + " " + (i + 1), "error"); return; }
                setStatus(status, t("q_mcq") + " " + (i + 1), "error"); return;
            }
        }
        const payload = {
            exam_id: currentExam.id,
            answers: currentExam.questions.map((q, i) => ({ question_id: q.id, response: answers[i].trim() })),
            tab_switches: tabSwitchCount
        };
        btn.disabled = true;
        btn.textContent = t("submitting");
        setStatus(status, "", "");
        const { res, data } = await api("/api/student/submit-exam", { method: "POST", body: JSON.stringify(payload) });
        if (!res.ok) { setStatus(status, data.message || "Error", "error"); btn.disabled = false; btn.textContent = t("submit_exam"); return; }
        setStatus(status, t("success_submit"), "success");
        currentExam = null;
        stopTimer();
        setTimeout(() => { document.getElementById("exam-modal").classList.remove("open"); document.getElementById("exam-timer-bar").style.display = "none"; loadExams(); loadResults(); btn.disabled = false; btn.textContent = t("submit_exam"); setStatus(status, "", ""); }, 1800);
    }

    function setStatus(el, txt, cls) { if (el) { el.textContent = txt || ""; el.className = "form-status" + (cls ? " " + cls : ""); } }

    window.rec = {
        startExam,
        markRead: async (id) => { await api("/api/student/message/" + id + "/read", { method: "PUT" }); loadInbox(); }
    };

    document.addEventListener("DOMContentLoaded", () => {
        if (!token || localStorage.getItem("role") !== "student") { window.location.href = "login.html"; return; }
        document.getElementById("dash-user").textContent = localStorage.getItem("full_name") || "Student";

        initTheme();
        initNav();
        applyLang();

        document.querySelectorAll(".lang-btn").forEach((b) => b.addEventListener("click", () => {
            lang = b.dataset.lang; localStorage.setItem("bello_lang", lang); applyLang(); loadExams(); loadResults(); loadInbox();
        }));

        document.getElementById("logout-btn").addEventListener("click", () => {
            localStorage.removeItem("token"); localStorage.removeItem("role"); localStorage.removeItem("full_name");
            window.location.href = "login.html";
        });

        document.getElementById("exam-close").addEventListener("click", closeExamModal);
        document.getElementById("exam-modal").addEventListener("click", (e) => { if (e.target === document.getElementById("exam-modal")) closeExamModal(); });
        document.getElementById("exam-submit").addEventListener("click", submitExam);

        document.addEventListener("visibilitychange", () => { if (document.hidden) tabSwitchCount++; });

        loadExams();
        loadResults();
        loadInbox();
    });
})();
