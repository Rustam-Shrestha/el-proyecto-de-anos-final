--
-- PostgreSQL database dump
--

\restrict 48Uxh07xaR6snr1tw061ICjsc1XJjCfaWTexbX6kd43xEJN7FTEAxkn4rsjM9fd

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Role; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth."Role" VALUES ('cmu3yqf6u0000s89jxbdeqg0z', 'REVIEWER', '2026-09-16 10:33:38.407', '2026-09-16 10:33:38.407');
INSERT INTO auth."Role" VALUES ('cmu3yqfbm0001s89jd23fs7ec', 'USER', '2026-09-16 10:33:38.578', '2026-09-16 10:33:38.578');
INSERT INTO auth."Role" VALUES ('cmu3yqfk10002s89jvpnxckrt', 'ADMIN', '2026-09-16 10:33:38.881', '2026-09-16 10:33:38.881');


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.users VALUES ('cmu3yqp1f0003s89jx07kkq7k', 'admin@finguard.local', '$2b$12$lXcfQpL3DnsQ7sAQsO3n8uTTwvYO.9MgKNsgMItNI8zObZ/FIvYYO', true, false, 1, 'cmu3yqfk10002s89jvpnxckrt', '2026-09-16 10:33:51.171', '2026-09-16 10:33:51.171');
INSERT INTO auth.users VALUES ('cmu3yqp200005s89j4lsrvw47', 'reviewer@finguard.local', '$2b$12$v9CGMMwhLxatUMemKQjXcOI8l9BSDOkWWal1Hw7DC3GKmnWpg48H.', true, false, 1, 'cmu3yqf6u0000s89jxbdeqg0z', '2026-09-16 10:33:51.192', '2026-09-16 10:33:51.192');
INSERT INTO auth.users VALUES ('cmu3yqp2d0007s89jf7vkcl3c', 'user@finguard.local', '$2b$12$tmYNHjz1VThCCh6aQZnUQuSbA6GaSgz4TftIQu2OVAwRiDkrARQgu', true, false, 1, 'cmu3yqfbm0001s89jd23fs7ec', '2026-09-16 10:33:51.205', '2026-09-16 10:33:51.205');
INSERT INTO auth.users VALUES ('cmu3yqpqi0009s89jkiu2fjql', 'admin@acme.finguard.test', '$2b$12$I8pHF.9Be/K15iKmmqLlhesslIMTxprwSa9VZuZRAT/8oeWLqpKFG', true, false, 2, 'cmu3yqfk10002s89jvpnxckrt', '2026-09-16 10:33:52.074', '2026-09-16 10:33:52.074');
INSERT INTO auth.users VALUES ('cmu3yqqe0000bs89j9tfgtek1', 'approver@acme.finguard.test', '$2b$12$CX2H1igCD.ihL2aFQRHRc.WN5G.DyYOC6Q3T5cGBwMnR90jcZf.ne', true, false, 2, 'cmu3yqf6u0000s89jxbdeqg0z', '2026-09-16 10:33:52.92', '2026-09-16 10:33:52.92');
INSERT INTO auth.users VALUES ('cmu3yqr6m000ds89jz8772cn8', 'validator@acme.finguard.test', '$2b$12$JR4SLzZDubgjmGFziefii.sxp094EiWKZKsIs8eBIWtoH1esyImky', true, false, 2, 'cmu3yqf6u0000s89jxbdeqg0z', '2026-09-16 10:33:53.95', '2026-09-16 10:33:53.95');
INSERT INTO auth.users VALUES ('cmu3yqryh000fs89jc1gy5e18', 'customer1@acme.finguard.test', '$2b$12$Ewr9D8RqeVK2NKtMUEKSyOF9JPjxfGwAwJ3x5/LsfXBSJk8gqj65i', true, false, 2, 'cmu3yqfbm0001s89jd23fs7ec', '2026-09-16 10:33:54.953', '2026-09-16 10:33:54.953');
INSERT INTO auth.users VALUES ('cmu3yqt21000hs89j427o95w6', 'customer2@acme.finguard.test', '$2b$12$IJc8jUUIUqtKwMnGdAkirOFZSnDKK/RoztxVLgBekg2dvzeT92p4.', true, false, 2, 'cmu3yqfbm0001s89jd23fs7ec', '2026-09-16 10:33:56.377', '2026-09-16 10:33:56.377');
INSERT INTO auth.users VALUES ('cmu3yqtqk000js89jw1iwqta1', 'employee@acme.finguard.test', '$2b$12$ydfzxlqr5g7DCTuDqJdzJeg9si6G0j.jYZSAzkGgOOKkwpaObmqyW', true, false, 2, 'cmu3yqfbm0001s89jd23fs7ec', '2026-09-16 10:33:57.26', '2026-09-16 10:33:57.26');
INSERT INTO auth.users VALUES ('cmu3yqun3000ls89jfi1dcr2k', 'admin@globebank.finguard.test', '$2b$12$6pBmi0IBN79zzKUVg0LvDO3nSXRIRQUQIwxOJqbjGKW.gTuFzHXzK', true, false, 3, 'cmu3yqfk10002s89jvpnxckrt', '2026-09-16 10:33:58.431', '2026-09-16 10:33:58.431');
INSERT INTO auth.users VALUES ('cmu3yqvm0000ns89jptkh2kir', 'approver@globebank.finguard.test', '$2b$12$Z2szj8N0Etjseusv8RIrKu32dwu0E5FGpkQQKkmCeaEddKmgQEgOa', true, false, 3, 'cmu3yqf6u0000s89jxbdeqg0z', '2026-09-16 10:33:59.688', '2026-09-16 10:33:59.688');
INSERT INTO auth.users VALUES ('cmu3yqwei000ps89ju9ugozyk', 'customer1@globebank.finguard.test', '$2b$12$hyjqdxkMaBCnjZyptJ4MXuOukQWOpj9q5TXZSOA7af/pNGpC7oI5C', true, false, 3, 'cmu3yqfbm0001s89jd23fs7ec', '2026-09-16 10:34:00.714', '2026-09-16 10:34:00.714');
INSERT INTO auth.users VALUES ('cmu3yqx3u000rs89jr0ujbyrh', 'customer2@globebank.finguard.test', '$2b$12$qWsXZCPjNFekap8cNO0CwONadQiFP/9VpOngRMurpysLpQl/kpi0q', true, false, 3, 'cmu3yqfbm0001s89jd23fs7ec', '2026-09-16 10:34:01.626', '2026-09-16 10:34:01.626');
INSERT INTO auth.users VALUES ('cmu3yqy6l000ts89juh717uib', 'admin@fastcredit.finguard.test', '$2b$12$swc/OYJTf5puW2z074eKSOQUfiP2NpK25pc.HpwlTRxJrBWbRdS7C', true, false, 4, 'cmu3yqfk10002s89jvpnxckrt', '2026-09-16 10:34:03.021', '2026-09-16 10:34:03.021');
INSERT INTO auth.users VALUES ('cmu3yqyw0000vs89jh46x8qxd', 'customer1@fastcredit.finguard.test', '$2b$12$huGtGz37iWyoUK6AZddDpOLNbVtT1vhDy.L9zcI4MXGXeu0oh1VHO', true, false, 4, 'cmu3yqfbm0001s89jd23fs7ec', '2026-09-16 10:34:03.936', '2026-09-16 10:34:03.936');
INSERT INTO auth.users VALUES ('cmu3yqzo5000xs89jz00tb7v3', 'admin@everest.finguard.test', '$2b$12$p7AN37Ed2H2lhjoFVf7ssOTjYouw0gxnrlwEj4lCOSrXx31nXNKWG', true, false, 5, 'cmu3yqfk10002s89jvpnxckrt', '2026-09-16 10:34:04.949', '2026-09-16 10:34:04.949');
INSERT INTO auth.users VALUES ('cmu3yr0w6000zs89ji3zge16s', 'approver@everest.finguard.test', '$2b$12$JazXJKUOxiK9pNqcXgCmgeo9gkRJZp.V8Tv04p1MJ62AinEKT5yZi', true, false, 5, 'cmu3yqf6u0000s89jxbdeqg0z', '2026-09-16 10:34:06.534', '2026-09-16 10:34:06.534');
INSERT INTO auth.users VALUES ('cmu3yr2pm0011s89j1bvh5335', 'customer1@everest.finguard.test', '$2b$12$V.SPo77IzphmIT//A3qRJ.I2GhVheO3mnP3xAEuSMtek2OR0AaFOa', true, false, 5, 'cmu3yqfbm0001s89jd23fs7ec', '2026-09-16 10:34:08.89', '2026-09-16 10:34:08.89');
INSERT INTO auth.users VALUES ('cmu3yr3dx0013s89jknttmhix', 'customer2@everest.finguard.test', '$2b$12$w6j7YwtIb2mqCM0VyQoexO8GKFf2QfMlu5/OIH3KNbOqQYdWL0Ari', true, false, 5, 'cmu3yqfbm0001s89jd23fs7ec', '2026-09-16 10:34:09.766', '2026-09-16 10:34:09.766');
INSERT INTO auth.users VALUES ('cmu3yr49s0015s89jifj3v6l9', 'admin@himalayan.finguard.test', '$2b$12$jABdGqMVy3SFgu61ZCijeO9NekrJ172rc3ukQkmLeF8aLHSDXzqPy', true, false, 6, 'cmu3yqfk10002s89jvpnxckrt', '2026-09-16 10:34:10.912', '2026-09-16 10:34:10.912');
INSERT INTO auth.users VALUES ('cmu3yr5th0017s89jzckxfaua', 'customer1@himalayan.finguard.test', '$2b$12$Fp1qeKHDwM5QUFuJ9SyJp.JBplv4Q7HNWNllZhbx/mYDK/iFJbSNa', true, false, 6, 'cmu3yqfbm0001s89jd23fs7ec', '2026-09-16 10:34:12.917', '2026-09-16 10:34:12.917');


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.audit_logs VALUES ('cmu3yzdo90001m49jxe5e9fk3', 1, 'cmu3yqp1f0003s89jx07kkq7k', 'LOGIN', '{"email": "admin@finguard.local"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-16 10:40:36.345');


--
-- Data for Name: bank_statements; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.bank_statements VALUES ('cmu3yr5y5001fs89jkis3w0sz', 2, 'cmu3yqryh000fs89jc1gy5e18', 'Demo Bank', 'ACC1826054617', NULL, NULL, NULL, 12000.00, 18500.00, NULL, NULL, 'SUCCESS', NULL, '2026-09-16 10:34:13.085', '2026-09-16 10:34:13.085');
INSERT INTO auth.bank_statements VALUES ('cmu3yr60t001ss89jovjj5cqq', 2, 'cmu3yqt21000hs89j427o95w6', 'Demo Bank', 'ACC8865290005', NULL, NULL, NULL, 12000.00, 18500.00, NULL, NULL, 'SUCCESS', NULL, '2026-09-16 10:34:13.182', '2026-09-16 10:34:13.182');
INSERT INTO auth.bank_statements VALUES ('cmu3yr62l0024s89jcajmt9m0', 3, 'cmu3yqwei000ps89ju9ugozyk', 'Demo Bank', 'ACC7888500149', NULL, NULL, NULL, 12000.00, 18500.00, NULL, NULL, 'SUCCESS', NULL, '2026-09-16 10:34:13.246', '2026-09-16 10:34:13.246');
INSERT INTO auth.bank_statements VALUES ('cmu3yr64e002hs89j2hcr5uia', 3, 'cmu3yqx3u000rs89jr0ujbyrh', 'Demo Bank', 'ACC2891819726', NULL, NULL, NULL, 12000.00, 18500.00, NULL, NULL, 'SUCCESS', NULL, '2026-09-16 10:34:13.31', '2026-09-16 10:34:13.31');
INSERT INTO auth.bank_statements VALUES ('cmu3yr66d002ts89j680nu5jn', 4, 'cmu3yqyw0000vs89jh46x8qxd', 'Demo Bank', 'ACC9029271488', NULL, NULL, NULL, 12000.00, 18500.00, NULL, NULL, 'SUCCESS', NULL, '2026-09-16 10:34:13.381', '2026-09-16 10:34:13.381');
INSERT INTO auth.bank_statements VALUES ('cmu3yr67x0035s89jr8o6tr1m', 5, 'cmu3yr2pm0011s89j1bvh5335', 'Demo Bank', 'ACC2562737487', NULL, NULL, NULL, 12000.00, 18500.00, NULL, NULL, 'SUCCESS', NULL, '2026-09-16 10:34:13.437', '2026-09-16 10:34:13.437');
INSERT INTO auth.bank_statements VALUES ('cmu3yr69l003is89jjm1bt7wt', 5, 'cmu3yr3dx0013s89jknttmhix', 'Demo Bank', 'ACC3002560244', NULL, NULL, NULL, 12000.00, 18500.00, NULL, NULL, 'SUCCESS', NULL, '2026-09-16 10:34:13.497', '2026-09-16 10:34:13.497');
INSERT INTO auth.bank_statements VALUES ('cmu3yr6av003us89jqcegtedk', 6, 'cmu3yr5th0017s89jzckxfaua', 'Demo Bank', 'ACC1581919681', NULL, NULL, NULL, 12000.00, 18500.00, NULL, NULL, 'SUCCESS', NULL, '2026-09-16 10:34:13.543', '2026-09-16 10:34:13.543');


