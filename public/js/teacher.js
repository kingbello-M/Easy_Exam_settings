/* ============================================================
   BELLO Platform — Teacher / Manager dashboard logic
   Features: Overview, Exams, Messages, Students, Results,
             Inquiries, Settings (+ theme & i18n)
   ============================================================ */

(function () {
    "use strict";

    const I18N = {
        en: {
            s_overview: "Overview", s_exams: "Exams", s_messages: "Messages",
            s_students: "Students", s_results: "Results", s_inquiries: "Inquiries", s_settings: "Settings",
            overview: "Overview", exams_t: "Exams", messages_t: "Messages",
            students_t: "Students", results_t: "Results", inquiries_t: "Inquiries", settings_t: "Settings",
            ov_title: "Overview", ov_greet: "Welcome back, {name}!",
            ov_new_exam: "+ New Exam", ov_students: "Students", ov_exams: "Exams",
            ov_pending: "Pending approvals", ov_inquiries: "New inquiries", ov_recent: "Recent Exams",
            th_exam: "Exam", th_sub: "Submissions", th_status: "Status", th_questions: "Questions",
            th_actions: "Actions", th_name: "Name", th_action: "Action", th_mcq: "MCQ",
            th_struct: "Structural", th_total: "Total", loading: "Loading…",
            ex_title: "Exams", ex_sub: "Create, manage and publish your exams.", ex_new: "+ New Exam",
            ex_modal_title: "Create New Exam", ex_title_lbl: "Exam Title", ex_title_ph: "Mathematics Mid-Term",
            ex_duration: "Duration (minutes)", ex_desc: "Description", ex_questions: "Questions",
            ex_start: "Exam Start", ex_end: "Exam End",
            ex_window_hint: "Set the scheduled start and end of the exam. Students can only enter while the exam is open, and the page closes automatically once the time passes.",
            ex_window_none: "Not scheduled", ex_edit_title: "Edit Exam — {title}", ex_q_readonly: "Questions were fixed when the exam was created and cannot be changed here.",
            ex_end_after_start: "The exam end time must be after the start time.",
            ex_add_q: "+ Add Question", ex_create: "Create Exam", ex_create_success: "Exam created successfully!",
            q_text: "Question", q_text_ph: "Enter the question", q_type: "Type", q_mcq: "Multiple Choice", q_struct: "Structural",
            q_options: "Options (comma separated, e.g. A:4,B:5)", q_answer: "Correct Answer", q_points: "Points",
            btn_distribute: "Grade with AI", btn_publish: "Publish", btn_draft: "Set Draft", btn_delete: "Delete",
            bad_published: "Published", bad_draft: "Draft",
            msg_title: "Messages", msg_sub: "Communicate with all or individual students.", msg_new: "+ New Message",
            msg_sent: "Sent Messages", msg_none: "No messages sent yet.",
            msg_modal_title: "New Message", msg_to: "Send to", msg_all: "All students (broadcast)",
            msg_send: "Send Message", msg_sent_success: "Message sent!",
            st_title: "Students", st_sub: "Add students or approve pending registrations.", st_add: "+ Add Student",
            st_add_form: "Add New Student", st_name: "Name", st_name_ph: "Full Name", st_email: "Email",
            st_email_ph: "email@domain.com", st_create: "Create Student", st_pending: "Student Access",
            st_hint: "Each student created here can sign in with this email and the default password <strong>Student@123</strong>. Registration is automatic — no approval needed.",
            st_all: "All Students", st_created: "Student created successfully!",
            st_approved: "Student approved.",
            res_title: "Results", res_sub: "All student submissions across your exams.", res_none: "No results yet.",
            dl_pdf: "Download PDF", dl_pdf_error: "Failed to generate the PDF. Please try again.", dl_pdf_ok: "PDF downloaded successfully!",
            inq_title: "Inquiries", inq_sub: "Messages received from the website contact form.", inq_none: "No inquiries yet.",
            set_title: "Settings", set_sub: "Manage your profile and account security.", set_profile: "Profile",
            set_save_profile: "Save Changes", set_password: "Change Password", set_cur: "Current Password",
            set_new: "New Password", set_update_pw: "Update Password", set_profile_saved: "Profile updated!",
            set_pw_saved: "Password changed!", sent_to_all: "All students", sent_to: "Sent to",
            of_msg: "read of", recipients: "recipients", unread_badge: "unread", logout: "Logout",
            confirm_distribute: "This will evaluate all submitted answers using AI and release scores to students. Continue?",
            confirm_delete: "Delete this exam? This cannot be undone.",
            confirm_del_student: "Delete this student? Their account and data will be removed permanently.",
            success_distribute: "Results processed and published!", edit_exam: "Edit"
        },
        fr: {
            s_overview: "Vue d'ensemble", s_exams: "Examens", s_messages: "Messages",
            s_students: "Étudiants", s_results: "Résultats", s_inquiries: "Demandes", s_settings: "Paramètres",
            overview: "Vue d'ensemble", exams_t: "Examens", messages_t: "Messages",
            students_t: "Étudiants", results_t: "Résultats", inquiries_t: "Demandes", settings_t: "Paramètres",
            ov_title: "Vue d'ensemble", ov_greet: "Bon retour, {name} !",
            ov_new_exam: "+ Nouvel examen", ov_students: "Étudiants", ov_exams: "Examens",
            ov_pending: "Approbations en attente", ov_inquiries: "Nouvelles demandes", ov_recent: "Examens récents",
            th_exam: "Examen", th_sub: "Soumissions", th_status: "Statut", th_questions: "Questions",
            th_actions: "Actions", th_name: "Nom", th_action: "Action", th_mcq: "QCM",
            th_struct: "Structuré", th_total: "Total", loading: "Chargement…",
            ex_title: "Examens", ex_sub: "Créez, gérez et publiez vos examens.", ex_new: "+ Nouvel examen",
            ex_modal_title: "Créer un examen", ex_title_lbl: "Titre de l'examen", ex_title_ph: "Examen de mi-session",
            ex_duration: "Durée (minutes)", ex_desc: "Description", ex_questions: "Questions",
            ex_start: "Début de l'examen", ex_end: "Fin de l'examen",
            ex_window_hint: "Définissez le début et la fin programmés de l'examen. Les étudiants ne peuvent y accéder que pendant la période d'ouverture, et la page se ferme automatiquement une fois le temps écoulé.",
            ex_window_none: "Non programmé", ex_edit_title: "Modifier l'examen — {title}", ex_q_readonly: "Les questions ont été définies à la création et ne peuvent pas être modifiées ici.",
            ex_end_after_start: "L'heure de fin de l'examen doit être postérieure à l'heure de début.",
            ex_add_q: "+ Ajouter une question", ex_create: "Créer l'examen", ex_create_success: "Examen créé avec succès !",
            q_text: "Question", q_text_ph: "Saisissez la question", q_type: "Type", q_mcq: "Choix multiple", q_struct: "Structurée",
            q_options: "Options (séparées par virgule, ex. A:4,B:5)", q_answer: "Bonne réponse", q_points: "Points",
            btn_distribute: "Noter avec l'IA", btn_publish: "Publier", btn_draft: "Brouillon", btn_delete: "Supprimer",
            bad_published: "Publié", bad_draft: "Brouillon",
            msg_title: "Messages", msg_sub: "Communiquez avec tous ou certains étudiants.", msg_new: "+ Nouveau message",
            msg_sent: "Messages envoyés", msg_none: "Aucun message envoyé.",
            msg_modal_title: "Nouveau message", msg_to: "Envoyer à", msg_all: "Tous les étudiants (diffusion)",
            msg_send: "Envoyer le message", msg_sent_success: "Message envoyé !",
            st_title: "Étudiants", st_sub: "Ajoutez des étudiants ou approuvez les inscriptions.", st_add: "+ Ajouter",
            st_add_form: "Ajouter un étudiant", st_name: "Nom", st_name_ph: "Nom complet", st_email: "Email",
            st_email_ph: "email@domaine.com", st_create: "Créer l'étudiant", st_pending: "Accès étudiant",
            st_hint: "Chaque étudiant créé ici peut se connecter avec cet e-mail et le mot de passe par défaut <strong>Student@123</strong>. L'inscription est automatique - aucune approbation requise.",
            st_all: "Tous les étudiants", st_created: "Étudiant créé avec succès !",
            st_approved: "Étudiant approuvé.",
            res_title: "Résultats", res_sub: "Toutes les soumissions des étudiants.", res_none: "Aucun résultat.",
            dl_pdf: "Télécharger le PDF", dl_pdf_error: "Échec de la génération du PDF. Veuillez réessayer.", dl_pdf_ok: "PDF téléchargé avec succès !",
            inq_title: "Demandes", inq_sub: "Messages reçus du formulaire du site.", inq_none: "Aucune demande.",
            set_title: "Paramètres", set_sub: "Gérez votre profil et la sécurité du compte.", set_profile: "Profil",
            set_save_profile: "Enregistrer", set_password: "Changer le mot de passe", set_cur: "Mot de passe actuel",
            set_new: "Nouveau mot de passe", set_update_pw: "Mettre à jour", set_profile_saved: "Profil mis à jour !",
            set_pw_saved: "Mot de passe changé !", sent_to_all: "Tous les étudiants", sent_to: "Envoyé à",
            of_msg: "lus sur", recipients: "destinataires", unread_badge: "non lus", logout: "Déconnexion",
            confirm_distribute: "Cela évaluera toutes les réponses soumises avec l'IA et publiera les scores. Continuer ?",
            confirm_delete: "Supprimer cet examen ? Cette action est irréversible.",
            confirm_del_student: "Supprimer cet étudiant ? Son compte et ses données seront supprimés définitivement.",
            success_distribute: "Résultats traités et publiés !", edit_exam: "Modifier"
        }
    };

    let lang = localStorage.getItem("bello_lang") || "en";
    const t = (k, repl) => {
        let s = (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
        if (repl) for (const key in repl) s = s.replace("{" + key + "}", repl[key]);
        return s;
    };
    const token = localStorage.getItem("token");
    const API_BASE = window.location.protocol === "file:" ? "http://localhost:3000" : "";
    let editingExamId = null;

    // ---- Date/time helpers ----
    const pad2 = (n) => String(n).padStart(2, "0");
    const parseDT = (v) => (v ? new Date(String(v).replace(" ", "T")) : null);
    const fmtDT = (v) => {
        const d = v ? parseDT(v) : null;
        if (!d || isNaN(d.getTime())) return t("ex_window_none");
        return d.toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };
    const toInput = (v) => {
        const d = v ? parseDT(v) : null;
        if (!d || isNaN(d.getTime())) return "";
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    };

    function applyLang() {
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.dataset.i18n;
            if (key === "ov_greet") { el.textContent = t("ov_greet", { name: localStorage.getItem("full_name") || "Teacher" }); return; }
            if (I18N.en[key] !== undefined) el.textContent = t(key);
        });
        document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
            const key = el.dataset.i18nPh;
            if (I18N.en[key] !== undefined) el.setAttribute("placeholder", t(key));
        });
        document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
        document.documentElement.lang = lang;
    }

    function setStatus(el, text, cls) { if (el) { el.textContent = text || ""; el.className = "form-status" + (cls ? " " + cls : ""); } }

    function greeting() {
        const g = document.getElementById("ov-greeting");
        if (g) g.textContent = t("ov_greet", { name: localStorage.getItem("full_name") || "Teacher" });
    }

    // ---------- Sidebar navigation ----------
    function initNav() {
        document.querySelectorAll(".side-item").forEach((item) => {
            item.addEventListener("click", () => {
                document.querySelectorAll(".side-item").forEach((i) => i.classList.remove("active"));
                document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
                item.classList.add("active");
                const panel = document.getElementById("panel-" + item.dataset.panel);
                if (panel) panel.classList.add("active");
            });
        });
    }

    // ---------- Theme ----------
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

    // ---------- API helper ----------
    async function api(url, opts) {
        const res = await fetch(API_BASE + url, { ...opts, headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token, ...(opts && opts.headers) } });
        const data = await res.json().catch(() => ({}));
        return { res, data };
    }

    // ---------- Overview ----------
    async function loadOverview() {
        const { res, data } = await api("/api/teacher/stats");
        if (!res.ok) return;
        document.getElementById("stat-students").textContent = data.students || 0;
        document.getElementById("stat-exams").textContent = data.exams || 0;
        document.getElementById("stat-pending").textContent = data.pending || 0;
        document.getElementById("stat-inquiries").textContent = data.unread_contacts || 0;
        const { data: exams } = await api("/api/teacher/exams/all");
        renderOverviewExams(Array.isArray(exams) ? exams : []);
    }

    function renderOverviewExams(exams) {
        const tbody = document.getElementById("overview-exams");
        if (!exams.length) { tbody.innerHTML = '<tr><td colspan="3" class="empty-state">' + t("res_none") + "</td></tr>"; return; }
        tbody.innerHTML = exams.slice(0, 5).map((e) => `
            <tr>
                <td>${e.title}</td>
                <td>${e.submissions}</td>
                <td><span class="badge ${e.is_published ? 'badge-success' : 'badge-draft'}">${e.is_published ? t("bad_published") : t("bad_draft")}</span></td>
            </tr>`).join("");
    }

    // ---------- Exams ----------
    async function loadExams() {
        const { res, data } = await api("/api/teacher/exams/all");
        const exams = Array.isArray(data) ? data : [];
        const tbody = document.getElementById("exams-table");
        if (!exams.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">' + t("res_none") + "</td></tr>"; return; }
        tbody.innerHTML = exams.map((e) => `
            <tr>
                <td>
                    ${e.title}
                    <div class="exam-window">${fmtDT(e.start_time)} — ${fmtDT(e.end_time)}</div>
                </td>
                <td>${e.question_count || 0}</td>
                <td>${e.submissions || 0}</td>
                <td><span class="badge ${e.is_published ? 'badge-success' : 'badge-draft'}">${e.is_published ? t("bad_published") : t("bad_draft")}</span></td>
                <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <button class="btn btn-soft btn-sm" onclick="rec.edit(${e.id})">${t("edit_exam")}</button>
                        <button class="btn btn-success btn-sm" onclick="rec.distribute(${e.id})">${t("btn_distribute")}</button>
                        <button class="btn btn-soft btn-sm" onclick="rec.publish(${e.id}, ${e.is_published ? 0 : 1})">${e.is_published ? t("btn_draft") : t("btn_publish")}</button>
                        <button class="btn btn-danger btn-sm" onclick="rec.del(${e.id})">${t("btn_delete")}</button>
                    </div>
                </td>
            </tr>`).join("");
    }

    // ---------- Exam modal ----------
    function addQuestionRow(q, readOnly) {
        const list = document.getElementById("question-list");
        const row = document.createElement("div");
        row.className = "question-row";
        const ro = readOnly ? " disabled" : "";
        row.innerHTML = `
            <div class="form-field"><label>${t("q_text")}</label>
                <input type="text" class="q-text" placeholder="${t("q_text_ph")}" value="${(q && q.question_text) || ""}"${ro}>
            </div>
            <div class="form-field"><label>${t("q_type")}</label>
                <select class="q-type"${ro}>
                    <option value="multiple_choice" ${q && q.question_type === "structural" ? "" : "selected"}>${t("q_mcq")}</option>
                    <option value="structural" ${q && q.question_type === "structural" ? "selected" : ""}>${t("q_struct")}</option>
                </select>
            </div>
            <button type="button" class="q-remove" title="remove"${ro ? " style='display:none;'" : ""}>×</button>
            <div class="form-field q-opts" style="grid-column: 1/3;">
                <label>${t("q_options")}</label>
                <input type="text" class="q-options" placeholder="A:Option1, B:Option2, C:Option3, D:Option4" value="${q && q.options ? Object.values(q.options).map((v, i) => (["A","B","C","D"][i] || "") + ":" + v).join(", ") : ""}"${ro}>
            </div>
            <div class="form-field"><label>${t("q_answer")}</label>
                <input type="text" class="q-answer" placeholder="A / answer key" value="${(q && q.correct_answer) || ""}"${ro}>
            </div>
            <div class="form-field"><label>${t("q_points")}</label>
                <input type="number" class="q-points" value="${(q && q.points) || "1"}" min="0"${ro}>
            </div>
        `;
        if (!readOnly) row.querySelector(".q-remove").addEventListener("click", () => row.remove());
        list.appendChild(row);
    }

    function openExamModal(exam) {
        document.getElementById("exam-modal").classList.add("open");
        const qHint = document.getElementById("q-readonly-hint");
        const addQBtn = document.getElementById("add-question");
        if (exam) {
            editingExamId = exam.id;
            document.getElementById("exam-modal").querySelector("h2").textContent = t("ex_edit_title", { title: exam.title });
            document.getElementById("ex-title").value = exam.title;
            document.getElementById("ex-duration").value = exam.duration_minutes;
            document.getElementById("ex-desc").value = exam.description || "";
            document.getElementById("ex-start").value = toInput(exam.start_time);
            document.getElementById("ex-end").value = toInput(exam.end_time);
            const list = document.getElementById("question-list");
            list.innerHTML = "";
            (exam.questions || []).forEach((q) => addQuestionRow(q, true));
            if (qHint) qHint.style.display = "block";
            if (addQBtn) addQBtn.style.display = "none";
            list.querySelectorAll(".question-row").forEach((r) => r.style.pointerEvents = "none");
        } else {
            editingExamId = null;
            document.getElementById("exam-modal").querySelector("h2").textContent = t("ex_modal_title");
            document.getElementById("exam-form").reset();
            if (qHint) qHint.style.display = "none";
            if (addQBtn) addQBtn.style.display = "";
            document.getElementById("question-list").innerHTML = "";
            addQuestionRow();
        }
    }

    async function submitExamForm(e) {
        e.preventDefault();
        const status = document.getElementById("exam-status");
        const title = document.getElementById("ex-title").value.trim();
        const startTime = document.getElementById("ex-start").value || null;
        const endTime = document.getElementById("ex-end").value || null;

        if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
            setStatus(status, t("ex_end_after_start"), "error");
            return;
        }

        if (editingExamId) {
            const { res, data } = await api("/api/teacher/exam/" + editingExamId, {
                method: "PUT",
                body: JSON.stringify({
                    title,
                    description: document.getElementById("ex-desc").value,
                    duration_minutes: document.getElementById("ex-duration").value,
                    start_time: startTime,
                    end_time: endTime
                })
            });
            if (!res.ok) { setStatus(status, data.message || "Error", "error"); return; }
            setStatus(status, t("ex_create_success"), "success");
            document.getElementById("exam-modal").classList.remove("open");
            loadExams();
            loadOverview();
            return;
        }

        const questions = [];
        document.querySelectorAll("#question-list .question-row").forEach((row) => {
            const qtext = row.querySelector(".q-text").value.trim();
            if (!qtext) return;
            const type = row.querySelector(".q-type").value;
            const optionsText = row.querySelector(".q-options").value;
            const options = {};
            let answer = row.querySelector(".q-answer").value.trim();
            if (type === "multiple_choice") {
                (optionsText || "").split(",").forEach((part) => {
                    const m = part.trim().match(/^([A-F])\s*[:.-]\s*(.+)$/i);
                    if (m) options[m[1].toUpperCase()] = m[2].trim();
                });
                if (!answer) answer = Object.keys(options)[0] || "";
            }
            questions.push({
                question_text: qtext,
                question_type: type,
                options,
                correct_answer: answer,
                points: parseInt(row.querySelector(".q-points").value) || 1
            });
        });
        if (!questions.length) { setStatus(status, t("ex_questions") + " required", "error"); return; }

        const { res, data } = await api("/api/teacher/create-exam", {
            method: "POST",
            body: JSON.stringify({
                title,
                description: document.getElementById("ex-desc").value,
                duration_minutes: document.getElementById("ex-duration").value,
                start_time: startTime,
                end_time: endTime,
                questions
            })
        });
        if (!res.ok) { setStatus(status, data.message || "Error", "error"); return; }
        setStatus(status, t("ex_create_success"), "success");
        document.getElementById("exam-modal").classList.remove("open");
        loadExams();
        loadOverview();
    }

    // ---------- Messaging ----------
    async function loadStudentsForMsg() {
        const { res, data } = await api("/api/teacher/students");
        const students = Array.isArray(data) ? data : [];
        const opts = document.getElementById("student-opts");
        opts.innerHTML = students.map((s) => `
            <label class="student-opt">
                <input type="radio" name="msg-target" value="${s.id}">
                <span>${s.full_name} <small style="color:var(--text-muted)">(${s.email})</small></span>
            </label>`).join("");
    }

    async function loadSentMessages() {
        const { res, data } = await api("/api/teacher/messages");
        const messages = Array.isArray(data) ? data : [];
        const list = document.getElementById("sent-messages");
        if (!messages.length) { list.innerHTML = '<p class="empty-state">' + t("msg_none") + "</p>"; return; }
        list.innerHTML = messages.map((m) => {
            const tag = m.is_broadcast ? '<span class="msg-tag broadcast">' + t("sent_to_all") + "</span>" : "";
            return `
            <div class="message-item">
                <div class="msg-head">
                    <strong>${m.subject} ${tag}</strong>
                    <span class="msg-meta">${new Date(m.created_at).toLocaleString()} · ${m.read_count} ${t("of_msg")} ${m.recipients} ${t("recipients")}</span>
                </div>
                <p>${m.body}</p>
            </div>`;
        }).join("");
    }

    async function submitMsg(e) {
        e.preventDefault();
        const status = document.getElementById("msg-status");
        const target = document.querySelector('input[name="msg-target"]:checked');
        const recipient_id = target && target.value !== "all" ? target.value : null;
        const body = {
            subject: document.getElementById("msg-subject").value.trim(),
            body: document.getElementById("msg-body").value.trim()
        };
        if (recipient_id) body.recipient_id = recipient_id;

        const { res, data } = await api("/api/teacher/send-message", { method: "POST", body: JSON.stringify(body) });
        if (!res.ok) { setStatus(status, data.message || "Error", "error"); return; }
        setStatus(status, t("msg_sent_success"), "success");
        document.getElementById("msg-modal").classList.remove("open");
        document.getElementById("msg-form").reset();
        loadSentMessages();
    }

    // ---------- Students ----------
    async function loadStudents() {
        const { res, data } = await api("/api/teacher/students");
        const students = Array.isArray(data) ? data : [];
        const tbody = document.getElementById("all-students-table");
        if (!students.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty-state">' + t("res_none") + "</td></tr>"; return; }
        tbody.innerHTML = students.map((s) => `
            <tr>
                <td>${s.full_name}</td>
                <td>${s.email}</td>
                <td><span class="badge badge-approved">Active</span></td>
                <td class="text-right"><button class="btn btn-danger btn-sm" title="Delete" onclick="rec.deleteStudent(${s.id}, this)">Delete</button></td>
            </tr>`).join("");
    }

    async function loadPending() {
        const tbody = document.getElementById("pending-students-table");
        if (tbody) tbody.innerHTML = "";
    }

    // ---------- Results ----------
    async function loadResults() {
        const { res, data } = await api("/api/teacher/all-results");
        const results = Array.isArray(data) ? data : [];
        const tbody = document.getElementById("results-table");
        if (!results.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">' + t("res_none") + "</td></tr>"; return; }
        tbody.innerHTML = results.map((r) => `
            <tr>
                <td>${r.student_name}</td>
                <td>${r.exam_title}</td>
                <td>${r.mcq_score || 0}</td>
                <td>${r.structural_score || 0}</td>
                <td><strong>${r.total_score || 0}</strong></td>
            </tr>`).join("");
    }

    // ---------- Inquiries ----------
    async function loadInquiries() {
        const { res, data } = await api("/api/teacher/contacts");
        const messages = Array.isArray(data) ? data : [];
        const list = document.getElementById("inquiry-list");
        if (!messages.length) { list.innerHTML = '<p class="empty-state">' + t("inq_none") + "</p>"; return; }
        list.innerHTML = messages.map((m) => `
            <div class="message-item ${m.is_read ? "" : "unread"}" onclick="rec.markContact(${m.id}); this.classList.remove('unread')" style="cursor:pointer;">
                <div class="msg-head">
                    <strong>${m.subject || "(No subject)"}</strong>
                    <span class="msg-meta">${m.sender_name} · ${m.sender_email} · ${new Date(m.submitted_at).toLocaleString()}</span>
                </div>
                <p>${m.message}</p>
            </div>`).join("");
    }

    // ---------- Settings ----------
    async function loadProfile() {
        const { res, data } = await api("/api/teacher/profile");
        if (!res.ok) return;
        document.getElementById("p-name").value = data.full_name || "";
        document.getElementById("p-email").value = data.email || "";
        localStorage.setItem("full_name", data.full_name || "");
        localStorage.setItem("email", data.email || "");
        document.getElementById("dash-user").textContent = data.full_name || "Teacher";
        greeting();
    }

    async function submitProfile(e) {
        e.preventDefault();
        const status = document.getElementById("profile-status");
        const { res, data } = await api("/api/teacher/profile", {
            method: "PUT",
            body: JSON.stringify({ full_name: document.getElementById("p-name").value.trim(), email: document.getElementById("p-email").value.trim() })
        });
        if (!res.ok) { setStatus(status, data.message || "Error", "error"); return; }
        localStorage.setItem("full_name", document.getElementById("p-name").value.trim());
        setStatus(status, t("set_profile_saved"), "success");
        greeting();
        document.getElementById("dash-user").textContent = document.getElementById("p-name").value.trim();
    }

    async function submitPassword(e) {
        e.preventDefault();
        const status = document.getElementById("password-status");
        const body = { current_password: document.getElementById("pw-current").value, new_password: document.getElementById("pw-new").value };
        const { res, data } = await api("/api/teacher/change-password", { method: "PUT", body: JSON.stringify(body) });
        if (!res.ok) { setStatus(status, data.message || "Error", "error"); return; }
        setStatus(status, t("set_pw_saved"), "success");
        document.getElementById("password-form").reset();
    }

    // ---------- Actions exposed to inline handlers ----------
    window.rec = {
        distribute: async (id) => { if (!confirm(t("confirm_distribute"))) return; await api("/api/teacher/distribute-results/" + id, { method: "POST" }); loadExams(); loadOverview(); },
        publish: async (id, val) => { await api("/api/teacher/exam/" + id + "/publish", { method: "PUT", body: JSON.stringify({ is_published: val }) }); loadExams(); loadOverview(); },
        del: async (id) => { if (!confirm(t("confirm_delete"))) return; await api("/api/teacher/exam/" + id, { method: "DELETE" }); loadExams(); loadOverview(); },
        edit: async (id) => {
            const { res, data } = await api("/api/teacher/exam/" + id);
            if (res.ok && data.id) openExamModal(data);
        },
        downloadPdf: async () => {
            const btn = document.getElementById("results-pdf-btn");
            const label = btn ? btn.querySelector("span") : null;
            if (btn) btn.disabled = true;
            if (label) label.textContent = t("loading");
            try {
                const res = await fetch(API_BASE + "/api/teacher/results/pdf", { headers: { "Authorization": "Bearer " + token } });
                if (!res.ok) { alert(t("dl_pdf_error")); return; }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "results-report-" + new Date().toISOString().slice(0, 10) + ".pdf";
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 2000);
                alert(t("dl_pdf_ok"));
            } catch (err) {
                console.error("PDF download error:", err);
                alert(t("dl_pdf_error"));
            } finally {
                if (btn) btn.disabled = false;
                if (label) label.textContent = t("dl_pdf");
            }
        },
        approve: async (id) => { await api("/api/teacher/approve-student/" + id, { method: "PUT" }); loadPending(); loadOverview(); },
        deleteStudent: async (id, btn) => { if (!confirm(t("confirm_del_student"))) return; const { res } = await api("/api/teacher/student/" + id, { method: "DELETE" }); loadStudents(); loadStudentsForMsg(); loadOverview(); },
        markContact: async (id) => { await api("/api/teacher/contact/" + id + "/read", { method: "PUT" }); }
    };

    // ---------- Boot ----------
    document.addEventListener("DOMContentLoaded", () => {
        if (!token || localStorage.getItem("role") !== "manager") { window.location.href = "login.html"; return; }
        document.getElementById("dash-user").textContent = localStorage.getItem("full_name") || "Teacher";

        initTheme();
        initNav();
        applyLang();
        greeting();

        document.querySelectorAll(".lang-btn").forEach((b) => b.addEventListener("click", () => {
            lang = b.dataset.lang; localStorage.setItem("bello_lang", lang); applyLang(); refreshAll();
        }));

        document.getElementById("logout-btn").addEventListener("click", () => {
            localStorage.removeItem("token"); localStorage.removeItem("role"); localStorage.removeItem("full_name");
            window.location.href = "login.html";
        });

        // Modals
        document.getElementById("new-exam-open").addEventListener("click", () => openExamModal());
        document.getElementById("quick-new-exam").addEventListener("click", () => openExamModal());
        document.getElementById("new-msg-open").addEventListener("click", () => { document.getElementById("msg-modal").classList.add("open"); });
        document.querySelectorAll(".modal-close").forEach((btn) => {
            btn.addEventListener("click", () => document.getElementById(btn.dataset.close).classList.remove("open"));
        });
        document.querySelectorAll(".modal-overlay").forEach((ov) => {
            ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.remove("open"); });
        });

        document.getElementById("add-question").addEventListener("click", () => addQuestionRow());
        document.getElementById("exam-form").addEventListener("submit", submitExamForm);
        document.getElementById("msg-form").addEventListener("submit", submitMsg);
        document.getElementById("add-student-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const status = document.getElementById("add-status");
            const { res, data } = await api("/api/teacher/add-student", {
                method: "POST",
                body: JSON.stringify({ full_name: document.getElementById("s-name").value.trim(), email: document.getElementById("s-email").value.trim() })
            });
            if (!res.ok) { setStatus(status, data.message || "Error", "error"); return; }
            setStatus(status, t("st_created"), "success");
            document.getElementById("add-student-form").reset();
            loadStudents(); loadPending(); loadStudentsForMsg(); loadOverview();
        });
        document.getElementById("profile-form").addEventListener("submit", submitProfile);
        document.getElementById("password-form").addEventListener("submit", submitPassword);

        loadProfile();
        refreshAll();
    });

    function refreshAll() {
        loadOverview();
        loadExams();
        loadSentMessages();
        loadStudents();
        loadStudentsForMsg();
        loadPending();
        loadResults();
        loadInquiries();
    }
})();
