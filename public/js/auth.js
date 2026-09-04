/* ============================================================
   BELLO Platform — Login / Registration logic + theme & i18n
   ============================================================ */

(function () {
    "use strict";

    const I18N = {
        en: {
            back: "← Back to home",
            login: "Welcome back",
            login_sub: "Sign in to your account to continue",
            full_name: "Full Name",
            full_name_ph: "John Doe",
            email: "Email Address",
            email_ph: "user@example.com",
            password: "Password",
            password_ph: "••••••••",
            role: "Register as",
            role_student: "Student",
            role_manager: "Teacher / Manager",
            register: "Create your account",
            register_sub: "Join the BELLO platform",
            login_btn: "Sign In",
            register_btn: "Create Account",
            toggle_login: "Need an account? Register",
            toggle_register: "Already have an account? Sign in",
            err_generic: "Something went wrong. Please try again.",
            err_network: "Cannot reach the server. Please make sure the server is running at http://localhost:3000 and try again.",
            success_login: "Login successful!",
            success_register: "Welcome! Your account is ready."
        },
        fr: {
            back: "← Retour à l'accueil",
            login: "Bienvenue",
            login_sub: "Connectez-vous à votre compte pour continuer",
            full_name: "Nom complet",
            full_name_ph: "Jean Dupont",
            email: "Adresse email",
            email_ph: "vous@exemple.com",
            password: "Mot de passe",
            password_ph: "••••••••",
            role: "S'inscrire en tant que",
            role_student: "Étudiant",
            role_manager: "Enseignant / Gestionnaire",
            register: "Créez votre compte",
            register_sub: "Rejoignez la plateforme BELLO",
            login_btn: "Se connecter",
            register_btn: "Créer un compte",
            toggle_login: "Besoin d'un compte ? S'inscrire",
            toggle_register: "Déjà un compte ? Se connecter",
            err_generic: "Une erreur est survenue. Veuillez réessayer.",
            err_network: "Impossible de joindre le serveur. Vérifiez qu'il est démarré sur http://localhost:3000 puis réessayez.",
            success_login: "Connexion réussie !",
            success_register: "Bienvenue ! Votre compte est prêt."
        }
    };

    function t(key, lang) {
        const dict = I18N[lang] || I18N.en;
        return dict[key] !== undefined ? dict[key] : I18N.en[key] || key;
    }

    // When the page is opened directly from disk (file://) the API is still
    // served over http://localhost:3000, so point API calls there.
    const API_BASE = window.location.protocol === "file:" ? "http://localhost:3000" : "";

    function storedLang() {
        return localStorage.getItem("bello_lang") || "en";
    }

    function applyI18n(lang) {
        document.querySelectorAll("[data-i18n-auth]").forEach((el) => {
            el.textContent = t(el.dataset.i18nAuth, lang);
        });
        document.querySelectorAll("[data-i18n-nav]").forEach((el) => {
            el.textContent = t(el.dataset.i18nNav, lang);
        });
        document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
            el.setAttribute("placeholder", t(el.dataset.i18nPh, lang));
        });
        document.querySelectorAll("[data-i18n-opt]").forEach((el) => {
            el.textContent = t(el.dataset.i18nOpt, lang);
        });
        document.querySelectorAll(".lang-btn").forEach((b) =>
            b.classList.toggle("active", b.dataset.lang === lang)
        );
        document.documentElement.lang = lang;
        localStorage.setItem("bello_lang", lang);
    }

    document.addEventListener("DOMContentLoaded", () => {
        // Theme
        const savedTheme = localStorage.getItem("bello_theme");
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", savedTheme || (prefersDark ? "dark" : "light"));
        const toggle = document.getElementById("theme-toggle");
        if (toggle) {
            toggle.addEventListener("click", () => {
                const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
                document.documentElement.setAttribute("data-theme", next);
                localStorage.setItem("bello_theme", next);
            });
        }

        // Language
        applyI18n(storedLang());
        document.querySelectorAll(".lang-btn").forEach((btn) =>
            btn.addEventListener("click", () => applyI18n(btn.dataset.lang))
        );

        const authForm = document.getElementById("auth-form");
        const toggleAuthLink = document.getElementById("toggle-auth");
        const formTitle = document.getElementById("form-title");
        const formSub = document.getElementById("form-sub");
        const nameGroup = document.getElementById("name-group");
        const roleGroup = document.getElementById("role-group");
        const submitBtn = document.getElementById("submit-btn");
        const statusMsg = document.getElementById("form-status-msg");

        let isLogin = true;

        function setStatus(text, cls) {
            statusMsg.textContent = text || "";
            statusMsg.className = cls || "";
        }

        function toggleView() {
            isLogin = !isLogin;
            const lang = storedLang();
            if (isLogin) {
                formTitle.textContent = t("login", lang);
                formSub.textContent = t("login_sub", lang);
                submitBtn.textContent = t("login_btn", lang);
                toggleAuthLink.textContent = t("toggle_login", lang);
                nameGroup.style.display = "none";
                roleGroup.style.display = "none";
            } else {
                formTitle.textContent = t("register", lang);
                formSub.textContent = t("register_sub", lang);
                submitBtn.textContent = t("register_btn", lang);
                toggleAuthLink.textContent = t("toggle_register", lang);
                nameGroup.style.display = "block";
                roleGroup.style.display = "block";
            }
            setStatus();
        }

        toggleAuthLink.addEventListener("click", (e) => {
            e.preventDefault();
            toggleView();
        });

        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const lang = storedLang();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
            const payload = { email, password };

            let selectedRole = "student";
            if (!isLogin) {
                payload.full_name = document.getElementById("full_name").value.trim();
                payload.role = document.getElementById("role").value;
                selectedRole = payload.role;
            }

            if (!email || !password) {
                setStatus(t("err_generic", lang), "error");
                submitBtn.disabled = false;
                return;
            }

            if (!isLogin && !payload.full_name) {
                setStatus(t("err_generic", lang), "error");
                submitBtn.disabled = false;
                return;
            }

            submitBtn.disabled = true;

            try {
                const response = await fetch(API_BASE + endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || t("err_generic", lang));
                }

                if (isLogin) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("role", data.role);
                    localStorage.setItem("user_id", data.user_id);
                    localStorage.setItem("full_name", data.full_name || "");
                    localStorage.setItem("email", data.email || "");
                    setStatus(t("success_login", lang), "success");
                    if (data.role === "manager") {
                        window.location.replace("teacher-dashboard.html");
                    } else {
                        window.location.replace("student-dashboard.html");
                    }
                } else if (selectedRole === "student") {
                    // Auto sign-in so the student lands directly on their dashboard
                    try {
                        const loginRes = await fetch(API_BASE + "/api/auth/login", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email, password })
                        });
                        const loginData = await loginRes.json();
                        if (loginRes.ok) {
                            localStorage.setItem("token", loginData.token);
                            localStorage.setItem("role", loginData.role);
                            localStorage.setItem("user_id", loginData.user_id);
                            localStorage.setItem("full_name", loginData.full_name || payload.full_name);
                            localStorage.setItem("email", loginData.email || email);
                            setStatus(t("success_register", lang), "success");
                            window.location.replace("student-dashboard.html");
                            return;
                        }
                    } catch (err) { /* fall through */ }
                    setStatus(data.message || t("success_register", lang), "success");
                    setTimeout(() => {
                        isLogin = true;
                        toggleView();
                    }, 1600);
                } else {
                    setStatus(t("success_register", lang), "success");
                    setTimeout(() => {
                        isLogin = true;
                        toggleView();
                    }, 1600);
                }
            } catch (error) {
                const isNetworkError = error instanceof TypeError;
                setStatus(isNetworkError ? t("err_network", lang) : error.message, "error");
            } finally {
                submitBtn.disabled = false;
            }
        });
    });
})();
