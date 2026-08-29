/* ============================================================
   CUPE Platform — Landing page logic
   Theme toggle · Language switching (EN/FR) · Animations · Contact
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- Translations (EN / FR) ---------------- */
    const I18N = {
        en: {
            nav_home: "Home",
            nav_features: "Features",
            nav_services: "Services",
            nav_how: "How it works",
            nav_about: "About",
            nav_contact: "Contact",
            nav_login: "Sign In",

            hero_badge: "Powered by Artificial Intelligence",
            hero_title: "The Smarter Way to Manage & Grade Exams",
            hero_subtitle: "CUPE is an AI-powered exam management platform for educators. Create exams, enroll students, chat with your class, and let artificial intelligence grade every answer with instant, personalized feedback.",
            hero_cta: "Get Started Free",
            hero_cta2: "See How It Works",
            trust_text: "Trusted by 500+ educators worldwide",
            fc1_t: "Exam Auto-Graded",
            fc1_d: "AI finished in 0.3s",
            fc2_t: "New Message",
            fc2_d: "From your teacher",
            fc3_t: "100% Secure",
            fc3_d: "Anti-cheat enabled",
            trusted_by: "Trusted by leading institutions",

            stat_exams: "Exams graded",
            stat_institutions: "Active students",
            stat_accuracy: "Grading accuracy",
            stat_time: "Avg. grade time",

            features_tag: "Features",
            features_title: "Everything you need to run exams effortlessly",
            features_sub: "From exam creation to AI grading and student messaging, CUPE automates the entire assessment lifecycle.",
            f1_t: "AI Auto-Grading",
            f1_d: "Structural and multiple-choice answers evaluated automatically by Google Gemini with rich diagnostic feedback for every student.",
            f2_t: "Anti-Cheat Security",
            f2_d: "Automatic tab-switch monitoring, IP logging and suspicious-activity flags keep your exams fair and trustworthy.",
            f3_t: "Student Management",
            f3_d: "Bulk-create student accounts, approve pending registrations, and control access all from one intuitive dashboard.",
            f4_t: "Instant Results",
            f4_d: "Publish AI-evaluated results the moment exams close. Students see their scores and personalized feedback in real time.",
            f5_t: "Smart Messaging",
            f5_d: "Send announcements to all students or chat with individuals directly — built right into the platform.",
            f6_t: "Exam Analytics",
            f6_d: "Track submission counts, publication status and performance at a glance with clean, actionable exam overviews.",

            services_tag: "Services",
            services_title: "One platform, endless possibilities",
            services_sub: "Everything an educator needs, beautifully integrated.",
            svc1_t: "Exam Builder",
            svc1_d: "Design professional exams with unlimited questions, multiple-choice and structural types, and custom point values.",
            svc2_t: "AI Grading Engine",
            svc2_d: "Google Gemini evaluates every answer in seconds, delivering fair scores and detailed, personalized feedback.",
            svc3_t: "Classroom Chat",
            svc3_d: "Broadcast announcements or send direct messages to individual students — instant, secure communication.",
            svc4_t: "Real-time Analytics",
            svc4_d: "Live dashboards show results, submission status and class performance so you always know where you stand.",
            svc_more: "Learn more →",

            how_tag: "How it works",
            how_title: "Three simple steps",
            how_sub: "Get your institution up and running in minutes.",
            s1_t: "Create & Enroll",
            s1_d: "Set up exams, manage question banks, and add students to your class with a single click.",
            s2_t: "Students Take Exams",
            s2_d: "Students log in and complete secure, monitored exams with automatic anti-cheat protection.",
            s3_t: "AI Grades & Publishes",
            s3_d: "One click distributes results. Every answer is graded by AI and personalized feedback is delivered instantly.",

            about_tag: "About CUPE",
            about_title: "Built for modern educators",
            about_p1: "CUPE was created to free teachers from the repetitive burden of grading. By combining a robust exam management system with cutting-edge AI, we give educators back their most valuable resource: time.",
            about_p2: "Security, fairness and clarity are at the core of everything we build. Every result is transparent, every submission is protected, and every student receives feedback that helps them grow.",
            about_c1: "Secure JWT-based authentication & role-based access",
            about_c2: "Responsive, accessible & beautiful on any device",
            about_c3: "Fully bilingual — English & French",

            test_tag: "Testimonials",
            test_title: "Loved by educators",
            test_sub: "Here's what teachers say about managing exams with CUPE.",
            test1_q: "CUPE cut my grading time by 90%. The AI feedback is shockingly accurate and my students love the instant feedback.",
            test1_role: "Physics Professor",
            test2_q: "The messaging feature is a game changer. I can reach my whole class or individual students instantly, all in one place.",
            test2_role: "High School Teacher",
            test3_q: "The anti-cheat protection gives me total confidence in my exams. Setup took minutes and the dashboards are gorgeous.",
            test3_role: "Dean of Academics",

            contact_tag: "Contact",
            contact_title: "Get in touch",
            contact_sub: "Questions or a demo request? Reach the teacher, Dchoupe Fotie Valdese Jordan, directly below.",
            ci_email_label: "Email",
            ci_loc_label: "Location",
            ci_loc: "Cameroon — online",
            ci_call_label: "Phone",
            cf_name: "Full Name",
            cf_name_ph: "Jane Doe",
            cf_email: "Email Address",
            cf_email_ph: "you@example.com",
            cf_subject: "Subject",
            cf_subject_ph: "How can we help?",
            cf_message: "Message",
            cf_message_ph: "Write your message here…",
            cf_send: "Send Message",
            cf_sending: "Sending…",
            cf_success: "Thank you! Your message has been sent. We'll get back to you soon.",
            cf_error: "Something went wrong. Please try again.",

            cta_title: "Ready to transform the way you teach?",
            cta_sub: "Join thousands of educators using CUPE to save time and improve outcomes.",
            cta_btn: "Get Started — It's Free",
            cta_btn2: "Talk to Sales",

            footer_desc: "The AI-powered exam management platform for modern educators and institutions.",
            footer_nav: "Platform",
            footer_res: "Resources",
            footer_help: "Help Center",
            footer_support: "Support",
            footer_legal: "Legal",
            footer_privacy: "Privacy Policy",
            footer_terms: "Terms of Service",
            footer_rights: "All rights reserved.",
            health_online: "All systems operational",
            health_offline: "Service temporarily unavailable"
        },

        fr: {
            nav_home: "Accueil",
            nav_features: "Fonctionnalités",
            nav_services: "Services",
            nav_how: "Comment ça marche",
            nav_about: "À propos",
            nav_contact: "Contact",
            nav_login: "Connexion",

            hero_badge: "Propulsé par l'Intelligence Artificielle",
            hero_title: "La façon intelligente de gérer et noter vos examens",
            hero_subtitle: "CUPE est une plateforme de gestion d'examens alimentée par l'IA pour les enseignants. Créez des examens, inscrivez des étudiants, discutez avec votre classe et laissez l'IA noter chaque réponse avec un retour personnalisé instantané.",
            hero_cta: "Commencer Gratuitement",
            hero_cta2: "Voir comment ça marche",
            trust_text: "Approuvé par plus de 500 enseignants dans le monde",
            fc1_t: "Examen noté automatiquement",
            fc1_d: "IA terminée en 0,3 s",
            fc2_t: "Nouveau message",
            fc2_d: "De votre enseignant",
            fc3_t: "100% sécurisé",
            fc3_d: "Anti-triche activé",
            trusted_by: "Approuvé par les grandes institutions",

            stat_exams: "Examens notés",
            stat_institutions: "Étudiants actifs",
            stat_accuracy: "Précision de la notation",
            stat_time: "Temps moyen",

            features_tag: "Fonctionnalités",
            features_title: "Tout ce qu'il vous faut pour gérer vos examens sans effort",
            features_sub: "De la création d'examens à la notation IA et à la messagerie étudiante, CUPE automatise tout le cycle d'évaluation.",
            f1_t: "Notation automatique par IA",
            f1_d: "Les réponses structurées et à choix multiples sont évaluées automatiquement par Google Gemini avec un retour diagnostique détaillé pour chaque étudiant.",
            f2_t: "Sécurité anti-triche",
            f2_d: "Surveillance des changements d'onglet, journalisation IP et alertes d'activité suspecte pour des examens équitables.",
            f3_t: "Gestion des étudiants",
            f3_d: "Créez des comptes en masse, approuvez les inscriptions et contrôlez l'accès depuis un tableau de bord intuitif.",
            f4_t: "Résultats instantanés",
            f4_d: "Publiez les résultats évalués par l'IA dès la fin des examens. Les étudiants voient leurs scores et retours en temps réel.",
            f5_t: "Messagerie intelligente",
            f5_d: "Envoyez des annonces à tous les étudiants ou discutez directement avec chacun — intégré à la plateforme.",
            f6_t: "Analyses d'examens",
            f6_d: "Suivez les soumissions, l'état de publication et les performances d'un coup d'œil grâce à des aperçus clairs.",

            services_tag: "Services",
            services_title: "Une plateforme, des possibilités infinies",
            services_sub: "Tout ce dont un enseignant a besoin, intégré avec élégance.",
            svc1_t: "Créateur d'examens",
            svc1_d: "Concevez des examens professionnels avec des questions illimitées, des types à choix multiples et structurés, et des points personnalisés.",
            svc2_t: "Moteur de notation IA",
            svc2_d: "Google Gemini évalue chaque réponse en quelques secondes, avec des scores justes et des retours détaillés et personnalisés.",
            svc3_t: "Chat de classe",
            svc3_d: "Diffusez des annonces ou envoyez des messages directs à chaque étudiant — une communication instantanée et sécurisée.",
            svc4_t: "Analyses en temps réel",
            svc4_d: "Les tableaux de bord en direct montrent les résultats, l'état des soumissions et les performances de la classe.",
            svc_more: "En savoir plus →",

            how_tag: "Comment ça marche",
            how_title: "Trois étapes simples",
            how_sub: "Mettez votre établissement en place en quelques minutes.",
            s1_t: "Créez et inscrivez",
            s1_d: "Configurez des examens, gérez les banques de questions et ajoutez des étudiants d'un simple clic.",
            s2_t: "Les étudiants passent l'examen",
            s2_d: "Les étudiants se connectent et complètent des examens sécurisés et surveillés avec une protection anti-triche automatique.",
            s3_t: "L'IA note et publie",
            s3_d: "Un clic distribue les résultats. Chaque réponse est notée par l'IA et un retour personnalisé est livré instantanément.",

            about_tag: "À propos de CUPE",
            about_title: "Conçu pour les éducateurs modernes",
            about_p1: "CUPE a été créé pour libérer les enseignants de la charge répétitive de la correction. En combinant un système robuste de gestion d'examens avec une IA de pointe, nous redonnons aux éducateurs leur ressource la plus précieuse : le temps.",
            about_p2: "Sécurité, équité et clarté sont au cœur de tout ce que nous construisons. Chaque résultat est transparent, chaque soumission est protégée, et chaque étudiant reçoit un retour qui l'aide à progresser.",
            about_c1: "Authentification sécurisée JWT et accès par rôle",
            about_c2: "Responsive, accessible et élégant sur tous les appareils",
            about_c3: "Entièrement bilingue — Anglais & Français",

            test_tag: "Témoignages",
            test_title: "Apprécié par les éducateurs",
            test_sub: "Voici ce que les enseignants disent de la gestion d'examens avec CUPE.",
            test1_q: "CUPE a réduit mon temps de correction de 90%. Le retour IA est étonnamment précis et mes étudiants adorent le retour instantané.",
            test1_role: "Professeur de physique",
            test2_q: "La fonction de messagerie change tout. Je peux atteindre toute ma classe ou des étudiants individuellement, en un seul endroit.",
            test2_role: "Enseignant au lycée",
            test3_q: "La protection anti-triche me donne une confiance totale dans mes examens. L'installation a pris quelques minutes et les tableaux sont superbes.",
            test3_role: "Doyenne des études",

            contact_tag: "Contact",
            contact_title: "Contactez-nous",
            contact_sub: "Questions ou demande de démo ? Contactez directement l'enseignant, Dchoupe Fotie Valdese Jordan, ci-dessous.",
            ci_email_label: "Email",
            ci_loc_label: "Localisation",
            ci_loc: "Cameroun — en ligne",
            ci_call_label: "Téléphone",
            cf_name: "Nom complet",
            cf_name_ph: "Jean Dupont",
            cf_email: "Adresse email",
            cf_email_ph: "vous@exemple.com",
            cf_subject: "Sujet",
            cf_subject_ph: "Comment pouvons-nous aider ?",
            cf_message: "Message",
            cf_message_ph: "Écrivez votre message ici…",
            cf_send: "Envoyer le message",
            cf_sending: "Envoi…",
            cf_success: "Merci ! Votre message a été envoyé. Nous vous répondrons bientôt.",
            cf_error: "Une erreur est survenue. Veuillez réessayer.",

            cta_title: "Prêt à transformer votre façon d'enseigner ?",
            cta_sub: "Rejoignez des milliers d'éducateurs qui utilisent CUPE pour gagner du temps et améliorer les résultats.",
            cta_btn: "Commencer — C'est gratuit",
            cta_btn2: "Parler à l'équipe",

            footer_desc: "La plateforme de gestion d'examens alimentée par l'IA pour les éducateurs et institutions modernes.",
            footer_nav: "Plateforme",
            footer_res: "Ressources",
            footer_help: "Centre d'aide",
            footer_support: "Support",
            footer_legal: "Légal",
            footer_privacy: "Politique de confidentialité",
            footer_terms: "Conditions d'utilisation",
            footer_rights: "Tous droits réservés.",
            health_online: "Tous les systèmes opérationnels",
            health_offline: "Service temporairement indisponible"
        }
    };

    const DEFAULT_LANG = "en";
    const API_BASE = window.location.protocol === "file:" ? "http://localhost:3000" : "";

    /* ---------------- Helpers ---------------- */
    function applyI18n(lang) {
        const dict = I18N[lang] || I18N[DEFAULT_LANG];
        document.documentElement.lang = lang;

        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.dataset.i18n;
            if (dict[key] !== undefined) el.textContent = dict[key];
        });
        document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
            const key = el.dataset.i18nPh;
            if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
        });

        document.querySelectorAll(".lang-btn").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.lang === lang);
        });

        localStorage.setItem("cupe_lang", lang);
    }

    /* ---------------- Theme ---------------- */
    function initTheme() {
        const saved = localStorage.getItem("cupe_theme");
        const prefersDark = window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
        const theme = saved || (prefersDark ? "dark" : "light");
        document.documentElement.setAttribute("data-theme", theme);

        const toggle = document.getElementById("theme-toggle");
        if (toggle) {
            toggle.addEventListener("click", () => {
                const current = document.documentElement.getAttribute("data-theme");
                const next = current === "dark" ? "light" : "dark";
                document.documentElement.setAttribute("data-theme", next);
                localStorage.setItem("cupe_theme", next);
            });
        }
    }

    /* ---------------- Mobile menu ---------------- */
    function initMobileMenu() {
        const btn = document.getElementById("mobile-menu-btn");
        const links = document.getElementById("nav-links");
        if (!btn || !links) return;
        btn.addEventListener("click", () => links.classList.toggle("open"));
        links.querySelectorAll("a").forEach((a) =>
            a.addEventListener("click", () => links.classList.remove("open"))
        );
    }

    /* ---------------- Navbar scroll shadow ---------------- */
    function initNavbarScroll() {
        const navbar = document.getElementById("navbar");
        if (!navbar) return;
        window.addEventListener("scroll", () => {
            navbar.classList.toggle("scrolled", window.scrollY > 20);
        });
    }

    /* ---------------- Scroll reveal ---------------- */
    function initReveal() {
        const els = document.querySelectorAll(".reveal");
        if (!("IntersectionObserver" in window)) {
            els.forEach((el) => el.classList.add("visible"));
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );
        els.forEach((el) => observer.observe(el));
    }

    /* ---------------- Count-up stats ---------------- */
    function initCounters() {
        const counters = document.querySelectorAll("[data-count]");
        if (!counters.length) return;

        const animate = (el) => {
            const target = parseFloat(el.dataset.count);
            const duration = 1600;
            const start = performance.now();
            const tick = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(target * eased);
                if (progress < 1) requestAnimationFrame(tick);
                else el.textContent = target;
            };
            requestAnimationFrame(tick);
        };

        if (!("IntersectionObserver" in window)) {
            counters.forEach(animate);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animate(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );
        counters.forEach((el) => observer.observe(el));
    }

    /* ---------------- Health check ---------------- */
    async function initHealth() {
        const statusEl = document.getElementById("health-status");
        const lang = localStorage.getItem("cupe_lang") || DEFAULT_LANG;
        const dict = I18N[lang] || I18N[DEFAULT_LANG];
        if (!statusEl) return;
        try {
            const res = await fetch(API_BASE + "/api/health");
            const data = await res.json();
            if (res.ok && data.ok) {
                statusEl.innerHTML =
                    '<span class="health-dot ok"></span>' + dict.health_online;
            } else {
                statusEl.innerHTML =
                    '<span class="health-dot down"></span>' + dict.health_offline;
            }
        } catch (err) {
            statusEl.innerHTML =
                '<span class="health-dot down"></span>' + dict.health_offline;
        }
    }

    /* ---------------- Contact form ---------------- */
    function initContact() {
        const form = document.getElementById("contact-form");
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const status = document.getElementById("form-status");
            const submitBtn = document.getElementById("contact-submit");
            const lang = localStorage.getItem("cupe_lang") || DEFAULT_LANG;
            const dict = I18N[lang] || I18N[DEFAULT_LANG];

            const payload = {
                name: document.getElementById("c-name").value.trim(),
                email: document.getElementById("c-email").value.trim(),
                subject: document.getElementById("c-subject").value.trim(),
                message: document.getElementById("c-message").value.trim()
            };

            if (submitBtn) submitBtn.disabled = true;
            status.className = "form-status";
            if (submitBtn) submitBtn.textContent = dict.cf_sending;

            try {
                const res = await fetch(API_BASE + "/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "err");

                status.className = "form-status success";
                status.textContent = dict.cf_success;
                form.reset();
            } catch (err) {
                status.className = "form-status error";
                status.textContent = dict.cf_error;
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = dict.cf_send;
                }
            }
        });
    }

    /* ---------------- Boot ---------------- */
    document.addEventListener("DOMContentLoaded", () => {
        initTheme();
        initMobileMenu();
        initNavbarScroll();
        initReveal();
        initCounters();
        initContact();
        initHealth();

        // Language switcher listeners
        document.querySelectorAll(".lang-btn").forEach((btn) => {
            btn.addEventListener("click", () => applyI18n(btn.dataset.lang));
        });

        // Apply saved language on load
        const stored = localStorage.getItem("cupe_lang") || DEFAULT_LANG;
        applyI18n(I18N[stored] ? stored : DEFAULT_LANG);
    });
})();