--
-- Data for Name: borrower_features; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: chat_conversations; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: kyc_applications; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.kyc_applications VALUES ('cmu3yr5ui0019s89ju1gmvmis', 2, 'cmu3yqryh000fs89jc1gy5e18', 'APPROVED', '2026-09-11 10:34:12.946', '2026-09-12 10:34:12.946', NULL, NULL, 'CIT-885021327', 'customer1', NULL, NULL, NULL, 'DONE', 'DONE', 'DONE', 'DONE', NULL, NULL, 'COMPLETE', 'VERIFIED', 'EXTRACTED', false, 'CIT-718486832', 'customer1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 6164.00, NULL, NULL, '2026-09-16 10:34:12.954', '2026-09-16 10:34:12.954');
INSERT INTO auth.kyc_applications VALUES ('cmu3yr5zo001ls89js49iofl5', 2, 'cmu3yqt21000hs89j427o95w6', 'APPROVED', '2026-09-11 10:34:13.135', '2026-09-12 10:34:13.135', NULL, NULL, 'CIT-280409681', 'customer2', NULL, NULL, NULL, 'DONE', 'DONE', 'DONE', 'DONE', NULL, NULL, 'COMPLETE', 'VERIFIED', 'EXTRACTED', false, 'CIT-107587302', 'customer2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 9646.00, NULL, NULL, '2026-09-16 10:34:13.14', '2026-09-16 10:34:13.14');
INSERT INTO auth.kyc_applications VALUES ('cmu3yr600001ms89jagk14726', 2, 'cmu3yqt21000hs89j427o95w6', 'PENDING', '2026-09-16 10:34:13.152', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', 'PENDING', 'PENDING', 'PENDING', NULL, NULL, 'VALIDATING_FACE', 'PENDING', 'PENDING', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.152', '2026-09-16 10:34:13.152');
INSERT INTO auth.kyc_applications VALUES ('cmu3yr61j001ys89jy5xm77hs', 3, 'cmu3yqwei000ps89ju9ugozyk', 'APPROVED', '2026-09-11 10:34:13.202', '2026-09-12 10:34:13.202', NULL, NULL, 'CIT-321578147', 'customer1', NULL, NULL, NULL, 'DONE', 'DONE', 'DONE', 'DONE', NULL, NULL, 'COMPLETE', 'VERIFIED', 'EXTRACTED', false, 'CIT-196528674', 'customer1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 9048.00, NULL, NULL, '2026-09-16 10:34:13.207', '2026-09-16 10:34:13.207');
INSERT INTO auth.kyc_applications VALUES ('cmu3yr63b002as89j8iy8rgrp', 3, 'cmu3yqx3u000rs89jr0ujbyrh', 'APPROVED', '2026-09-11 10:34:13.267', '2026-09-12 10:34:13.267', NULL, NULL, 'CIT-894207090', 'customer2', NULL, NULL, NULL, 'DONE', 'DONE', 'DONE', 'DONE', NULL, NULL, 'COMPLETE', 'VERIFIED', 'EXTRACTED', false, 'CIT-968615229', 'customer2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 5484.00, NULL, NULL, '2026-09-16 10:34:13.272', '2026-09-16 10:34:13.272');
INSERT INTO auth.kyc_applications VALUES ('cmu3yr63m002bs89jkmjzuecn', 3, 'cmu3yqx3u000rs89jr0ujbyrh', 'PENDING', '2026-09-16 10:34:13.283', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', 'PENDING', 'PENDING', 'PENDING', NULL, NULL, 'VALIDATING_FACE', 'PENDING', 'PENDING', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.283', '2026-09-16 10:34:13.283');
INSERT INTO auth.kyc_applications VALUES ('cmu3yr65e002ns89jekxpp83j', 4, 'cmu3yqyw0000vs89jh46x8qxd', 'APPROVED', '2026-09-11 10:34:13.336', '2026-09-12 10:34:13.336', NULL, NULL, 'CIT-560017430', 'customer1', NULL, NULL, NULL, 'DONE', 'DONE', 'DONE', 'DONE', NULL, NULL, 'COMPLETE', 'VERIFIED', 'EXTRACTED', false, 'CIT-350729447', 'customer1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 5448.00, NULL, NULL, '2026-09-16 10:34:13.346', '2026-09-16 10:34:13.346');
INSERT INTO auth.kyc_applications VALUES ('cmu3yr677002zs89jrjnunj37', 5, 'cmu3yr2pm0011s89j1bvh5335', 'APPROVED', '2026-09-11 10:34:13.404', '2026-09-12 10:34:13.404', NULL, NULL, 'CIT-498385596', 'customer1', NULL, NULL, NULL, 'DONE', 'DONE', 'DONE', 'DONE', NULL, NULL, 'COMPLETE', 'VERIFIED', 'EXTRACTED', false, 'CIT-254848683', 'customer1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 5119.00, NULL, NULL, '2026-09-16 10:34:13.411', '2026-09-16 10:34:13.411');
INSERT INTO auth.kyc_applications VALUES ('cmu3yr68n003bs89jri6ewh4c', 5, 'cmu3yr3dx0013s89jknttmhix', 'APPROVED', '2026-09-11 10:34:13.458', '2026-09-12 10:34:13.458', NULL, NULL, 'CIT-460929534', 'customer2', NULL, NULL, NULL, 'DONE', 'DONE', 'DONE', 'DONE', NULL, NULL, 'COMPLETE', 'VERIFIED', 'EXTRACTED', false, 'CIT-258436289', 'customer2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 5426.00, NULL, NULL, '2026-09-16 10:34:13.463', '2026-09-16 10:34:13.463');
INSERT INTO auth.kyc_applications VALUES ('cmu3yr68t003cs89jlsw4g4ep', 5, 'cmu3yr3dx0013s89jknttmhix', 'PENDING', '2026-09-16 10:34:13.469', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', 'PENDING', 'PENDING', 'PENDING', NULL, NULL, 'VALIDATING_FACE', 'PENDING', 'PENDING', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.469', '2026-09-16 10:34:13.469');
INSERT INTO auth.kyc_applications VALUES ('cmu3yr6a7003os89jyxcqr5qv', 6, 'cmu3yr5th0017s89jzckxfaua', 'APPROVED', '2026-09-11 10:34:13.515', '2026-09-12 10:34:13.515', NULL, NULL, 'CIT-824814915', 'customer1', NULL, NULL, NULL, 'DONE', 'DONE', 'DONE', 'DONE', NULL, NULL, 'COMPLETE', 'VERIFIED', 'EXTRACTED', false, 'CIT-479872221', 'customer1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 5234.00, NULL, NULL, '2026-09-16 10:34:13.519', '2026-09-16 10:34:13.519');


--
-- Data for Name: documents; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: document_versions; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: employment_info; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.employment_info VALUES ('cmu3yr5uv001as89jnffhenn9', 2, 'cmu3yqryh000fs89jc1gy5e18', 'EMPLOYED', 'Engineer', 'Employer Inc', NULL, 5000.00, 60000.00, 1, NULL, NULL, NULL, NULL, NULL, 36, -1095, false, 'SALARY', 50, '2026-09-16 10:34:12.967', '2026-09-16 10:34:12.967');
INSERT INTO auth.employment_info VALUES ('cmu3yr604001ns89j0mp4c8nh', 2, 'cmu3yqt21000hs89j427o95w6', 'EMPLOYED', 'Engineer', 'Employer Inc', NULL, 5000.00, 60000.00, 1, NULL, NULL, NULL, NULL, NULL, 36, -1095, false, 'SALARY', 50, '2026-09-16 10:34:13.156', '2026-09-16 10:34:13.156');
INSERT INTO auth.employment_info VALUES ('cmu3yr61p001zs89jhjiasrl4', 3, 'cmu3yqwei000ps89ju9ugozyk', 'EMPLOYED', 'Engineer', 'Employer Inc', NULL, 5000.00, 60000.00, 1, NULL, NULL, NULL, NULL, NULL, 36, -1095, false, 'SALARY', 50, '2026-09-16 10:34:13.213', '2026-09-16 10:34:13.213');
INSERT INTO auth.employment_info VALUES ('cmu3yr63q002cs89jotg1f7f0', 3, 'cmu3yqx3u000rs89jr0ujbyrh', 'EMPLOYED', 'Engineer', 'Employer Inc', NULL, 5000.00, 60000.00, 1, NULL, NULL, NULL, NULL, NULL, 36, -1095, false, 'SALARY', 50, '2026-09-16 10:34:13.286', '2026-09-16 10:34:13.286');
INSERT INTO auth.employment_info VALUES ('cmu3yr65i002os89joornjat8', 4, 'cmu3yqyw0000vs89jh46x8qxd', 'EMPLOYED', 'Engineer', 'Employer Inc', NULL, 5000.00, 60000.00, 1, NULL, NULL, NULL, NULL, NULL, 36, -1095, false, 'SALARY', 50, '2026-09-16 10:34:13.351', '2026-09-16 10:34:13.351');
INSERT INTO auth.employment_info VALUES ('cmu3yr67c0030s89jqy42jyia', 5, 'cmu3yr2pm0011s89j1bvh5335', 'EMPLOYED', 'Engineer', 'Employer Inc', NULL, 5000.00, 60000.00, 1, NULL, NULL, NULL, NULL, NULL, 36, -1095, false, 'SALARY', 50, '2026-09-16 10:34:13.416', '2026-09-16 10:34:13.416');
INSERT INTO auth.employment_info VALUES ('cmu3yr68w003ds89jcwa0ks2k', 5, 'cmu3yr3dx0013s89jknttmhix', 'EMPLOYED', 'Engineer', 'Employer Inc', NULL, 5000.00, 60000.00, 1, NULL, NULL, NULL, NULL, NULL, 36, -1095, false, 'SALARY', 50, '2026-09-16 10:34:13.472', '2026-09-16 10:34:13.472');
INSERT INTO auth.employment_info VALUES ('cmu3yr6aa003ps89jeejzwlz9', 6, 'cmu3yr5th0017s89jzckxfaua', 'EMPLOYED', 'Engineer', 'Employer Inc', NULL, 5000.00, 60000.00, 1, NULL, NULL, NULL, NULL, NULL, 36, -1095, false, 'SALARY', 50, '2026-09-16 10:34:13.522', '2026-09-16 10:34:13.522');


--
-- Data for Name: extraction_verifications; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: face_verifications; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: financial_documents; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: financial_profiles; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.financial_profiles VALUES ('cmu3yr5vi001bs89jsqsii5fx', 2, 'cmu3yqryh000fs89jc1gy5e18', 0, NULL, NULL, 5500.00, 3200.00, 66000.00, 38400.00, NULL, 0.42, NULL, 78, 720, '2026-09-16 10:34:12.99');
INSERT INTO auth.financial_profiles VALUES ('cmu3yr609001os89jj7ei1okz', 2, 'cmu3yqt21000hs89j427o95w6', 0, NULL, NULL, 5500.00, 3200.00, 66000.00, 38400.00, NULL, 0.42, NULL, 78, 720, '2026-09-16 10:34:13.161');
INSERT INTO auth.financial_profiles VALUES ('cmu3yr61s0020s89jhn5nf8i8', 3, 'cmu3yqwei000ps89ju9ugozyk', 0, NULL, NULL, 5500.00, 3200.00, 66000.00, 38400.00, NULL, 0.42, NULL, 78, 720, '2026-09-16 10:34:13.216');
INSERT INTO auth.financial_profiles VALUES ('cmu3yr63t002ds89j6dfdrs00', 3, 'cmu3yqx3u000rs89jr0ujbyrh', 0, NULL, NULL, 5500.00, 3200.00, 66000.00, 38400.00, NULL, 0.42, NULL, 78, 720, '2026-09-16 10:34:13.289');
INSERT INTO auth.financial_profiles VALUES ('cmu3yr65m002ps89j0a627y87', 4, 'cmu3yqyw0000vs89jh46x8qxd', 0, NULL, NULL, 5500.00, 3200.00, 66000.00, 38400.00, NULL, 0.42, NULL, 78, 720, '2026-09-16 10:34:13.354');
INSERT INTO auth.financial_profiles VALUES ('cmu3yr67f0031s89jos4xwztf', 5, 'cmu3yr2pm0011s89j1bvh5335', 0, NULL, NULL, 5500.00, 3200.00, 66000.00, 38400.00, NULL, 0.42, NULL, 78, 720, '2026-09-16 10:34:13.419');
INSERT INTO auth.financial_profiles VALUES ('cmu3yr694003es89jdxtp855x', 5, 'cmu3yr3dx0013s89jknttmhix', 0, NULL, NULL, 5500.00, 3200.00, 66000.00, 38400.00, NULL, 0.42, NULL, 78, 720, '2026-09-16 10:34:13.48');
INSERT INTO auth.financial_profiles VALUES ('cmu3yr6ae003qs89jvx1s1s88', 6, 'cmu3yr5th0017s89jzckxfaua', 0, NULL, NULL, 5500.00, 3200.00, 66000.00, 38400.00, NULL, 0.42, NULL, 78, 720, '2026-09-16 10:34:13.526');


--
-- Data for Name: kyc_submission_files; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: loan_accounts; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: loan_applications; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.loan_applications VALUES ('cmu3yr5xa001ds89j4ui1m7p5', 2, 'cmu3yqryh000fs89jc1gy5e18', 15000.00, 24, 'PERSONAL', NULL, 'APPROVED', 32, 'LOW', NULL, NULL, NULL, 0.07, 'v1.0', NULL, NULL, NULL, 720, '2026-09-16 10:34:13.054', '2026-09-16 10:34:13.054');
INSERT INTO auth.loan_applications VALUES ('cmu3yr5xl001es89jvgtahphm', 2, 'cmu3yqryh000fs89jc1gy5e18', 8000.00, 12, 'EDUCATION', NULL, 'SUBMITTED', 58, 'MEDIUM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.065', '2026-09-16 10:34:13.065');
INSERT INTO auth.loan_applications VALUES ('cmu3yr60i001qs89j44u6tyyw', 2, 'cmu3yqt21000hs89j427o95w6', 15000.00, 24, 'PERSONAL', NULL, 'APPROVED', 32, 'LOW', NULL, NULL, NULL, 0.07, 'v1.0', NULL, NULL, NULL, 720, '2026-09-16 10:34:13.17', '2026-09-16 10:34:13.17');
INSERT INTO auth.loan_applications VALUES ('cmu3yr60o001rs89j1mz4ghk9', 2, 'cmu3yqt21000hs89j427o95w6', 8000.00, 12, 'EDUCATION', NULL, 'SUBMITTED', 58, 'MEDIUM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.176', '2026-09-16 10:34:13.176');
INSERT INTO auth.loan_applications VALUES ('cmu3yr6280022s89jn0gsnpty', 3, 'cmu3yqwei000ps89ju9ugozyk', 15000.00, 24, 'PERSONAL', NULL, 'APPROVED', 32, 'LOW', NULL, NULL, NULL, 0.07, 'v1.0', NULL, NULL, NULL, 720, '2026-09-16 10:34:13.232', '2026-09-16 10:34:13.232');
INSERT INTO auth.loan_applications VALUES ('cmu3yr62b0023s89jb0u3y45v', 3, 'cmu3yqwei000ps89ju9ugozyk', 8000.00, 12, 'EDUCATION', NULL, 'SUBMITTED', 58, 'MEDIUM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.235', '2026-09-16 10:34:13.235');
INSERT INTO auth.loan_applications VALUES ('cmu3yr644002fs89jva4yes1w', 3, 'cmu3yqx3u000rs89jr0ujbyrh', 15000.00, 24, 'PERSONAL', NULL, 'APPROVED', 32, 'LOW', NULL, NULL, NULL, 0.07, 'v1.0', NULL, NULL, NULL, 720, '2026-09-16 10:34:13.3', '2026-09-16 10:34:13.3');
INSERT INTO auth.loan_applications VALUES ('cmu3yr648002gs89jw3d13ei9', 3, 'cmu3yqx3u000rs89jr0ujbyrh', 8000.00, 12, 'EDUCATION', NULL, 'SUBMITTED', 58, 'MEDIUM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.304', '2026-09-16 10:34:13.304');
INSERT INTO auth.loan_applications VALUES ('cmu3yr661002rs89jg11cjirb', 4, 'cmu3yqyw0000vs89jh46x8qxd', 15000.00, 24, 'PERSONAL', NULL, 'APPROVED', 32, 'LOW', NULL, NULL, NULL, 0.07, 'v1.0', NULL, NULL, NULL, 720, '2026-09-16 10:34:13.369', '2026-09-16 10:34:13.369');
INSERT INTO auth.loan_applications VALUES ('cmu3yr664002ss89jkyp80cm8', 4, 'cmu3yqyw0000vs89jh46x8qxd', 8000.00, 12, 'EDUCATION', NULL, 'SUBMITTED', 58, 'MEDIUM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.372', '2026-09-16 10:34:13.372');
INSERT INTO auth.loan_applications VALUES ('cmu3yr67q0033s89jxchc6qa5', 5, 'cmu3yr2pm0011s89j1bvh5335', 15000.00, 24, 'PERSONAL', NULL, 'APPROVED', 32, 'LOW', NULL, NULL, NULL, 0.07, 'v1.0', NULL, NULL, NULL, 720, '2026-09-16 10:34:13.43', '2026-09-16 10:34:13.43');
INSERT INTO auth.loan_applications VALUES ('cmu3yr67t0034s89jfk40nxiq', 5, 'cmu3yr2pm0011s89j1bvh5335', 8000.00, 12, 'EDUCATION', NULL, 'SUBMITTED', 58, 'MEDIUM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.433', '2026-09-16 10:34:13.433');
INSERT INTO auth.loan_applications VALUES ('cmu3yr69c003gs89j1f5tmn13', 5, 'cmu3yr3dx0013s89jknttmhix', 15000.00, 24, 'PERSONAL', NULL, 'APPROVED', 32, 'LOW', NULL, NULL, NULL, 0.07, 'v1.0', NULL, NULL, NULL, 720, '2026-09-16 10:34:13.488', '2026-09-16 10:34:13.488');
INSERT INTO auth.loan_applications VALUES ('cmu3yr69g003hs89jabsm4hxw', 5, 'cmu3yr3dx0013s89jknttmhix', 8000.00, 12, 'EDUCATION', NULL, 'SUBMITTED', 58, 'MEDIUM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.492', '2026-09-16 10:34:13.492');
INSERT INTO auth.loan_applications VALUES ('cmu3yr6am003ss89j4s9jw4b3', 6, 'cmu3yr5th0017s89jzckxfaua', 15000.00, 24, 'PERSONAL', NULL, 'APPROVED', 32, 'LOW', NULL, NULL, NULL, 0.07, 'v1.0', NULL, NULL, NULL, 720, '2026-09-16 10:34:13.534', '2026-09-16 10:34:13.534');
INSERT INTO auth.loan_applications VALUES ('cmu3yr6ap003ts89j1jxsfqxh', 6, 'cmu3yr5th0017s89jzckxfaua', 8000.00, 12, 'EDUCATION', NULL, 'SUBMITTED', 58, 'MEDIUM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.537', '2026-09-16 10:34:13.537');


--
-- Data for Name: loan_assessments; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: loan_features; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: manual_review_queue; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: nlu_queries; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: ocr_extractions; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: ocr_results; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: permission_definitions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.permission_definitions VALUES (1, 'tenants.create', 'Create new tenant', 'tenants', 'create', true, 'tenants', 0);
INSERT INTO auth.permission_definitions VALUES (2, 'tenants.read', 'Read tenant info', 'tenants', 'read', true, 'tenants', 0);
INSERT INTO auth.permission_definitions VALUES (3, 'tenants.update', 'Update tenant settings', 'tenants', 'update', true, 'tenants', 0);
INSERT INTO auth.permission_definitions VALUES (4, 'tenants.delete', 'Delete tenant', 'tenants', 'delete', true, 'tenants', 0);
INSERT INTO auth.permission_definitions VALUES (5, 'loans.read', 'Read loan details', 'loans', 'read', true, 'loans', 2);
INSERT INTO auth.permission_definitions VALUES (6, 'loans.write', 'Apply for loan', 'loans', 'write', true, 'loans', 3);
INSERT INTO auth.permission_definitions VALUES (7, 'loans.approve', 'Approve loans', 'loans', 'approve', true, 'loans', 2);
INSERT INTO auth.permission_definitions VALUES (8, 'loans.reject', 'Reject loans', 'loans', 'reject', true, 'loans', 2);
INSERT INTO auth.permission_definitions VALUES (9, 'users.read', 'Read users', 'users', 'read', true, 'users', 1);
INSERT INTO auth.permission_definitions VALUES (10, 'users.write', 'Create/update users', 'users', 'write', true, 'users', 1);
INSERT INTO auth.permission_definitions VALUES (11, 'users.manage', 'Manage users in tenant', 'users', 'manage', true, 'users', 1);
INSERT INTO auth.permission_definitions VALUES (12, 'admin.access', 'Access admin dashboard', 'admin', 'access', true, 'audit', 1);
INSERT INTO auth.permission_definitions VALUES (13, 'features.toggle', 'Enable/disable features', 'features', 'toggle', true, 'features', 0);
INSERT INTO auth.permission_definitions VALUES (14, 'audit.view', 'View audit logs', 'audit', 'view', true, 'audit', 1);
INSERT INTO auth.permission_definitions VALUES (15, 'audit.export', 'Export audit logs', 'audit', 'export', true, 'audit', 0);


--
-- Data for Name: portfolio_verifications; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.portfolio_verifications VALUES ('cmu3yr5w4001cs89jssyfpmkc', 2, 'cmu3yqryh000fs89jc1gy5e18', 'VERIFIED', 3, 3, 0, true, true, NULL, NULL, NULL, NULL, NULL, 35, 'LOW', 0, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.013', '2026-09-16 10:34:13.013', '2026-09-16 10:34:13.013');
INSERT INTO auth.portfolio_verifications VALUES ('cmu3yr60c001ps89jw5z99w2m', 2, 'cmu3yqt21000hs89j427o95w6', 'VERIFIED', 3, 3, 0, true, true, NULL, NULL, NULL, NULL, NULL, 35, 'LOW', 0, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.164', '2026-09-16 10:34:13.164', '2026-09-16 10:34:13.164');
INSERT INTO auth.portfolio_verifications VALUES ('cmu3yr6200021s89j0yyst06m', 3, 'cmu3yqwei000ps89ju9ugozyk', 'VERIFIED', 3, 3, 0, true, true, NULL, NULL, NULL, NULL, NULL, 35, 'LOW', 0, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.224', '2026-09-16 10:34:13.224', '2026-09-16 10:34:13.224');
INSERT INTO auth.portfolio_verifications VALUES ('cmu3yr63x002es89jfbd5ifr9', 3, 'cmu3yqx3u000rs89jr0ujbyrh', 'VERIFIED', 3, 3, 0, true, true, NULL, NULL, NULL, NULL, NULL, 35, 'LOW', 0, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.294', '2026-09-16 10:34:13.294', '2026-09-16 10:34:13.294');
INSERT INTO auth.portfolio_verifications VALUES ('cmu3yr65s002qs89j8kci8od1', 4, 'cmu3yqyw0000vs89jh46x8qxd', 'VERIFIED', 3, 3, 0, true, true, NULL, NULL, NULL, NULL, NULL, 35, 'LOW', 0, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.36', '2026-09-16 10:34:13.36', '2026-09-16 10:34:13.36');
INSERT INTO auth.portfolio_verifications VALUES ('cmu3yr67k0032s89jgi7nw9q1', 5, 'cmu3yr2pm0011s89j1bvh5335', 'VERIFIED', 3, 3, 0, true, true, NULL, NULL, NULL, NULL, NULL, 35, 'LOW', 0, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.424', '2026-09-16 10:34:13.424', '2026-09-16 10:34:13.424');
INSERT INTO auth.portfolio_verifications VALUES ('cmu3yr697003fs89jmq07nc67', 5, 'cmu3yr3dx0013s89jknttmhix', 'VERIFIED', 3, 3, 0, true, true, NULL, NULL, NULL, NULL, NULL, 35, 'LOW', 0, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.483', '2026-09-16 10:34:13.483', '2026-09-16 10:34:13.483');
INSERT INTO auth.portfolio_verifications VALUES ('cmu3yr6ah003rs89jquguktli', 6, 'cmu3yr5th0017s89jzckxfaua', 'VERIFIED', 3, 3, 0, true, true, NULL, NULL, NULL, NULL, NULL, 35, 'LOW', 0, NULL, NULL, NULL, NULL, '2026-09-16 10:34:13.529', '2026-09-16 10:34:13.529', '2026-09-16 10:34:13.529');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.profiles VALUES ('cmu3yqp1k0004s89jgp5ql00q', 'cmu3yqp1f0003s89jx07kkq7k', 'System Admin', '+1-555-0100', NULL, NULL, NULL, '2026-09-16 10:33:51.171');
INSERT INTO auth.profiles VALUES ('cmu3yqp220006s89ji7hg8a6t', 'cmu3yqp200005s89j4lsrvw47', 'KYC Reviewer', '+1-555-0101', NULL, NULL, NULL, '2026-09-16 10:33:51.192');
INSERT INTO auth.profiles VALUES ('cmu3yqp2e0008s89jhbtt5w0b', 'cmu3yqp2d0007s89jf7vkcl3c', 'John Doe', '+1-555-0102', '123 Main St, Springfield', NULL, NULL, '2026-09-16 10:33:51.205');
INSERT INTO auth.profiles VALUES ('cmu3yqpqk000as89jz0doenfu', 'cmu3yqpqi0009s89jkiu2fjql', 'Acme Admin', '+1-555-1001', NULL, NULL, NULL, '2026-09-16 10:33:52.074');
INSERT INTO auth.profiles VALUES ('cmu3yqqe2000cs89jng8zt912', 'cmu3yqqe0000bs89j9tfgtek1', 'Acme Approver', '+1-555-1002', NULL, NULL, NULL, '2026-09-16 10:33:52.92');
INSERT INTO auth.profiles VALUES ('cmu3yqr6o000es89jtcz4nmid', 'cmu3yqr6m000ds89jz8772cn8', 'Acme Validator', '+1-555-1003', NULL, NULL, NULL, '2026-09-16 10:33:53.95');
INSERT INTO auth.profiles VALUES ('cmu3yqryj000gs89jley8x437', 'cmu3yqryh000fs89jc1gy5e18', 'Alice Acme', '+1-555-1004', NULL, NULL, NULL, '2026-09-16 10:33:54.953');
INSERT INTO auth.profiles VALUES ('cmu3yqt22000is89jg1dzby0v', 'cmu3yqt21000hs89j427o95w6', 'Bob Acme', '+1-555-1005', NULL, NULL, NULL, '2026-09-16 10:33:56.377');
INSERT INTO auth.profiles VALUES ('cmu3yqtql000ks89jc8oq6u98', 'cmu3yqtqk000js89jw1iwqta1', 'Eve Acme', '+1-555-1006', NULL, NULL, NULL, '2026-09-16 10:33:57.26');
INSERT INTO auth.profiles VALUES ('cmu3yqun4000ms89jx01yomxq', 'cmu3yqun3000ls89jfi1dcr2k', 'Globe Admin', '+1-555-2001', NULL, NULL, NULL, '2026-09-16 10:33:58.431');
INSERT INTO auth.profiles VALUES ('cmu3yqvm1000os89j723fm6xo', 'cmu3yqvm0000ns89jptkh2kir', 'Globe Approver', '+1-555-2002', NULL, NULL, NULL, '2026-09-16 10:33:59.688');
INSERT INTO auth.profiles VALUES ('cmu3yqwej000qs89jwf7ds4eq', 'cmu3yqwei000ps89ju9ugozyk', 'Clara Globe', '+1-555-2003', NULL, NULL, NULL, '2026-09-16 10:34:00.714');
INSERT INTO auth.profiles VALUES ('cmu3yqx3w000ss89jluda1ufx', 'cmu3yqx3u000rs89jr0ujbyrh', 'David Globe', '+1-555-2004', NULL, NULL, NULL, '2026-09-16 10:34:01.626');
INSERT INTO auth.profiles VALUES ('cmu3yqy6n000us89j58xtw1tm', 'cmu3yqy6l000ts89juh717uib', 'FastCredit Admin', '+1-555-3001', NULL, NULL, NULL, '2026-09-16 10:34:03.021');
INSERT INTO auth.profiles VALUES ('cmu3yqyw1000ws89jsi8i5ta2', 'cmu3yqyw0000vs89jh46x8qxd', 'Fiona Fast', '+1-555-3002', NULL, NULL, NULL, '2026-09-16 10:34:03.936');
INSERT INTO auth.profiles VALUES ('cmu3yqzo7000ys89jujoq44qd', 'cmu3yqzo5000xs89jz00tb7v3', 'Everest Admin', '+1-555-4001', NULL, NULL, NULL, '2026-09-16 10:34:04.949');
INSERT INTO auth.profiles VALUES ('cmu3yr0wa0010s89jswixrovi', 'cmu3yr0w6000zs89ji3zge16s', 'Everest Approver', '+1-555-4002', NULL, NULL, NULL, '2026-09-16 10:34:06.534');
INSERT INTO auth.profiles VALUES ('cmu3yr2pn0012s89ja71ak2y9', 'cmu3yr2pm0011s89j1bvh5335', 'Eva Everest', '+1-555-4003', NULL, NULL, NULL, '2026-09-16 10:34:08.89');
INSERT INTO auth.profiles VALUES ('cmu3yr3dz0014s89jv8p8xni3', 'cmu3yr3dx0013s89jknttmhix', 'Sam Everest', '+1-555-4004', NULL, NULL, NULL, '2026-09-16 10:34:09.766');
INSERT INTO auth.profiles VALUES ('cmu3yr49t0016s89ju0j3k070', 'cmu3yr49s0015s89jifj3v6l9', 'Himalayan Admin', '+1-555-5001', NULL, NULL, NULL, '2026-09-16 10:34:10.912');
INSERT INTO auth.profiles VALUES ('cmu3yr5ti0018s89joa6jey59', 'cmu3yr5th0017s89jzckxfaua', 'Hari Himalayan', '+1-555-5002', NULL, NULL, NULL, '2026-09-16 10:34:12.917');


--
-- Data for Name: role_definitions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.role_definitions VALUES (1, 'Supercontroller', 'Platform super admin', 0, true, '#000000', 'shield-admin');
INSERT INTO auth.role_definitions VALUES (2, 'TenantAdmin', 'Tenant administrator', 1, true, '#0066cc', 'building');
INSERT INTO auth.role_definitions VALUES (3, 'Admin', 'System admin (legacy)', 0, true, '#1a1a1a', 'shield');
INSERT INTO auth.role_definitions VALUES (4, 'LoanApprover', 'Loan approver', 2, true, '#0099cc', 'check-circle');
INSERT INTO auth.role_definitions VALUES (5, 'Validator', 'KYC/Documents validator', 2, true, '#6600cc', 'briefcase');
INSERT INTO auth.role_definitions VALUES (6, 'Employee', 'Tenant employee', 2, true, '#6600cc', 'briefcase');
INSERT INTO auth.role_definitions VALUES (7, 'Customer', 'End customer', 3, true, '#00cc66', 'user');


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.role_permissions VALUES (1, 1, 1);
INSERT INTO auth.role_permissions VALUES (2, 1, 2);
INSERT INTO auth.role_permissions VALUES (3, 1, 3);
INSERT INTO auth.role_permissions VALUES (4, 1, 4);
INSERT INTO auth.role_permissions VALUES (5, 1, 13);
INSERT INTO auth.role_permissions VALUES (6, 1, 14);
INSERT INTO auth.role_permissions VALUES (7, 1, 15);
INSERT INTO auth.role_permissions VALUES (8, 1, 12);
INSERT INTO auth.role_permissions VALUES (9, 1, 9);
INSERT INTO auth.role_permissions VALUES (10, 1, 10);
INSERT INTO auth.role_permissions VALUES (11, 1, 11);
INSERT INTO auth.role_permissions VALUES (12, 1, 5);
INSERT INTO auth.role_permissions VALUES (13, 1, 6);
INSERT INTO auth.role_permissions VALUES (14, 1, 7);
INSERT INTO auth.role_permissions VALUES (15, 1, 8);
INSERT INTO auth.role_permissions VALUES (16, 2, 2);
INSERT INTO auth.role_permissions VALUES (17, 2, 3);
INSERT INTO auth.role_permissions VALUES (18, 2, 9);
INSERT INTO auth.role_permissions VALUES (19, 2, 10);
INSERT INTO auth.role_permissions VALUES (20, 2, 11);
INSERT INTO auth.role_permissions VALUES (21, 2, 5);
INSERT INTO auth.role_permissions VALUES (22, 2, 7);
INSERT INTO auth.role_permissions VALUES (23, 2, 8);
INSERT INTO auth.role_permissions VALUES (24, 2, 14);
INSERT INTO auth.role_permissions VALUES (25, 2, 12);
INSERT INTO auth.role_permissions VALUES (26, 3, 12);
INSERT INTO auth.role_permissions VALUES (27, 3, 9);
INSERT INTO auth.role_permissions VALUES (28, 3, 10);
INSERT INTO auth.role_permissions VALUES (29, 3, 5);
INSERT INTO auth.role_permissions VALUES (30, 3, 6);
INSERT INTO auth.role_permissions VALUES (31, 3, 7);
INSERT INTO auth.role_permissions VALUES (32, 3, 8);
INSERT INTO auth.role_permissions VALUES (33, 3, 14);
INSERT INTO auth.role_permissions VALUES (34, 4, 5);
INSERT INTO auth.role_permissions VALUES (35, 4, 7);
INSERT INTO auth.role_permissions VALUES (36, 4, 8);
INSERT INTO auth.role_permissions VALUES (37, 4, 9);
INSERT INTO auth.role_permissions VALUES (38, 4, 14);
INSERT INTO auth.role_permissions VALUES (39, 5, 5);
INSERT INTO auth.role_permissions VALUES (40, 5, 9);
INSERT INTO auth.role_permissions VALUES (41, 5, 14);
INSERT INTO auth.role_permissions VALUES (42, 6, 5);
INSERT INTO auth.role_permissions VALUES (43, 6, 9);
INSERT INTO auth.role_permissions VALUES (44, 7, 5);
INSERT INTO auth.role_permissions VALUES (45, 7, 6);
INSERT INTO auth.role_permissions VALUES (46, 7, 9);


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.sessions VALUES ('cmu3yzdn60000m49j2kezvo9n', 'cmu3yqp1f0003s89jx07kkq7k', '$2b$12$PMm9IJxH3w3d68qVUEvIyOOMDlsI7BT7ZKqQ/2P1KJmTWD7u0yihC', false, '2026-09-23 10:40:36.28', '2026-09-16 10:40:36.306');


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.tenants VALUES (1, 'default', 'Default Tenant', 'default.finguard.local', 'fintech', 'active', '2026-09-16 10:33:41.556', NULL, 'professional', 500, 10000, 0, 3, '2026-09-16 10:34:13.844', true, true, true, false, NULL, true);
INSERT INTO auth.tenants VALUES (2, 'finguard-acme', 'Acme Financial Corporation', 'acme.finguard.local', 'bank', 'active', '2026-09-16 10:33:43.003', NULL, 'enterprise', 500, 10000, 4, 6, '2026-09-16 10:34:14.021', true, true, true, false, NULL, true);
INSERT INTO auth.tenants VALUES (3, 'finguard-globebank', 'GlobeBank', 'globebank.finguard.local', 'bank', 'active', '2026-09-16 10:33:43.204', NULL, 'enterprise', 1000, 50000, 4, 4, '2026-09-16 10:34:14.187', true, true, true, false, NULL, true);
INSERT INTO auth.tenants VALUES (4, 'finguard-fastcredit', 'FastCredit Fintech', 'fastcredit.finguard.local', 'fintech', 'active', '2026-09-16 10:33:43.562', NULL, 'basic', 100, 1000, 2, 2, '2026-09-16 10:34:14.347', true, true, true, false, NULL, true);
INSERT INTO auth.tenants VALUES (6, 'finguard-himalayan', 'Himalayan Microfinance', 'himalayan.finguard.local', 'microfinance', 'active', '2026-09-16 10:33:44.107', NULL, 'basic', 150, 2000, 2, 2, '2026-09-16 10:34:14.666', true, true, true, false, NULL, true);
INSERT INTO auth.tenants VALUES (5, 'finguard-everest', 'Everest Credit Union', 'everest.finguard.local', 'credit-union', 'active', '2026-09-16 10:33:43.822', NULL, 'professional', 300, 5000, 4, 4, '2026-09-16 10:34:14.507', true, true, true, false, NULL, true);


--
-- Data for Name: tenant_admins; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: transactions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

INSERT INTO auth.transactions VALUES ('cmu3yr5ye001gs89jxmlkly6g', 2, 'cmu3yr5y5001fs89jkis3w0sz', 'cmu3yqryh000fs89jc1gy5e18', '2026-09-16 10:34:13.09', 'Salary credit', NULL, 5000.00, 15000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.094');
INSERT INTO auth.transactions VALUES ('cmu3yr5yy001hs89j3s93imft', 2, 'cmu3yr5y5001fs89jkis3w0sz', 'cmu3yqryh000fs89jc1gy5e18', '2026-09-09 10:34:13.09', 'Grocery expense', 1200.00, NULL, 15500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.114');
INSERT INTO auth.transactions VALUES ('cmu3yr5z3001is89jcjsesm2m', 2, 'cmu3yr5y5001fs89jkis3w0sz', 'cmu3yqryh000fs89jc1gy5e18', '2026-09-02 10:34:13.09', 'Salary credit', NULL, 5000.00, 16000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.119');
INSERT INTO auth.transactions VALUES ('cmu3yr5z9001js89j5s63h442', 2, 'cmu3yr5y5001fs89jkis3w0sz', 'cmu3yqryh000fs89jc1gy5e18', '2026-08-26 10:34:13.09', 'Grocery expense', 1200.00, NULL, 16500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.125');
INSERT INTO auth.transactions VALUES ('cmu3yr5ze001ks89jtel5z09h', 2, 'cmu3yr5y5001fs89jkis3w0sz', 'cmu3yqryh000fs89jc1gy5e18', '2026-08-19 10:34:13.09', 'Salary credit', NULL, 5000.00, 17000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.13');
INSERT INTO auth.transactions VALUES ('cmu3yr60x001ts89j05j6yaz1', 2, 'cmu3yr60t001ss89jovjj5cqq', 'cmu3yqt21000hs89j427o95w6', '2026-09-16 10:34:13.184', 'Salary credit', NULL, 5000.00, 15000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.185');
INSERT INTO auth.transactions VALUES ('cmu3yr610001us89jzcct1c3d', 2, 'cmu3yr60t001ss89jovjj5cqq', 'cmu3yqt21000hs89j427o95w6', '2026-09-09 10:34:13.184', 'Grocery expense', 1200.00, NULL, 15500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.188');
INSERT INTO auth.transactions VALUES ('cmu3yr613001vs89j4p7ov0xg', 2, 'cmu3yr60t001ss89jovjj5cqq', 'cmu3yqt21000hs89j427o95w6', '2026-09-02 10:34:13.184', 'Salary credit', NULL, 5000.00, 16000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.191');
INSERT INTO auth.transactions VALUES ('cmu3yr616001ws89jibtbvjsx', 2, 'cmu3yr60t001ss89jovjj5cqq', 'cmu3yqt21000hs89j427o95w6', '2026-08-26 10:34:13.184', 'Grocery expense', 1200.00, NULL, 16500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.194');
INSERT INTO auth.transactions VALUES ('cmu3yr619001xs89jf577bj1z', 2, 'cmu3yr60t001ss89jovjj5cqq', 'cmu3yqt21000hs89j427o95w6', '2026-08-19 10:34:13.184', 'Salary credit', NULL, 5000.00, 17000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.197');
INSERT INTO auth.transactions VALUES ('cmu3yr62q0025s89jl4m71oxx', 3, 'cmu3yr62l0024s89jcajmt9m0', 'cmu3yqwei000ps89ju9ugozyk', '2026-09-16 10:34:13.249', 'Salary credit', NULL, 5000.00, 15000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.25');
INSERT INTO auth.transactions VALUES ('cmu3yr62s0026s89jhtk12q34', 3, 'cmu3yr62l0024s89jcajmt9m0', 'cmu3yqwei000ps89ju9ugozyk', '2026-09-09 10:34:13.249', 'Grocery expense', 1200.00, NULL, 15500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.252');
INSERT INTO auth.transactions VALUES ('cmu3yr62v0027s89jrdkmsqt7', 3, 'cmu3yr62l0024s89jcajmt9m0', 'cmu3yqwei000ps89ju9ugozyk', '2026-09-02 10:34:13.249', 'Salary credit', NULL, 5000.00, 16000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.255');
INSERT INTO auth.transactions VALUES ('cmu3yr6300028s89ja3v53cqz', 3, 'cmu3yr62l0024s89jcajmt9m0', 'cmu3yqwei000ps89ju9ugozyk', '2026-08-26 10:34:13.249', 'Grocery expense', 1200.00, NULL, 16500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.26');
INSERT INTO auth.transactions VALUES ('cmu3yr6330029s89jttfdo5bu', 3, 'cmu3yr62l0024s89jcajmt9m0', 'cmu3yqwei000ps89ju9ugozyk', '2026-08-19 10:34:13.249', 'Salary credit', NULL, 5000.00, 17000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.263');
INSERT INTO auth.transactions VALUES ('cmu3yr64h002is89jky8gpfkg', 3, 'cmu3yr64e002hs89j2hcr5uia', 'cmu3yqx3u000rs89jr0ujbyrh', '2026-09-16 10:34:13.313', 'Salary credit', NULL, 5000.00, 15000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.313');
INSERT INTO auth.transactions VALUES ('cmu3yr64k002js89jp2r07oah', 3, 'cmu3yr64e002hs89j2hcr5uia', 'cmu3yqx3u000rs89jr0ujbyrh', '2026-09-09 10:34:13.313', 'Grocery expense', 1200.00, NULL, 15500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.316');
INSERT INTO auth.transactions VALUES ('cmu3yr64p002ks89jhsg92tso', 3, 'cmu3yr64e002hs89j2hcr5uia', 'cmu3yqx3u000rs89jr0ujbyrh', '2026-09-02 10:34:13.313', 'Salary credit', NULL, 5000.00, 16000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.321');
INSERT INTO auth.transactions VALUES ('cmu3yr64u002ls89jdhceat1m', 3, 'cmu3yr64e002hs89j2hcr5uia', 'cmu3yqx3u000rs89jr0ujbyrh', '2026-08-26 10:34:13.313', 'Grocery expense', 1200.00, NULL, 16500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.326');
INSERT INTO auth.transactions VALUES ('cmu3yr64y002ms89jn74w2i1c', 3, 'cmu3yr64e002hs89j2hcr5uia', 'cmu3yqx3u000rs89jr0ujbyrh', '2026-08-19 10:34:13.313', 'Salary credit', NULL, 5000.00, 17000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.33');
INSERT INTO auth.transactions VALUES ('cmu3yr66g002us89jjd4aq9b0', 4, 'cmu3yr66d002ts89j680nu5jn', 'cmu3yqyw0000vs89jh46x8qxd', '2026-09-16 10:34:13.383', 'Salary credit', NULL, 5000.00, 15000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.384');
INSERT INTO auth.transactions VALUES ('cmu3yr66j002vs89jlx8p6p91', 4, 'cmu3yr66d002ts89j680nu5jn', 'cmu3yqyw0000vs89jh46x8qxd', '2026-09-09 10:34:13.383', 'Grocery expense', 1200.00, NULL, 15500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.387');
INSERT INTO auth.transactions VALUES ('cmu3yr66p002ws89jm6dbgva2', 4, 'cmu3yr66d002ts89j680nu5jn', 'cmu3yqyw0000vs89jh46x8qxd', '2026-09-02 10:34:13.383', 'Salary credit', NULL, 5000.00, 16000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.393');
INSERT INTO auth.transactions VALUES ('cmu3yr66s002xs89j4lgw05wd', 4, 'cmu3yr66d002ts89j680nu5jn', 'cmu3yqyw0000vs89jh46x8qxd', '2026-08-26 10:34:13.383', 'Grocery expense', 1200.00, NULL, 16500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.396');
INSERT INTO auth.transactions VALUES ('cmu3yr66v002ys89jlide1ftd', 4, 'cmu3yr66d002ts89j680nu5jn', 'cmu3yqyw0000vs89jh46x8qxd', '2026-08-19 10:34:13.383', 'Salary credit', NULL, 5000.00, 17000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.399');
INSERT INTO auth.transactions VALUES ('cmu3yr6820036s89j9damhbl9', 5, 'cmu3yr67x0035s89jr8o6tr1m', 'cmu3yr2pm0011s89j1bvh5335', '2026-09-16 10:34:13.441', 'Salary credit', NULL, 5000.00, 15000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.442');
INSERT INTO auth.transactions VALUES ('cmu3yr6850037s89jnwdail72', 5, 'cmu3yr67x0035s89jr8o6tr1m', 'cmu3yr2pm0011s89j1bvh5335', '2026-09-09 10:34:13.441', 'Grocery expense', 1200.00, NULL, 15500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.445');
INSERT INTO auth.transactions VALUES ('cmu3yr6880038s89jmqg0ce65', 5, 'cmu3yr67x0035s89jr8o6tr1m', 'cmu3yr2pm0011s89j1bvh5335', '2026-09-02 10:34:13.441', 'Salary credit', NULL, 5000.00, 16000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.448');
INSERT INTO auth.transactions VALUES ('cmu3yr68a0039s89j1v3e5806', 5, 'cmu3yr67x0035s89jr8o6tr1m', 'cmu3yr2pm0011s89j1bvh5335', '2026-08-26 10:34:13.441', 'Grocery expense', 1200.00, NULL, 16500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.45');
INSERT INTO auth.transactions VALUES ('cmu3yr68d003as89j0u2fgf0y', 5, 'cmu3yr67x0035s89jr8o6tr1m', 'cmu3yr2pm0011s89j1bvh5335', '2026-08-19 10:34:13.441', 'Salary credit', NULL, 5000.00, 17000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.453');
INSERT INTO auth.transactions VALUES ('cmu3yr69o003js89jr5rpwfs2', 5, 'cmu3yr69l003is89jjm1bt7wt', 'cmu3yr3dx0013s89jknttmhix', '2026-09-16 10:34:13.499', 'Salary credit', NULL, 5000.00, 15000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.5');
INSERT INTO auth.transactions VALUES ('cmu3yr69q003ks89j559cghv7', 5, 'cmu3yr69l003is89jjm1bt7wt', 'cmu3yr3dx0013s89jknttmhix', '2026-09-09 10:34:13.499', 'Grocery expense', 1200.00, NULL, 15500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.502');
INSERT INTO auth.transactions VALUES ('cmu3yr69t003ls89jl0r9ehmk', 5, 'cmu3yr69l003is89jjm1bt7wt', 'cmu3yr3dx0013s89jknttmhix', '2026-09-02 10:34:13.499', 'Salary credit', NULL, 5000.00, 16000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.505');
INSERT INTO auth.transactions VALUES ('cmu3yr69w003ms89j9xpz3owd', 5, 'cmu3yr69l003is89jjm1bt7wt', 'cmu3yr3dx0013s89jknttmhix', '2026-08-26 10:34:13.499', 'Grocery expense', 1200.00, NULL, 16500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.508');
INSERT INTO auth.transactions VALUES ('cmu3yr69y003ns89jhju13ed8', 5, 'cmu3yr69l003is89jjm1bt7wt', 'cmu3yr3dx0013s89jknttmhix', '2026-08-19 10:34:13.499', 'Salary credit', NULL, 5000.00, 17000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.51');
INSERT INTO auth.transactions VALUES ('cmu3yr6ay003vs89j2foxcqqu', 6, 'cmu3yr6av003us89jqcegtedk', 'cmu3yr5th0017s89jzckxfaua', '2026-09-16 10:34:13.545', 'Salary credit', NULL, 5000.00, 15000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.546');
INSERT INTO auth.transactions VALUES ('cmu3yr6b1003ws89j3ewjxh7u', 6, 'cmu3yr6av003us89jqcegtedk', 'cmu3yr5th0017s89jzckxfaua', '2026-09-09 10:34:13.545', 'Grocery expense', 1200.00, NULL, 15500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.549');
INSERT INTO auth.transactions VALUES ('cmu3yr6b3003xs89jjrktu6t4', 6, 'cmu3yr6av003us89jqcegtedk', 'cmu3yr5th0017s89jzckxfaua', '2026-09-02 10:34:13.545', 'Salary credit', NULL, 5000.00, 16000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.551');
INSERT INTO auth.transactions VALUES ('cmu3yr6b6003ys89jt3x1mtwv', 6, 'cmu3yr6av003us89jqcegtedk', 'cmu3yr5th0017s89jzckxfaua', '2026-08-26 10:34:13.545', 'Grocery expense', 1200.00, NULL, 16500.00, NULL, 'EXPENSE', 1, '2026-09-16 10:34:13.554');
INSERT INTO auth.transactions VALUES ('cmu3yr6b9003zs89j867gy3jt', 6, 'cmu3yr6av003us89jqcegtedk', 'cmu3yr5th0017s89jzckxfaua', '2026-08-19 10:34:13.545', 'Salary credit', NULL, 5000.00, 17000.00, NULL, 'INCOME', 1, '2026-09-16 10:34:13.557');


--
-- Data for Name: verification_reports; Type: TABLE DATA; Schema: auth; Owner: postgres
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public._prisma_migrations VALUES ('7c5721ca-8b36-4759-b463-8721daac95e8', '56fe5eb91a4329fc65b9f844ea15af83ea90b66913ddf28f6ded678ae0c8baaa', '2026-09-16 16:20:15.750749+05:45', '20250916000000_add_tenant_rbac', '', NULL, '2026-09-16 16:20:15.750749+05:45', 0);
INSERT INTO public._prisma_migrations VALUES ('df08553e-ebfb-4447-9697-61a735819650', '9692fa371c5e273694ee81473bf822997a316836dcd8b98aa91d6fe12a801ea4', '2026-09-16 16:20:28.364318+05:45', '20250916000001_supercontroller_hierarchy', '', NULL, '2026-09-16 16:20:28.364318+05:45', 0);
INSERT INTO public._prisma_migrations VALUES ('a0bfeb7c-0c16-43bb-b49b-c843a8578dc6', '3207bf5e9d77bd4844d1a7aef472982167e9070501eee9565aefae35e950f6cf', '2026-09-16 16:20:40.406657+05:45', '20250916000002_fix_loan_ml_columns', '', NULL, '2026-09-16 16:20:40.406657+05:45', 0);
INSERT INTO public._prisma_migrations VALUES ('806f7834-2ba5-4d00-87cc-7021e132c649', 'fc82897bcead3bb891bae3b6531ef4a32a3bb98ecfca3b93458ca6c43beeab99', '2026-09-16 16:20:58.279271+05:45', '20260722032719_init', '', NULL, '2026-09-16 16:20:58.279271+05:45', 0);


--
-- Data for Name: feature_toggles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.feature_toggles VALUES (1, 1, 'feature_ml_scoring', true, 1, '2026-09-16 10:33:46.045', NULL);
INSERT INTO public.feature_toggles VALUES (2, 1, 'feature_audit_logs', true, 1, '2026-09-16 10:33:46.058', NULL);
INSERT INTO public.feature_toggles VALUES (3, 1, 'feature_api_access', true, 1, '2026-09-16 10:33:46.06', NULL);
INSERT INTO public.feature_toggles VALUES (4, 1, 'feature_custom_workflows', true, 1, '2026-09-16 10:33:46.063', NULL);
INSERT INTO public.feature_toggles VALUES (5, 2, 'feature_ml_scoring', true, 1, '2026-09-16 10:33:46.067', NULL);
INSERT INTO public.feature_toggles VALUES (6, 2, 'feature_audit_logs', true, 1, '2026-09-16 10:33:46.074', NULL);
INSERT INTO public.feature_toggles VALUES (7, 2, 'feature_api_access', true, 1, '2026-09-16 10:33:46.076', NULL);
INSERT INTO public.feature_toggles VALUES (8, 2, 'feature_custom_workflows', true, 1, '2026-09-16 10:33:46.079', NULL);
INSERT INTO public.feature_toggles VALUES (9, 3, 'feature_ml_scoring', true, 1, '2026-09-16 10:33:46.081', NULL);
INSERT INTO public.feature_toggles VALUES (10, 3, 'feature_audit_logs', true, 1, '2026-09-16 10:33:46.085', NULL);
INSERT INTO public.feature_toggles VALUES (11, 3, 'feature_api_access', true, 1, '2026-09-16 10:33:46.089', NULL);
INSERT INTO public.feature_toggles VALUES (12, 3, 'feature_custom_workflows', true, 1, '2026-09-16 10:33:46.091', NULL);
INSERT INTO public.feature_toggles VALUES (13, 4, 'feature_ml_scoring', true, 1, '2026-09-16 10:33:46.094', NULL);
INSERT INTO public.feature_toggles VALUES (14, 4, 'feature_audit_logs', false, 1, '2026-09-16 10:33:46.097', NULL);
INSERT INTO public.feature_toggles VALUES (15, 4, 'feature_api_access', false, 1, '2026-09-16 10:33:46.1', NULL);
INSERT INTO public.feature_toggles VALUES (16, 4, 'feature_custom_workflows', false, 1, '2026-09-16 10:33:46.104', NULL);
INSERT INTO public.feature_toggles VALUES (17, 5, 'feature_ml_scoring', true, 1, '2026-09-16 10:33:46.107', NULL);
INSERT INTO public.feature_toggles VALUES (18, 5, 'feature_audit_logs', true, 1, '2026-09-16 10:33:46.109', NULL);
INSERT INTO public.feature_toggles VALUES (20, 5, 'feature_custom_workflows', true, 1, '2026-09-16 10:33:46.115', NULL);
INSERT INTO public.feature_toggles VALUES (21, 6, 'feature_ml_scoring', true, 1, '2026-09-16 10:33:46.118', NULL);
INSERT INTO public.feature_toggles VALUES (22, 6, 'feature_audit_logs', false, 1, '2026-09-16 10:33:46.121', NULL);
INSERT INTO public.feature_toggles VALUES (23, 6, 'feature_api_access', false, 1, '2026-09-16 10:33:46.172', NULL);
INSERT INTO public.feature_toggles VALUES (24, 6, 'feature_custom_workflows', false, 1, '2026-09-16 10:33:46.177', NULL);
INSERT INTO public.feature_toggles VALUES (19, 5, 'feature_api_access', true, 1, '2026-09-16 10:41:12.804', NULL);


--
-- Data for Name: supercontroller; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.supercontroller VALUES (1, 'admin@finguard.io', '$2b$12$2.WLgc6mE6TcpCKszv6v.uKiixwxuwbLC1j2e2/XDVQHSULEKZIuO', 'FinGuard Super Admin', '2026-09-16 10:33:40.318', NULL, 'active');


--
-- Data for Name: supercontroller_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.supercontroller_audit_logs VALUES (1, 1, 'feature.toggle', 'feature', '5:feature_api_access', '{"featureName":"feature_api_access","isEnabled":false}', NULL, '2026-09-16 10:41:12.201');
INSERT INTO public.supercontroller_audit_logs VALUES (2, 1, 'feature.toggle', 'feature', '5:feature_api_access', '{"featureName":"feature_api_access","isEnabled":true}', NULL, '2026-09-16 10:41:12.811');


--
-- Data for Name: tenant_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tenant_metrics VALUES (1, 1, '2026-09-15', 12, 20, 24000.00, 644, 1.50, 109, '2026-09-16 10:34:13.567');
INSERT INTO public.tenant_metrics VALUES (2, 1, '2026-09-14', 15, 25, 30000.00, 570, 1.65, 111, '2026-09-16 10:34:13.583');
INSERT INTO public.tenant_metrics VALUES (3, 1, '2026-09-13', 12, 32, 38400.00, 635, 0.04, 96, '2026-09-16 10:34:13.588');
INSERT INTO public.tenant_metrics VALUES (4, 1, '2026-09-12', 10, 32, 38400.00, 686, 0.71, 116, '2026-09-16 10:34:13.594');
INSERT INTO public.tenant_metrics VALUES (5, 1, '2026-09-11', 10, 34, 40800.00, 532, 1.24, 98, '2026-09-16 10:34:13.599');
INSERT INTO public.tenant_metrics VALUES (6, 1, '2026-09-10', 17, 24, 28800.00, 762, 0.43, 84, '2026-09-16 10:34:13.604');
INSERT INTO public.tenant_metrics VALUES (7, 1, '2026-09-09', 14, 29, 34800.00, 620, 1.74, 117, '2026-09-16 10:34:13.611');
INSERT INTO public.tenant_metrics VALUES (8, 1, '2026-09-08', 13, 21, 25200.00, 616, 1.09, 98, '2026-09-16 10:34:13.616');
INSERT INTO public.tenant_metrics VALUES (9, 1, '2026-09-07', 17, 26, 31200.00, 587, 1.16, 82, '2026-09-16 10:34:13.621');
INSERT INTO public.tenant_metrics VALUES (10, 1, '2026-09-06', 10, 33, 39600.00, 738, 0.93, 109, '2026-09-16 10:34:13.627');
INSERT INTO public.tenant_metrics VALUES (11, 1, '2026-09-05', 12, 21, 25200.00, 763, 0.93, 89, '2026-09-16 10:34:13.634');
INSERT INTO public.tenant_metrics VALUES (12, 1, '2026-09-04', 15, 26, 31200.00, 714, 0.25, 119, '2026-09-16 10:34:13.64');
INSERT INTO public.tenant_metrics VALUES (13, 1, '2026-09-03', 16, 23, 27600.00, 629, 0.32, 97, '2026-09-16 10:34:13.645');
INSERT INTO public.tenant_metrics VALUES (14, 1, '2026-09-02', 10, 24, 28800.00, 610, 1.81, 88, '2026-09-16 10:34:13.649');
INSERT INTO public.tenant_metrics VALUES (15, 1, '2026-09-01', 17, 23, 27600.00, 712, 0.16, 88, '2026-09-16 10:34:13.654');
INSERT INTO public.tenant_metrics VALUES (16, 1, '2026-08-31', 17, 23, 27600.00, 546, 1.09, 110, '2026-09-16 10:34:13.664');
INSERT INTO public.tenant_metrics VALUES (17, 1, '2026-08-30', 14, 31, 37200.00, 754, 0.84, 81, '2026-09-16 10:34:13.687');
INSERT INTO public.tenant_metrics VALUES (18, 1, '2026-08-29', 17, 21, 25200.00, 545, 0.46, 99, '2026-09-16 10:34:13.754');
INSERT INTO public.tenant_metrics VALUES (19, 1, '2026-08-28', 11, 31, 37200.00, 519, 0.30, 99, '2026-09-16 10:34:13.76');
INSERT INTO public.tenant_metrics VALUES (20, 1, '2026-08-27', 17, 28, 33600.00, 767, 1.19, 102, '2026-09-16 10:34:13.765');
INSERT INTO public.tenant_metrics VALUES (21, 1, '2026-08-26', 17, 21, 25200.00, 602, 0.38, 83, '2026-09-16 10:34:13.77');
INSERT INTO public.tenant_metrics VALUES (22, 1, '2026-08-25', 10, 28, 33600.00, 607, 1.58, 99, '2026-09-16 10:34:13.776');
INSERT INTO public.tenant_metrics VALUES (23, 1, '2026-08-24', 15, 28, 33600.00, 644, 0.22, 112, '2026-09-16 10:34:13.78');
INSERT INTO public.tenant_metrics VALUES (24, 1, '2026-08-23', 17, 22, 26400.00, 560, 1.68, 91, '2026-09-16 10:34:13.786');
INSERT INTO public.tenant_metrics VALUES (25, 1, '2026-08-22', 12, 30, 36000.00, 604, 1.69, 86, '2026-09-16 10:34:13.794');
INSERT INTO public.tenant_metrics VALUES (26, 1, '2026-08-21', 13, 26, 31200.00, 634, 0.34, 101, '2026-09-16 10:34:13.798');
INSERT INTO public.tenant_metrics VALUES (27, 1, '2026-08-20', 11, 33, 39600.00, 525, 0.86, 117, '2026-09-16 10:34:13.805');
INSERT INTO public.tenant_metrics VALUES (28, 1, '2026-08-19', 12, 20, 24000.00, 687, 1.48, 110, '2026-09-16 10:34:13.811');
INSERT INTO public.tenant_metrics VALUES (29, 1, '2026-08-18', 16, 20, 24000.00, 523, 1.02, 85, '2026-09-16 10:34:13.816');
INSERT INTO public.tenant_metrics VALUES (30, 1, '2026-08-17', 15, 34, 40800.00, 752, 1.70, 112, '2026-09-16 10:34:13.82');
INSERT INTO public.tenant_metrics VALUES (31, 2, '2026-09-15', 17, 22, 26400.00, 724, 0.20, 101, '2026-09-16 10:34:13.856');
INSERT INTO public.tenant_metrics VALUES (32, 2, '2026-09-14', 12, 28, 33600.00, 543, 0.81, 118, '2026-09-16 10:34:13.862');
INSERT INTO public.tenant_metrics VALUES (33, 2, '2026-09-13', 13, 23, 27600.00, 520, 0.93, 81, '2026-09-16 10:34:13.867');
INSERT INTO public.tenant_metrics VALUES (34, 2, '2026-09-12', 15, 29, 34800.00, 731, 0.83, 84, '2026-09-16 10:34:13.873');
INSERT INTO public.tenant_metrics VALUES (35, 2, '2026-09-11', 10, 28, 33600.00, 720, 0.89, 81, '2026-09-16 10:34:13.88');
INSERT INTO public.tenant_metrics VALUES (36, 2, '2026-09-10', 10, 27, 32400.00, 726, 0.28, 87, '2026-09-16 10:34:13.885');
INSERT INTO public.tenant_metrics VALUES (37, 2, '2026-09-09', 10, 29, 34800.00, 775, 0.22, 93, '2026-09-16 10:34:13.89');
INSERT INTO public.tenant_metrics VALUES (38, 2, '2026-09-08', 11, 23, 27600.00, 724, 1.35, 81, '2026-09-16 10:34:13.895');
INSERT INTO public.tenant_metrics VALUES (39, 2, '2026-09-07', 16, 22, 26400.00, 733, 1.70, 94, '2026-09-16 10:34:13.899');
INSERT INTO public.tenant_metrics VALUES (40, 2, '2026-09-06', 11, 25, 30000.00, 657, 0.56, 110, '2026-09-16 10:34:13.904');
INSERT INTO public.tenant_metrics VALUES (41, 2, '2026-09-05', 15, 26, 31200.00, 541, 2.00, 100, '2026-09-16 10:34:13.909');
INSERT INTO public.tenant_metrics VALUES (42, 2, '2026-09-04', 12, 27, 32400.00, 517, 1.30, 89, '2026-09-16 10:34:13.914');
INSERT INTO public.tenant_metrics VALUES (43, 2, '2026-09-03', 16, 30, 36000.00, 588, 0.64, 119, '2026-09-16 10:34:13.92');
INSERT INTO public.tenant_metrics VALUES (44, 2, '2026-09-02', 13, 31, 37200.00, 564, 1.82, 111, '2026-09-16 10:34:13.932');
INSERT INTO public.tenant_metrics VALUES (45, 2, '2026-09-01', 16, 28, 33600.00, 587, 0.88, 98, '2026-09-16 10:34:13.937');
INSERT INTO public.tenant_metrics VALUES (46, 2, '2026-08-31', 17, 32, 38400.00, 745, 0.60, 108, '2026-09-16 10:34:13.943');
INSERT INTO public.tenant_metrics VALUES (47, 2, '2026-08-30', 15, 25, 30000.00, 589, 1.99, 87, '2026-09-16 10:34:13.948');
INSERT INTO public.tenant_metrics VALUES (48, 2, '2026-08-29', 17, 26, 31200.00, 711, 0.17, 97, '2026-09-16 10:34:13.953');
INSERT INTO public.tenant_metrics VALUES (49, 2, '2026-08-28', 10, 34, 40800.00, 675, 1.88, 109, '2026-09-16 10:34:13.959');
INSERT INTO public.tenant_metrics VALUES (50, 2, '2026-08-27', 16, 24, 28800.00, 728, 0.02, 99, '2026-09-16 10:34:13.965');
INSERT INTO public.tenant_metrics VALUES (51, 2, '2026-08-26', 13, 29, 34800.00, 685, 1.22, 109, '2026-09-16 10:34:13.97');
INSERT INTO public.tenant_metrics VALUES (52, 2, '2026-08-25', 14, 25, 30000.00, 734, 1.95, 103, '2026-09-16 10:34:13.976');
INSERT INTO public.tenant_metrics VALUES (53, 2, '2026-08-24', 17, 21, 25200.00, 501, 1.85, 104, '2026-09-16 10:34:13.981');
INSERT INTO public.tenant_metrics VALUES (54, 2, '2026-08-23', 16, 25, 30000.00, 775, 0.07, 107, '2026-09-16 10:34:13.985');
INSERT INTO public.tenant_metrics VALUES (55, 2, '2026-08-22', 10, 26, 31200.00, 678, 1.22, 87, '2026-09-16 10:34:13.99');
INSERT INTO public.tenant_metrics VALUES (56, 2, '2026-08-21', 16, 21, 25200.00, 534, 0.81, 89, '2026-09-16 10:34:13.995');
INSERT INTO public.tenant_metrics VALUES (57, 2, '2026-08-20', 12, 20, 24000.00, 703, 1.27, 100, '2026-09-16 10:34:14');
INSERT INTO public.tenant_metrics VALUES (58, 2, '2026-08-19', 17, 25, 30000.00, 666, 0.54, 95, '2026-09-16 10:34:14.005');
INSERT INTO public.tenant_metrics VALUES (59, 2, '2026-08-18', 17, 25, 30000.00, 712, 0.70, 100, '2026-09-16 10:34:14.011');
INSERT INTO public.tenant_metrics VALUES (60, 2, '2026-08-17', 12, 26, 31200.00, 736, 1.93, 92, '2026-09-16 10:34:14.015');
INSERT INTO public.tenant_metrics VALUES (61, 3, '2026-09-15', 49, 27, 32400.00, 571, 0.63, 93, '2026-09-16 10:34:14.027');
INSERT INTO public.tenant_metrics VALUES (62, 3, '2026-09-14', 54, 21, 25200.00, 624, 0.04, 94, '2026-09-16 10:34:14.031');
INSERT INTO public.tenant_metrics VALUES (63, 3, '2026-09-13', 47, 22, 26400.00, 707, 0.74, 116, '2026-09-16 10:34:14.036');
INSERT INTO public.tenant_metrics VALUES (64, 3, '2026-09-12', 54, 28, 33600.00, 672, 0.87, 80, '2026-09-16 10:34:14.041');
INSERT INTO public.tenant_metrics VALUES (65, 3, '2026-09-11', 52, 28, 33600.00, 595, 0.32, 114, '2026-09-16 10:34:14.047');
INSERT INTO public.tenant_metrics VALUES (66, 3, '2026-09-10', 49, 23, 27600.00, 795, 1.44, 96, '2026-09-16 10:34:14.051');
INSERT INTO public.tenant_metrics VALUES (67, 3, '2026-09-09', 51, 25, 30000.00, 659, 1.38, 100, '2026-09-16 10:34:14.056');
INSERT INTO public.tenant_metrics VALUES (68, 3, '2026-09-08', 53, 21, 25200.00, 570, 0.91, 89, '2026-09-16 10:34:14.061');
INSERT INTO public.tenant_metrics VALUES (69, 3, '2026-09-07', 49, 34, 40800.00, 747, 0.41, 90, '2026-09-16 10:34:14.066');
INSERT INTO public.tenant_metrics VALUES (70, 3, '2026-09-06', 53, 27, 32400.00, 794, 1.82, 108, '2026-09-16 10:34:14.07');
INSERT INTO public.tenant_metrics VALUES (71, 3, '2026-09-05', 54, 29, 34800.00, 797, 0.12, 106, '2026-09-16 10:34:14.076');
INSERT INTO public.tenant_metrics VALUES (72, 3, '2026-09-04', 54, 34, 40800.00, 791, 0.49, 99, '2026-09-16 10:34:14.081');
INSERT INTO public.tenant_metrics VALUES (73, 3, '2026-09-03', 53, 23, 27600.00, 737, 1.16, 106, '2026-09-16 10:34:14.085');
INSERT INTO public.tenant_metrics VALUES (74, 3, '2026-09-02', 52, 31, 37200.00, 505, 0.77, 103, '2026-09-16 10:34:14.09');
INSERT INTO public.tenant_metrics VALUES (75, 3, '2026-09-01', 47, 27, 32400.00, 622, 0.73, 102, '2026-09-16 10:34:14.095');
INSERT INTO public.tenant_metrics VALUES (76, 3, '2026-08-31', 50, 34, 40800.00, 604, 1.32, 91, '2026-09-16 10:34:14.099');
INSERT INTO public.tenant_metrics VALUES (77, 3, '2026-08-30', 50, 20, 24000.00, 622, 0.69, 80, '2026-09-16 10:34:14.104');
INSERT INTO public.tenant_metrics VALUES (78, 3, '2026-08-29', 53, 21, 25200.00, 672, 1.26, 90, '2026-09-16 10:34:14.109');
INSERT INTO public.tenant_metrics VALUES (79, 3, '2026-08-28', 51, 33, 39600.00, 739, 0.66, 92, '2026-09-16 10:34:14.114');
INSERT INTO public.tenant_metrics VALUES (80, 3, '2026-08-27', 54, 34, 40800.00, 688, 0.19, 107, '2026-09-16 10:34:14.119');
INSERT INTO public.tenant_metrics VALUES (81, 3, '2026-08-26', 51, 24, 28800.00, 547, 1.28, 83, '2026-09-16 10:34:14.125');
INSERT INTO public.tenant_metrics VALUES (82, 3, '2026-08-25', 49, 20, 24000.00, 742, 1.28, 95, '2026-09-16 10:34:14.13');
INSERT INTO public.tenant_metrics VALUES (83, 3, '2026-08-24', 51, 30, 36000.00, 615, 0.91, 117, '2026-09-16 10:34:14.135');
INSERT INTO public.tenant_metrics VALUES (84, 3, '2026-08-23', 46, 31, 37200.00, 541, 1.88, 119, '2026-09-16 10:34:14.143');
INSERT INTO public.tenant_metrics VALUES (85, 3, '2026-08-22', 45, 20, 24000.00, 549, 0.45, 119, '2026-09-16 10:34:14.147');
INSERT INTO public.tenant_metrics VALUES (86, 3, '2026-08-21', 48, 34, 40800.00, 581, 1.20, 116, '2026-09-16 10:34:14.153');
INSERT INTO public.tenant_metrics VALUES (87, 3, '2026-08-20', 46, 21, 25200.00, 783, 1.66, 105, '2026-09-16 10:34:14.167');
INSERT INTO public.tenant_metrics VALUES (88, 3, '2026-08-19', 47, 20, 24000.00, 577, 0.98, 85, '2026-09-16 10:34:14.171');
INSERT INTO public.tenant_metrics VALUES (89, 3, '2026-08-18', 45, 34, 40800.00, 735, 1.97, 90, '2026-09-16 10:34:14.177');
INSERT INTO public.tenant_metrics VALUES (90, 3, '2026-08-17', 51, 23, 27600.00, 717, 1.21, 82, '2026-09-16 10:34:14.181');
INSERT INTO public.tenant_metrics VALUES (91, 4, '2026-09-15', 13, 29, 34800.00, 540, 0.33, 95, '2026-09-16 10:34:14.194');
INSERT INTO public.tenant_metrics VALUES (92, 4, '2026-09-14', 10, 33, 39600.00, 769, 0.01, 80, '2026-09-16 10:34:14.199');
INSERT INTO public.tenant_metrics VALUES (93, 4, '2026-09-13', 14, 21, 25200.00, 517, 1.23, 104, '2026-09-16 10:34:14.203');
INSERT INTO public.tenant_metrics VALUES (94, 4, '2026-09-12', 16, 20, 24000.00, 792, 1.40, 88, '2026-09-16 10:34:14.208');
INSERT INTO public.tenant_metrics VALUES (95, 4, '2026-09-11', 12, 24, 28800.00, 622, 1.34, 112, '2026-09-16 10:34:14.213');
INSERT INTO public.tenant_metrics VALUES (96, 4, '2026-09-10', 14, 27, 32400.00, 589, 1.65, 87, '2026-09-16 10:34:14.218');
INSERT INTO public.tenant_metrics VALUES (97, 4, '2026-09-09', 11, 22, 26400.00, 586, 0.20, 91, '2026-09-16 10:34:14.223');
INSERT INTO public.tenant_metrics VALUES (98, 4, '2026-09-08', 15, 22, 26400.00, 523, 0.79, 99, '2026-09-16 10:34:14.229');
INSERT INTO public.tenant_metrics VALUES (99, 4, '2026-09-07', 15, 22, 26400.00, 507, 0.13, 84, '2026-09-16 10:34:14.235');
INSERT INTO public.tenant_metrics VALUES (100, 4, '2026-09-06', 15, 25, 30000.00, 526, 0.43, 111, '2026-09-16 10:34:14.24');
INSERT INTO public.tenant_metrics VALUES (101, 4, '2026-09-05', 17, 25, 30000.00, 609, 0.87, 118, '2026-09-16 10:34:14.245');
INSERT INTO public.tenant_metrics VALUES (102, 4, '2026-09-04', 13, 32, 38400.00, 711, 1.65, 92, '2026-09-16 10:34:14.25');
INSERT INTO public.tenant_metrics VALUES (103, 4, '2026-09-03', 12, 30, 36000.00, 605, 1.58, 86, '2026-09-16 10:34:14.255');
INSERT INTO public.tenant_metrics VALUES (104, 4, '2026-09-02', 11, 26, 31200.00, 722, 1.48, 82, '2026-09-16 10:34:14.26');
INSERT INTO public.tenant_metrics VALUES (105, 4, '2026-09-01', 11, 20, 24000.00, 584, 0.33, 117, '2026-09-16 10:34:14.265');
INSERT INTO public.tenant_metrics VALUES (106, 4, '2026-08-31', 15, 23, 27600.00, 764, 0.21, 88, '2026-09-16 10:34:14.27');
INSERT INTO public.tenant_metrics VALUES (107, 4, '2026-08-30', 17, 25, 30000.00, 583, 0.13, 98, '2026-09-16 10:34:14.275');
INSERT INTO public.tenant_metrics VALUES (108, 4, '2026-08-29', 11, 26, 31200.00, 623, 0.65, 85, '2026-09-16 10:34:14.28');
INSERT INTO public.tenant_metrics VALUES (109, 4, '2026-08-28', 13, 28, 33600.00, 637, 0.45, 117, '2026-09-16 10:34:14.284');
INSERT INTO public.tenant_metrics VALUES (110, 4, '2026-08-27', 15, 24, 28800.00, 758, 1.29, 91, '2026-09-16 10:34:14.289');
INSERT INTO public.tenant_metrics VALUES (111, 4, '2026-08-26', 16, 29, 34800.00, 518, 0.45, 86, '2026-09-16 10:34:14.294');
INSERT INTO public.tenant_metrics VALUES (112, 4, '2026-08-25', 11, 29, 34800.00, 500, 0.59, 83, '2026-09-16 10:34:14.299');
INSERT INTO public.tenant_metrics VALUES (113, 4, '2026-08-24', 17, 31, 37200.00, 778, 1.71, 95, '2026-09-16 10:34:14.305');
INSERT INTO public.tenant_metrics VALUES (114, 4, '2026-08-23', 13, 31, 37200.00, 654, 0.40, 94, '2026-09-16 10:34:14.312');
INSERT INTO public.tenant_metrics VALUES (115, 4, '2026-08-22', 12, 20, 24000.00, 711, 0.65, 88, '2026-09-16 10:34:14.317');
INSERT INTO public.tenant_metrics VALUES (116, 4, '2026-08-21', 17, 30, 36000.00, 518, 1.16, 84, '2026-09-16 10:34:14.322');
INSERT INTO public.tenant_metrics VALUES (117, 4, '2026-08-20', 17, 31, 37200.00, 538, 0.91, 95, '2026-09-16 10:34:14.327');
INSERT INTO public.tenant_metrics VALUES (118, 4, '2026-08-19', 10, 34, 40800.00, 515, 0.60, 109, '2026-09-16 10:34:14.332');
INSERT INTO public.tenant_metrics VALUES (119, 4, '2026-08-18', 11, 27, 32400.00, 575, 1.21, 95, '2026-09-16 10:34:14.336');
INSERT INTO public.tenant_metrics VALUES (120, 4, '2026-08-17', 16, 30, 36000.00, 539, 0.48, 104, '2026-09-16 10:34:14.341');
INSERT INTO public.tenant_metrics VALUES (121, 5, '2026-09-15', 16, 32, 38400.00, 732, 1.83, 112, '2026-09-16 10:34:14.352');
INSERT INTO public.tenant_metrics VALUES (122, 5, '2026-09-14', 17, 32, 38400.00, 519, 1.80, 108, '2026-09-16 10:34:14.357');
INSERT INTO public.tenant_metrics VALUES (123, 5, '2026-09-13', 16, 28, 33600.00, 793, 1.32, 110, '2026-09-16 10:34:14.362');
INSERT INTO public.tenant_metrics VALUES (124, 5, '2026-09-12', 13, 22, 26400.00, 757, 0.05, 89, '2026-09-16 10:34:14.367');
INSERT INTO public.tenant_metrics VALUES (125, 5, '2026-09-11', 13, 27, 32400.00, 526, 0.93, 85, '2026-09-16 10:34:14.373');
INSERT INTO public.tenant_metrics VALUES (126, 5, '2026-09-10', 14, 32, 38400.00, 776, 1.62, 82, '2026-09-16 10:34:14.379');
INSERT INTO public.tenant_metrics VALUES (127, 5, '2026-09-09', 16, 28, 33600.00, 731, 0.35, 108, '2026-09-16 10:34:14.383');
INSERT INTO public.tenant_metrics VALUES (128, 5, '2026-09-08', 11, 22, 26400.00, 529, 1.91, 104, '2026-09-16 10:34:14.388');
INSERT INTO public.tenant_metrics VALUES (129, 5, '2026-09-07', 16, 25, 30000.00, 678, 1.31, 109, '2026-09-16 10:34:14.393');
INSERT INTO public.tenant_metrics VALUES (130, 5, '2026-09-06', 17, 23, 27600.00, 767, 1.43, 116, '2026-09-16 10:34:14.397');
INSERT INTO public.tenant_metrics VALUES (131, 5, '2026-09-05', 15, 29, 34800.00, 540, 0.03, 111, '2026-09-16 10:34:14.402');
INSERT INTO public.tenant_metrics VALUES (132, 5, '2026-09-04', 16, 31, 37200.00, 651, 1.34, 99, '2026-09-16 10:34:14.407');
INSERT INTO public.tenant_metrics VALUES (133, 5, '2026-09-03', 17, 31, 37200.00, 734, 0.96, 117, '2026-09-16 10:34:14.411');
INSERT INTO public.tenant_metrics VALUES (134, 5, '2026-09-02', 17, 34, 40800.00, 643, 1.09, 111, '2026-09-16 10:34:14.416');
INSERT INTO public.tenant_metrics VALUES (135, 5, '2026-09-01', 16, 28, 33600.00, 790, 0.09, 80, '2026-09-16 10:34:14.422');
INSERT INTO public.tenant_metrics VALUES (136, 5, '2026-08-31', 12, 23, 27600.00, 615, 0.29, 95, '2026-09-16 10:34:14.428');
INSERT INTO public.tenant_metrics VALUES (137, 5, '2026-08-30', 10, 28, 33600.00, 561, 1.88, 100, '2026-09-16 10:34:14.433');
INSERT INTO public.tenant_metrics VALUES (138, 5, '2026-08-29', 11, 25, 30000.00, 731, 0.98, 108, '2026-09-16 10:34:14.438');
INSERT INTO public.tenant_metrics VALUES (139, 5, '2026-08-28', 10, 28, 33600.00, 551, 0.73, 110, '2026-09-16 10:34:14.445');
INSERT INTO public.tenant_metrics VALUES (140, 5, '2026-08-27', 11, 25, 30000.00, 731, 1.29, 91, '2026-09-16 10:34:14.45');
INSERT INTO public.tenant_metrics VALUES (141, 5, '2026-08-26', 17, 31, 37200.00, 732, 0.61, 101, '2026-09-16 10:34:14.455');
INSERT INTO public.tenant_metrics VALUES (142, 5, '2026-08-25', 11, 29, 34800.00, 706, 1.36, 102, '2026-09-16 10:34:14.459');
INSERT INTO public.tenant_metrics VALUES (143, 5, '2026-08-24', 16, 20, 24000.00, 783, 0.39, 113, '2026-09-16 10:34:14.464');
INSERT INTO public.tenant_metrics VALUES (144, 5, '2026-08-23', 10, 32, 38400.00, 636, 0.32, 87, '2026-09-16 10:34:14.468');
INSERT INTO public.tenant_metrics VALUES (145, 5, '2026-08-22', 14, 33, 39600.00, 750, 1.22, 87, '2026-09-16 10:34:14.473');
INSERT INTO public.tenant_metrics VALUES (146, 5, '2026-08-21', 12, 31, 37200.00, 765, 0.28, 101, '2026-09-16 10:34:14.478');
INSERT INTO public.tenant_metrics VALUES (147, 5, '2026-08-20', 16, 27, 32400.00, 608, 0.73, 117, '2026-09-16 10:34:14.482');
INSERT INTO public.tenant_metrics VALUES (148, 5, '2026-08-19', 16, 34, 40800.00, 746, 1.45, 95, '2026-09-16 10:34:14.488');
INSERT INTO public.tenant_metrics VALUES (149, 5, '2026-08-18', 12, 25, 30000.00, 561, 1.21, 98, '2026-09-16 10:34:14.494');
INSERT INTO public.tenant_metrics VALUES (150, 5, '2026-08-17', 15, 27, 32400.00, 601, 0.48, 92, '2026-09-16 10:34:14.499');
INSERT INTO public.tenant_metrics VALUES (151, 6, '2026-09-15', 13, 23, 27600.00, 581, 0.36, 115, '2026-09-16 10:34:14.513');
INSERT INTO public.tenant_metrics VALUES (152, 6, '2026-09-14', 12, 29, 34800.00, 733, 0.84, 108, '2026-09-16 10:34:14.517');
INSERT INTO public.tenant_metrics VALUES (153, 6, '2026-09-13', 16, 21, 25200.00, 528, 0.03, 116, '2026-09-16 10:34:14.522');
INSERT INTO public.tenant_metrics VALUES (154, 6, '2026-09-12', 12, 30, 36000.00, 628, 0.07, 90, '2026-09-16 10:34:14.527');
INSERT INTO public.tenant_metrics VALUES (155, 6, '2026-09-11', 17, 32, 38400.00, 687, 0.07, 113, '2026-09-16 10:34:14.531');
INSERT INTO public.tenant_metrics VALUES (156, 6, '2026-09-10', 10, 24, 28800.00, 769, 1.73, 91, '2026-09-16 10:34:14.536');
INSERT INTO public.tenant_metrics VALUES (157, 6, '2026-09-09', 15, 26, 31200.00, 620, 0.18, 82, '2026-09-16 10:34:14.542');
INSERT INTO public.tenant_metrics VALUES (158, 6, '2026-09-08', 17, 34, 40800.00, 572, 0.56, 90, '2026-09-16 10:34:14.546');
INSERT INTO public.tenant_metrics VALUES (159, 6, '2026-09-07', 16, 24, 28800.00, 743, 1.24, 96, '2026-09-16 10:34:14.551');
INSERT INTO public.tenant_metrics VALUES (160, 6, '2026-09-06', 15, 34, 40800.00, 562, 1.35, 100, '2026-09-16 10:34:14.555');
INSERT INTO public.tenant_metrics VALUES (161, 6, '2026-09-05', 16, 22, 26400.00, 775, 0.65, 96, '2026-09-16 10:34:14.56');
INSERT INTO public.tenant_metrics VALUES (162, 6, '2026-09-04', 16, 20, 24000.00, 686, 1.39, 95, '2026-09-16 10:34:14.565');
INSERT INTO public.tenant_metrics VALUES (163, 6, '2026-09-03', 14, 24, 28800.00, 552, 0.78, 109, '2026-09-16 10:34:14.569');
INSERT INTO public.tenant_metrics VALUES (164, 6, '2026-09-02', 15, 27, 32400.00, 702, 0.14, 102, '2026-09-16 10:34:14.574');
INSERT INTO public.tenant_metrics VALUES (165, 6, '2026-09-01', 17, 32, 38400.00, 626, 1.98, 108, '2026-09-16 10:34:14.579');
INSERT INTO public.tenant_metrics VALUES (166, 6, '2026-08-31', 17, 33, 39600.00, 615, 1.02, 94, '2026-09-16 10:34:14.585');
INSERT INTO public.tenant_metrics VALUES (167, 6, '2026-08-30', 10, 31, 37200.00, 778, 0.14, 101, '2026-09-16 10:34:14.59');
INSERT INTO public.tenant_metrics VALUES (168, 6, '2026-08-29', 17, 26, 31200.00, 603, 0.80, 107, '2026-09-16 10:34:14.595');
INSERT INTO public.tenant_metrics VALUES (169, 6, '2026-08-28', 14, 34, 40800.00, 784, 1.04, 115, '2026-09-16 10:34:14.6');
INSERT INTO public.tenant_metrics VALUES (170, 6, '2026-08-27', 12, 27, 32400.00, 531, 0.09, 97, '2026-09-16 10:34:14.606');
INSERT INTO public.tenant_metrics VALUES (171, 6, '2026-08-26', 10, 34, 40800.00, 744, 1.72, 102, '2026-09-16 10:34:14.611');
INSERT INTO public.tenant_metrics VALUES (172, 6, '2026-08-25', 16, 23, 27600.00, 625, 0.24, 119, '2026-09-16 10:34:14.615');
INSERT INTO public.tenant_metrics VALUES (173, 6, '2026-08-24', 15, 32, 38400.00, 775, 1.53, 89, '2026-09-16 10:34:14.62');
INSERT INTO public.tenant_metrics VALUES (174, 6, '2026-08-23', 13, 23, 27600.00, 729, 0.79, 89, '2026-09-16 10:34:14.626');
INSERT INTO public.tenant_metrics VALUES (175, 6, '2026-08-22', 11, 27, 32400.00, 750, 0.20, 113, '2026-09-16 10:34:14.63');
INSERT INTO public.tenant_metrics VALUES (176, 6, '2026-08-21', 13, 20, 24000.00, 564, 0.05, 91, '2026-09-16 10:34:14.635');
INSERT INTO public.tenant_metrics VALUES (177, 6, '2026-08-20', 14, 26, 31200.00, 775, 1.76, 94, '2026-09-16 10:34:14.642');
INSERT INTO public.tenant_metrics VALUES (178, 6, '2026-08-19', 14, 29, 34800.00, 525, 0.59, 103, '2026-09-16 10:34:14.648');
INSERT INTO public.tenant_metrics VALUES (179, 6, '2026-08-18', 17, 33, 39600.00, 616, 0.55, 97, '2026-09-16 10:34:14.653');
INSERT INTO public.tenant_metrics VALUES (180, 6, '2026-08-17', 10, 22, 26400.00, 546, 0.39, 103, '2026-09-16 10:34:14.66');


--
-- Name: permission_definitions_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: postgres
--

SELECT pg_catalog.setval('auth.permission_definitions_id_seq', 15, true);


--
-- Name: role_definitions_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: postgres
--

SELECT pg_catalog.setval('auth.role_definitions_id_seq', 7, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: postgres
--

SELECT pg_catalog.setval('auth.role_permissions_id_seq', 46, true);


--
-- Name: tenant_admins_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: postgres
--

SELECT pg_catalog.setval('auth.tenant_admins_id_seq', 1, false);


--
-- Name: tenants_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: postgres
--

SELECT pg_catalog.setval('auth.tenants_id_seq', 6, true);


--
-- Name: feature_toggles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.feature_toggles_id_seq', 26, true);


--
-- Name: supercontroller_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supercontroller_audit_logs_id_seq', 2, true);


--
-- Name: supercontroller_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supercontroller_id_seq', 1, true);


--
-- Name: tenant_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenant_metrics_id_seq', 180, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 48Uxh07xaR6snr1tw061ICjsc1XJjCfaWTexbX6kd43xEJN7FTEAxkn4rsjM9fd

