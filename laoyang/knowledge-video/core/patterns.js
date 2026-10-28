// ================= v4 讲解模式库（core/patterns.js，2026-10-28）=================
// 来源：explainer-studio（MIT）的「讲解模式」方法 + 构图与节奏规则，按竖屏金色风格重写。说明见 STANDARD「v4 讲解模式」。
// 规则：每张卡一个主角（≥ 内容区高度 1/3，或 ≥200px 大字）；尺寸三档：主角 / 配角 56–72px / 标签 34–40px；
//      金色只给主角和「当前重点」，一帧只有一处发光；动作只用：上浮淡入、计数、描线、点亮、脉冲；落位后停 ≥1 秒。
// 坐标写设计坐标（y640–1380），外壳整体上移 130。
const ICON={"building":["M3 21l18 0","M9 8l1 0","M9 12l1 0","M9 16l1 0","M14 8l1 0","M14 12l1 0","M14 16l1 0","M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16"],"building-factory":["M4 21c1.147 -4.02 1.983 -8.027 2 -12h6c.017 3.973 .853 7.98 2 12","M12.5 13h4.5c.025 2.612 .894 5.296 2 8","M9 5a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1","M3 21l19 0"],"building-bank":["M3 21l18 0","M3 10l18 0","M5 6l7 -3l7 3","M4 10l0 11","M20 10l0 11","M8 14l0 3","M12 14l0 3","M16 14l0 3"],"building-store":["M3 21l18 0","M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4","M5 21l0 -10.15","M19 21l0 -10.15","M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4"],"coin":["M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0","M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1","M12 7v10"],"coins":["M9 14c0 1.657 2.686 3 6 3s6 -1.343 6 -3s-2.686 -3 -6 -3s-6 1.343 -6 3","M9 14v4c0 1.656 2.686 3 6 3s6 -1.344 6 -3v-4","M3 6c0 1.072 1.144 2.062 3 2.598s4.144 .536 6 0c1.856 -.536 3 -1.526 3 -2.598c0 -1.072 -1.144 -2.062 -3 -2.598s-4.144 -.536 -6 0c-1.856 .536 -3 1.526 -3 2.598","M3 6v10c0 .888 .772 1.45 2 2","M3 11c0 .888 .772 1.45 2 2"],"cash":["M7 15h-3a1 1 0 0 1 -1 -1v-8a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v3","M7 10a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1l0 -8","M12 14a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"],"currency-yuan":["M12 19v-7l-5 -7","M17 5l-5 7","M8 13h8"],"report-money":["M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2","M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2","M14 11h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5","M12 17v1m0 -8v1"],"receipt":["M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2m4 -14h6m-6 4h6m-2 4h2"],"wallet":["M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12","M20 12v4h-4a2 2 0 0 1 0 -4h4"],"user":["M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0","M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"],"users":["M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0","M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2","M16 3.13a4 4 0 0 1 0 7.75","M21 21v-2a4 4 0 0 0 -3 -3.85"],"user-check":["M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0","M6 21v-2a4 4 0 0 1 4 -4h4","M15 19l2 2l4 -4"],"user-x":["M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0","M6 21v-2a4 4 0 0 1 4 -4h3.5","M22 22l-5 -5","M17 22l5 -5"],"heart-handshake":["M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572","M12 6l-3.293 3.293a1 1 0 0 0 0 1.414l.543 .543c.69 .69 1.81 .69 2.5 0l1 -1a3.182 3.182 0 0 1 4.5 0l2.25 2.25","M12.5 15.5l2 2","M15 13l2 2"],"chart-bar":["M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -6","M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -10","M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -14","M4 20h14"],"chart-line":["M4 19l16 0","M4 15l4 -6l4 2l4 -5l4 4"],"chart-pie":["M10 3.2a9 9 0 1 0 10.8 10.8a1 1 0 0 0 -1 -1h-6.8a2 2 0 0 1 -2 -2v-7a.9 .9 0 0 0 -1 -.8","M15 3.5a9 9 0 0 1 5.5 5.5h-4.5a1 1 0 0 1 -1 -1v-4.5"],"trending-up":["M3 17l6 -6l4 4l8 -8","M14 7l7 0l0 7"],"trending-down":["M3 7l6 6l4 -4l8 8","M21 10l0 7l-7 0"],"alert-triangle":["M12 9v4","M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0","M12 16h.01"],"search":["M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0","M21 21l-6 -6"],"scale":["M7 20l10 0","M6 6l6 -1l6 1","M12 3l0 17","M9 12l-3 -6l-3 6a3 3 0 0 0 6 0","M21 12l-3 -6l-3 6a3 3 0 0 0 6 0"],"clock":["M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0","M12 7v5l3 3"],"calendar":["M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12","M16 3v4","M8 3v4","M4 11h16","M11 15h1","M12 15v3"],"file-text":["M14 3v4a1 1 0 0 0 1 1h4","M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2","M9 9l1 0","M9 13l6 0","M9 17l6 0"],"file-certificate":["M14 3v4a1 1 0 0 0 1 1h4","M5 8v-3a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-5","M3 14a3 3 0 1 0 6 0a3 3 0 1 0 -6 0","M4.5 17l-1.5 5l3 -1.5l3 1.5l-1.5 -5"],"briefcase":["M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -9","M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2","M12 12l0 .01","M3 13a20 20 0 0 0 18 0"],"target":["M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0","M7 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0","M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"],"shield-check":["M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -.09 7.06","M15 19l2 2l4 -4"],"lock":["M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6","M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0","M8 11v-4a4 4 0 1 1 8 0v4"],"key":["M16.555 3.843l3.602 3.602a2.877 2.877 0 0 1 0 4.069l-2.643 2.643a2.877 2.877 0 0 1 -4.069 0l-.301 -.301l-6.558 6.558a2 2 0 0 1 -1.239 .578l-.175 .008h-1.172a1 1 0 0 1 -.993 -.883l-.007 -.117v-1.172a2 2 0 0 1 .467 -1.284l.119 -.13l.414 -.414h2v-2h2v-2l2.144 -2.144l-.301 -.301a2.877 2.877 0 0 1 0 -4.069l2.643 -2.643a2.877 2.877 0 0 1 4.069 0","M15 9h.01"],"arrows-split":["M21 17h-8l-3.5 -5h-6.5","M21 7h-8l-3.495 5","M18 10l3 -3l-3 -3","M18 20l3 -3l-3 -3"],"filter":["M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227"],"check":["M5 12l5 5l10 -10"],"x":["M18 6l-12 12","M6 6l12 12"],"question-mark":["M8 8a3.5 3 0 0 1 3.5 -3h1a3.5 3 0 0 1 3.5 3a3 3 0 0 1 -2 3a3 4 0 0 0 -2 4","M12 19l0 .01"],"bulb":["M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7","M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3","M9.7 17l4.6 0"],"home":["M5 12l-2 0l9 -9l9 9l-2 0","M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7","M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"],"truck":["M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0","M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0","M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5"],"package":["M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5","M12 12l8 -4.5","M12 12l0 9","M12 12l-8 -4.5","M16 5.25l-8 4.5"],"crown":["M12 6l4 6l5 -4l-2 10h-14l-2 -10l5 4l4 -6"],"flag":["M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9","M5 21v-7"],"eye":["M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0","M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"],"hourglass":["M6.5 7h11","M6.5 17h11","M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1","M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1"],"rocket":["M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3","M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3","M14 9a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"],"puzzle":["M4 7h3a1 1 0 0 0 1 -1v-1a2 2 0 0 1 4 0v1a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h1a2 2 0 0 1 0 4h-1a1 1 0 0 0 -1 1v3a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-1a2 2 0 0 0 -4 0v1a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h1a2 2 0 0 0 0 -4h-1a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1"],"tool":["M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5"],"settings":["M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065","M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"],"door-exit":["M13 12v.01","M3 21h18","M5 21v-16a2 2 0 0 1 2 -2h7.5m2.5 10.5v7.5","M14 7h7m-3 -3l3 3l-3 3"],"link":["M9 15l6 -6","M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464","M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"],"map-pin":["M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0","M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0"],"stack-2":["M12 4l-8 4l8 4l8 -4l-8 -4","M4 12l8 4l8 -4","M4 16l8 4l8 -4"],"box":["M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5","M12 12l8 -4.5","M12 12l0 9","M12 12l-8 -4.5"],"ladder":["M8 3v18","M16 3v18","M8 14h8","M8 10h8","M8 6h8","M8 18h8"],"route":["M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0","M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4","M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5"],"flame":["M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.294 -2.333 5.588c0 3.704 3.134 6.706 7 6.706c3.866 0 7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235"],"umbrella":["M4 12a8 8 0 0 1 16 0l-16 0","M12 12v6a2 2 0 0 0 4 0"],"brain":["M15.5 13a3.5 3.5 0 0 0 -3.5 3.5v1a3.5 3.5 0 0 0 7 0v-1.8","M8.5 13a3.5 3.5 0 0 1 3.5 3.5v1a3.5 3.5 0 0 1 -7 0v-1.8","M17.5 16a3.5 3.5 0 0 0 0 -7h-.5","M19 9.3v-2.8a3.5 3.5 0 0 0 -7 0","M6.5 16a3.5 3.5 0 0 1 0 -7h.5","M5 9.3v-2.8a3.5 3.5 0 0 1 7 0v10"],"message":["M8 9h8","M8 13h6","M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12"],"phone":["M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"],"list-check":["M3.5 5.5l1.5 1.5l2.5 -2.5","M3.5 11.5l1.5 1.5l2.5 -2.5","M3.5 17.5l1.5 1.5l2.5 -2.5","M11 6l9 0","M11 12l9 0","M11 18l9 0"],"checklist":["M9.615 20h-2.615a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8","M14 19l2 2l4 -4","M9 8h4","M9 12h2"],"clipboard-check":["M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2","M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2","M9 14l2 2l4 -4"],"presentation":["M3 4l18 0","M4 4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-10","M12 16l0 4","M9 20l6 0","M8 12l3 -3l2 2l3 -3"],"briefcase-2":["M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9","M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2"],"growth":["M16.5 15a4.5 4.5 0 0 0 -4.5 4.5m4.5 -8.5a4.5 4.5 0 0 0 -4.5 4.5m4.5 -8.5a4.5 4.5 0 0 0 -4.5 4.5m-4 3.5c2.21 0 4 2.015 4 4.5m-4 -8.5c2.21 0 4 2.015 4 4.5m-4 -8.5c2.21 0 4 2.015 4 4.5m0 -7.5v6"],"pig-money":["M15 11v.01","M5.173 8.378a3 3 0 1 1 4.656 -1.377","M16 4v3.803a6.019 6.019 0 0 1 2.658 3.197h1.341a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-1.342c-.336 .95 -.907 1.8 -1.658 2.473v2.027a1.5 1.5 0 0 1 -3 0v-.583a6.04 6.04 0 0 1 -1 .083h-4a6.04 6.04 0 0 1 -1 -.083v.583a1.5 1.5 0 0 1 -3 0v-2l0 -.027a6 6 0 0 1 4 -10.473h2.5l4.5 -3"],"gavel":["M13 10l7.383 7.418c.823 .82 .823 2.148 0 2.967a2.11 2.11 0 0 1 -2.976 0l-7.407 -7.385","M6 9l4 4","M13 10l-4 -4","M3 21h7","M6.793 15.793l-3.586 -3.586a1 1 0 0 1 0 -1.414l2.293 -2.293l.5 .5l3 -3l-.5 -.5l2.293 -2.293a1 1 0 0 1 1.414 0l3.586 3.586a1 1 0 0 1 0 1.414l-2.293 2.293l-.5 -.5l-3 3l.5 .5l-2.293 2.293a1 1 0 0 1 -1.414 0"]};   // Tabler Icons 子集（MIT，core/LICENSES/tabler-icons-MIT.txt）
const GOLDC='#FFD45C',WH='#EDE6D8',GRY='#8C857A',RED='#E8553A';
const NS='http://www.w3.org/2000/svg';
function layer(el){const s=document.createElementNS(NS,'svg');s.setAttribute('width','1080');s.setAttribute('height','1920');s.setAttribute('viewBox','0 0 1080 1920');s.style.cssText='position:absolute;left:0;top:0;overflow:visible';
 s.innerHTML='<defs><linearGradient id="gg'+(layer.n=(layer.n||0)+1)+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE27A"/><stop offset="1" stop-color="#E9A21C"/></linearGradient></defs>';s.gid='url(#gg'+layer.n+')';el.appendChild(s);return s;}
function sv(par,tag,at,html){const e=document.createElementNS(NS,tag);for(const k in at)e.setAttribute(k,at[k]);if(html)e.innerHTML=html;par.appendChild(e);return e;}
function icon(par,name,cx,cy,size,col,sw){const p=ICON[name]||ICON['question-mark'];return sv(par,'g',{transform:`translate(${cx-size/2},${cy-size/2}) scale(${size/24})`,fill:'none',stroke:col,'stroke-width':sw||1.5,'stroke-linecap':'round','stroke-linejoin':'round'},p.map(d=>`<path d="${d}"/>`).join(''));}
function line(par,d,col,w,dash){return sv(par,'path',{d,stroke:col,'stroke-width':w,fill:'none','stroke-linecap':'round',pathLength:1,'stroke-dasharray':dash?'0.02 0.03':'1','stroke-dashoffset':dash?0:1});}
const drawP=(e,p)=>e.setAttribute('stroke-dashoffset',(1-p).toFixed(4));
const glow=(k)=>`drop-shadow(0 6px 16px rgba(0,0,0,.7)) drop-shadow(0 0 ${(18+14*k).toFixed(1)}px rgba(255,190,60,${(0.30+0.25*k).toFixed(2)}))`;
const breath=t=>0.5+0.5*Math.sin(t*2*Math.PI);                        // 主角光 1 秒一呼吸
const pulse=(t,t0)=>{const u=t-t0;return u<0||u>0.5?1:1+0.08*Math.sin(Math.PI*u/0.5);};   // 落点脉冲 1→1.08→1
const sIn=(t,t0,d)=>eo(cl((t-t0)/(d||0.35)));
function raw(c,e,upd){c.parts.push({e,at:0,raw:true,upd});return e;}
const PAT={};

// 1. big 大数字揭示：主角大数字（计数）+ 金色下划线 + 对照物 + 说明
PAT.big=(c,{P,AT,el,t0,first})=>{
 const n=P(mk('big','top:650px;font-size:230px',`<span>${fmtN(c.num,c.dec)}</span>${c.unit?`<small>${esc(c.unit)}</small>`:''}`),t0,{num:c.num,dec:c.dec,first});
 const tl=first?t0:t0+1.0;const L=layer(el);const ul=line(L,'M122 912 H760',GOLDC,5);
 raw(c,ul,t=>drawP(ul,sIn(t,tl,0.5)));
 c.upd=t=>{n.style.filter=glow(breath(t));n.style.scale=pulse(t,tl).toFixed(3);};
 if(c.cap)P(mk('cap','top:940px;font-size:46px',gem(c.cap)),AT(c.capAt,t0+0.3));
 if(c.vs)P(mk('cap',`top:1030px;font-size:40px;color:#C9C2B6`,`${gem(c.vs.label)}　<span style="font-size:64px;color:#fff">${esc(c.vs.num)}</span>${c.vs.unit?esc(c.vs.unit):''}`),AT(c.vs.at,t0+0.8));
 if(c.note)P(mk('cap',`top:${c.vs?1140:1040}px;font-size:36px;color:#C9C2B6`,gem(c.note)),AT(c.noteAt,t0+1.1));};

// 2. grid 占比格 / 漏斗：N 个点先全亮，落拍时只剩 k 个金点；右侧大数字从 N 数到 k
PAT.grid=(c,{P,AT,el,t0,first})=>{
 const N=c.total||100,K=c.hit||1,cols=c.cols||10,rows=Math.ceil(N/cols),sp=52,x0=150,y0=680,ta=AT(c.hitAt,t0+1.2);
 const pick=new Set();let s=7;while(pick.size<K){pick.add(Math.floor(rnd(s*3.7+N)*N));s++;}
 const L=layer(el);const ds=[];
 for(let i=0;i<N;i++){const cx=x0+(i%cols)*sp,cy=y0+Math.floor(i/cols)*sp;ds.push(sv(L,'circle',{cx,cy,r:13,fill:WH}));}
 const big=P(mk('big',`left:${x0+cols*sp+14}px;top:700px;font-size:${Math.min(190,Math.floor(250/(String(N).length*0.6)))}px`,`<span>${N}</span>`),t0,{raw:true});
 const sub=P(mk('cap',`left:${x0+cols*sp+18}px;top:900px;font-size:44px;color:#C9C2B6`,`/ ${N}`),t0+0.3);
 raw(c,big,t=>{const q=first?1:sIn(t,t0,0.4);big.style.opacity=q.toFixed(3);const k=eo(cl((t-ta)/0.9));big.querySelector('span').textContent=String(Math.round(N-(N-K)*k));
  big.style.filter=t>=ta?glow(breath(t)):'drop-shadow(0 6px 16px rgba(0,0,0,.6))';big.style.scale=pulse(t,ta+0.9).toFixed(3);big.classList.toggle('dimn',t<ta);});
 raw(c,L,t=>{const k=eo(cl((t-ta)/0.6));ds.forEach((d,i)=>{const a=first?1:sIn(t,t0+i*0.006,0.3);const hit=pick.has(i);
   d.setAttribute('opacity',(a*(hit?1:1-0.7*k)).toFixed(3));d.setAttribute('fill',hit&&k>0?c.goldUrl||L.gid:WH);d.setAttribute('r',(13+(hit?10*k:0)).toFixed(1));
   d.style.filter=hit&&k>0?`drop-shadow(0 0 ${(10+8*breath(t)).toFixed(1)}px rgba(255,190,60,.8))`:'';});});
 if(c.cap)P(mk('cap',`top:${y0+rows*sp+10}px;font-size:44px`,gem(c.cap)),AT(c.capAt,ta+0.6));
 if(c.note)P(mk('cap',`top:${y0+rows*sp+80}px;font-size:34px;color:#C9C2B6`,gem(c.note)),AT(c.noteAt,ta+1.2));};

// 3. vs 数字对比：两根竖柱从基线长出，赢的一方金色发光；最后给结论标签
PAT.vs=(c,{P,AT,el,t0,first})=>{
 const it=c.items,mx=Math.max(...it.map(x=>x.num)),base=1300,H=440,L=layer(el);
 sv(L,'path',{d:`M140 ${base} H940`,stroke:GRY,'stroke-width':3});
 it.forEach((x,i)=>{const cx=i?750:330,a=AT(x.at,t0+0.2+i*0.8),h=H*x.num/mx,win=!!x.win;
  const r=sv(L,'rect',{x:cx-95,width:190,y:base,height:0,rx:6,fill:win?L.gid:'#5A554D',stroke:win?GOLDC:'#8C857A','stroke-width':2});
  const num=P(mk(win?'big':'cap',`left:${cx-200}px;width:400px;text-align:center;top:${base-h-130}px;font-size:${win?110:88}px;${win?'':'color:#fff'}`,`<span>${fmtN(x.num,x.dec)}</span>${x.unit?`<small style="font-size:.4em">${esc(x.unit)}</small>`:''}`),a,{num:x.num,dec:x.dec,first:first&&!x.at});
  P(mk('cap',`left:${cx-200}px;width:400px;text-align:center;top:${base+18}px;font-size:42px;${win?'color:#FFD45C':''}`,gem(x.label)),a);
  raw(c,r,t=>{const k=first&&!x.at?1:eo(cl((t-a)/0.8));r.setAttribute('y',(base-h*k).toFixed(1));r.setAttribute('height',(h*k).toFixed(1));r.style.filter=win&&k>0.99?`drop-shadow(0 0 ${(16+12*breath(t)).toFixed(1)}px rgba(255,190,60,.55))`:'';});});
 if(c.verdict){const va=AT(c.verdictAt,t0+2);const v=P(mk('chip on',`left:120px;top:660px`,esc(c.verdict)),va);raw(c,v,t=>{v.style.scale=pulse(t,va+0.3).toFixed(3);});}};

// 4. before 过去 / 现在：上格灰（过去），描一根向下的箭头，下格金色发光（现在）
PAT.before=(c,{P,AT,el,t0})=>{
 const b=c.before,a=c.after,ta=AT(c.afterAt,t0+1.5),L=layer(el);
 const f1=sv(L,'rect',{x:120,y:650,width:840,height:280,rx:18,fill:'rgba(8,8,8,.45)',stroke:'#5A554D','stroke-width':2});
 icon(L,b.icon||'clock',230,800,120,GRY,1.4);
 P(mk('cap','left:150px;top:670px;font-size:34px;color:#A9A194',esc(c.bl||'过去')),t0);
 const tb=AT(b.at,t0+0.15);P(mk('cap','left:330px;top:740px;font-size:60px;color:#D8D2C6',gem(b.t)),tb);
 if(b.sub)P(mk('cap','left:330px;top:830px;font-size:36px;color:#A9A194',gem(b.sub)),AT(b.subAt,tb+0.15));
 const ar=line(L,'M540 950 V1030',GOLDC,5),ah=line(L,'M515 1008 L540 1033 L565 1008',GOLDC,5);
 raw(c,ar,t=>{drawP(ar,sIn(t,ta-0.4,0.4));drawP(ah,sIn(t,ta-0.05,0.2));});
 const f2=sv(L,'rect',{x:120,y:1050,width:840,height:300,rx:18,fill:'rgba(30,20,6,.55)',stroke:GOLDC,'stroke-width':3,opacity:0});
 const ig=icon(L,a.icon||'trending-up',230,1210,140,GOLDC,1.5);ig.setAttribute('opacity',0);
 raw(c,f2,t=>{const k=sIn(t,ta,0.4);f2.setAttribute('opacity',k.toFixed(3));ig.setAttribute('opacity',k.toFixed(3));f2.style.filter=k>0.99?`drop-shadow(0 0 ${(14+12*breath(t)).toFixed(1)}px rgba(255,190,60,.45))`:'';f1.setAttribute('opacity',(1-0.4*k).toFixed(3));});
 P(mk('cap','left:150px;top:1070px;font-size:34px;color:#FFD45C',esc(c.al||'现在')),ta);
 P(mk('lbl','left:330px;top:1130px;font-size:72px',gem(a.t)),ta+0.1);
 if(a.sub)P(mk('cap','left:330px;top:1240px;font-size:38px',gem(a.sub)),AT(a.subAt,ta+0.35));};

// 5. chain 因果链（竖排）：节点逐个亮起，箭头描出来，光点沿最新一段箭头流动；最后一个节点是结果，金色发光
PAT.chain=(c,{P,AT,el,t0,first})=>{
 const it=c.items,n=it.length,y0=n>4?690:720,y1=n>4?1300:1290,dy=(y1-y0)/(n-1),L=layer(el),cx=210,R=n>4?50:64;
 const ats=it.map((x,i)=>i===0?AT(x.at,t0):AT(x.at,t0+0.6+i*0.9));
 const ars=[];for(let i=1;i<n;i++){const ya=y0+(i-1)*dy+R+8,yb=y0+i*dy-R-10;ars.push({p:line(L,`M${cx} ${ya} V${yb}`,'#D8D2C6',5),h:line(L,`M${cx-18} ${yb-18} L${cx} ${yb} L${cx+18} ${yb-18}`,'#D8D2C6',5),ya,yb,d:sv(L,'circle',{cx,cy:ya,r:8,fill:GOLDC,opacity:0})});}
 const nodes=it.map((x,i)=>{const cy=y0+i*dy,last=i===n-1;const g=sv(L,'g',{opacity:0});
  const ci=sv(g,'circle',{cx,cy,r:R,fill:last?'rgba(40,26,6,.7)':'rgba(8,8,8,.6)',stroke:last?GOLDC:'#BFB8AC','stroke-width':last?4:2.5});icon(g,x.icon||'arrow-right',cx,cy,R*1.1,last?GOLDC:WH,1.6);
  P(mk(last?'lbl':'cap',`left:310px;top:${cy-(last?44:36)*(n>4?0.85:1)}px;font-size:${(last?68:54)*(n>4?0.85:1)}px`,gem(x.t)),ats[i]);
  return {g,ci,last};});
 raw(c,L,t=>{nodes.forEach((nd,i)=>{const k=first&&i===0?1:sIn(t,ats[i],0.35);nd.g.setAttribute('opacity',k.toFixed(3));nd.g.style.filter=nd.last&&k>0.99?`drop-shadow(0 0 ${(14+14*breath(t)).toFixed(1)}px rgba(255,190,60,.6))`:'';});
  ars.forEach((ar,j)=>{const ta=ats[j+1]-0.45,k=sIn(t,ta,0.4);drawP(ar.p,k);drawP(ar.h,sIn(t,ta+0.3,0.15));
   const live=t>ats[j+1]&&(j===ars.length-1||t<ats[j+2]);const u=((t-ats[j+1])*0.9)%1;ar.d.setAttribute('cy',(ar.ya+(ar.yb-ar.ya)*u).toFixed(1));ar.d.setAttribute('opacity',live?(0.9*Math.sin(Math.PI*u)).toFixed(3):0);});});};

// 6. myth 误区 / 真相：先给常见说法（白），红线划掉 + 红叉；再给真相（金色发光）
PAT.myth=(c,{P,AT,el,t0})=>{
 const ts=AT(c.strikeAt,t0+1.2),tf=AT(c.factAt,ts+0.8),L=layer(el);
 P(mk('cap','top:660px;font-size:36px;color:#A9A194',esc(c.ml||'很多人以为')),t0);
 const m=P(mk('cap','top:720px;font-size:62px;color:#fff',gem(c.myth)),t0+0.15);
 const st=line(L,'M118 760 H'+Math.min(940,130+62*c.myth.replace(/\*/g,'').length),RED,7);
 const x=icon(L,'x',900,700,90,RED,2.6);x.setAttribute('opacity',0);
 raw(c,st,t=>{const k=sIn(t,ts,0.35);drawP(st,k);x.setAttribute('opacity',sIn(t,ts+0.25,0.2).toFixed(3));m.style.color=k>0.5?'#9A948A':'#fff';});
 P(mk('cap','top:900px;font-size:36px;color:#FFD45C',esc(c.fl||'其实')),tf);
 const f=P(mk('lbl','top:960px;font-size:84px;line-height:1.3;white-space:normal;width:840px',gem(c.fact)),tf+0.1);
 raw(c,f,t=>{if(t>tf+0.5)f.style.filter=glow(breath(t));});};

// 7. steps 步骤清单：未到的暗着，当前一步金色放大发光，做过的打勾变白
PAT.steps=(c,{P,AT,el,t0})=>{
 const it=c.items,y0=c.title?760:700,dy=Math.min(170,600/Math.max(1,it.length-0.3)),L=layer(el);
 if(c.title)P(mk('cap','top:660px;font-size:40px;color:#C9C2B6',gem(c.title)),t0);
 const ats=it.map((x,i)=>AT(x.at,t0+0.5+i*1.2));
 it.forEach((x,i)=>{const cy=y0+i*dy+40;const ci=sv(L,'circle',{cx:170,cy,r:42,fill:'rgba(8,8,8,.55)',stroke:'#8C857A','stroke-width':2.5});
  const no=sv(L,'text',{x:170,y:cy+15,'text-anchor':'middle','font-size':42,'font-weight':900,fill:WH,'font-family':'NSC'},String(i+1));
  const ck=icon(L,'check',170,cy,50,'#1a1206',3);ck.setAttribute('opacity',0);
  const row=mk('row',`left:240px;top:${cy-36}px;font-size:58px;transform-origin:0 50%`,gem(x.t));el.appendChild(row);
  if(Array.isArray(x.note)){const ws=x.note.map(([w,k])=>[w,AT(k,ats[i]+0.6)]);const e=P(mk('cap',`left:244px;top:${cy+38}px;font-size:32px;color:#C9C2B6`,ws.map(([w])=>`<span>${esc(w)}</span>`).join('　')),ws[0][1]);   // 说明逐词出：[[词, 锚点], …]
   raw(c,e,t=>{[...e.querySelectorAll('span')].forEach((sp,j)=>{const k=sIn(t,ws[j][1],0.25);sp.style.opacity=k.toFixed(3);sp.style.color=t<ws[j][1]+0.8?'#FFD45C':'#C9C2B6';});});}
  else if(x.note)P(mk('cap',`left:244px;top:${cy+38}px;font-size:32px;color:#C9C2B6`,gem(x.note)),AT(x.noteAt,ats[i]+0.6));
  raw(c,row,t=>{const on=t>=ats[i],nx=i+1<it.length?t>=ats[i+1]:false,cur=on&&!nx;const k=sIn(t,ats[i],0.3);
   row.style.opacity=(0.35+0.65*k).toFixed(3);row.style.color=cur?'#FFD45C':on?'#EDE6D8':'#A9A194';row.style.scale=cur?(1+0.06*k).toFixed(3):'1';
   row.style.filter=cur?`drop-shadow(0 0 ${(12+10*breath(t)).toFixed(1)}px rgba(255,190,60,.5))`:'';
   ci.setAttribute('fill',on?L.gid:'rgba(8,8,8,.55)');ci.setAttribute('stroke',on?GOLDC:'#8C857A');no.setAttribute('opacity',nx?0:1);no.setAttribute('fill',on?'#1a1206':WH);ck.setAttribute('opacity',nx?1:0);});});};

// 8. analogy 类比：A ≈ B，两边各一个图形，下方描一道弧线指向它们的共同点
PAT.analogy=(c,{P,AT,el,t0})=>{
 const tb=AT(c.b.at,t0+1.2),ts=AT(c.shareAt,tb+1.2),L=layer(el);
 const side=(x,o,ta,gold)=>{const g=sv(L,'g',{opacity:0});sv(g,'circle',{cx:x,cy:860,r:140,fill:'rgba(8,8,8,.55)',stroke:gold?GOLDC:'#BFB8AC','stroke-width':gold?4:2.5});icon(g,o.icon,x,860,130,gold?GOLDC:WH,1.4);
  P(mk('cap',`left:${x-220}px;width:440px;text-align:center;top:1020px;font-size:54px`,gem(o.t)),ta);raw(c,g,t=>{const k=sIn(t,ta,0.4);g.setAttribute('opacity',k.toFixed(3));g.style.scale='1';});};
 side(300,c.a,t0,false);side(780,c.b,tb,true);
 const eq=sv(L,'g',{opacity:0},'');sv(eq,'path',{d:'M500 845 q20 -14 40 0 t40 0',stroke:GOLDC,'stroke-width':6,fill:'none','stroke-linecap':'round'});sv(eq,'path',{d:'M500 880 q20 -14 40 0 t40 0',stroke:GOLDC,'stroke-width':6,fill:'none','stroke-linecap':'round'});
 const arc=line(L,'M300 1100 Q540 1230 780 1100',GOLDC,4);
 raw(c,eq,t=>{eq.setAttribute('opacity',sIn(t,tb+0.3,0.3).toFixed(3));drawP(arc,sIn(t,ts,0.6));});
 const sh=P(mk('lbl','left:120px;width:840px;text-align:center;top:1210px;font-size:64px',gem(c.share)),ts+0.4);raw(c,sh,t=>{if(t>ts+0.8)sh.style.filter=glow(breath(t));});};

// 9. set 高光时刻（每章 ≤1 个，只给章论点 / 收尾 payoff）：一道金光横扫 → 第一行白字落下 → 金线从中间展开 → 第二行金字带光、脉冲
PAT.set=(c,{P,AT,el,t0})=>{
 const t2=AT(c.at2,t0+0.9),L=layer(el),fs=Math.min(96,Math.floor(760/Math.max(...c.lines.map(x=>x.replace(/\*/g,'').length))));
 const sw=sv(L,'rect',{x:-300,y:700,width:260,height:420,fill:'url(#sw'+layer.n+')',opacity:0});
 sv(L,'defs',{},`<linearGradient id="sw${layer.n}" x1="0" x2="1"><stop offset="0" stop-color="#FFD45C" stop-opacity="0"/><stop offset=".5" stop-color="#FFE9B0" stop-opacity=".55"/><stop offset="1" stop-color="#FFD45C" stop-opacity="0"/></linearGradient>`);
 const gl=line(L,`M540 ${830+fs*0.7} H540`,GOLDC,4);
 raw(c,sw,t=>{const u=cl((t-t0)/0.7);sw.setAttribute('x',(-300+1500*u).toFixed(1));sw.setAttribute('opacity',(u>0&&u<1?Math.sin(Math.PI*u):0).toFixed(3));
  const k=eo(cl((t-t2+0.35)/0.5)),w=360*k;gl.setAttribute('d',`M${540-w} ${830+fs*0.7} H${540+w}`);gl.setAttribute('stroke-dashoffset',0);gl.style.filter=`drop-shadow(0 0 10px rgba(255,190,60,.8))`;});
 P(mk('quote',`left:120px;width:840px;text-align:center;top:${800-fs*0.75}px;font-size:${fs}px`,gem(c.lines[0])),t0+0.35);
 const b=P(mk('quote',`left:120px;width:840px;text-align:center;top:${860+fs*0.3}px;font-size:${fs}px`,`<em>${esc(c.lines[1].replace(/\*/g,''))}</em>`),t2);
 raw(c,b,t=>{b.style.scale=pulse(t,t2+0.35).toFixed(3);const em=b.querySelector('em');if(em){em.style.background='linear-gradient(180deg,#FFF8DC,#FFDB6E 55%,#F7BC45)';em.style.webkitBackgroundClip='text';em.style.backgroundClip='text';em.style.filter=t>t2?glow(breath(t)):'drop-shadow(0 4px 12px rgba(0,0,0,.8))';}});};

// 10. ask 结尾提问：金色问号 + 两行问题（两行、无标点）+ 可选 n 条待填横线（「哪三个客户」）
PAT.ask=(c,{P,AT,el,t0})=>{
 const t2=AT(c.at2,t0+0.8),L=layer(el);const q=icon(L,'question-mark',200,760,170,GOLDC,2.2);q.setAttribute('opacity',0);
 raw(c,q,t=>{q.setAttribute('opacity',sIn(t,t0,0.35).toFixed(3));q.style.filter=`drop-shadow(0 0 ${(14+12*breath(t)).toFixed(1)}px rgba(255,190,60,.7))`;});
 P(mk('cap','left:330px;top:680px;font-size:60px;color:#fff',gem(c.lines[0])),t0+0.2);
 P(mk('lbl','left:330px;top:770px;font-size:72px',gem(c.lines[1])),t2);
 const n=c.slots||0,sa=(c.slotAt||[]).map(k=>AT(k,0));
 for(let i=0;i<n;i++){const y=980+i*120,a=sa[i]||t2+0.5+i*0.5;const ci=sv(L,'circle',{cx:170,cy:y,r:34,fill:'rgba(8,8,8,.55)',stroke:GOLDC,'stroke-width':2.5,opacity:0});
  const no=sv(L,'text',{x:170,y:y+13,'text-anchor':'middle','font-size':36,'font-weight':900,fill:GOLDC,'font-family':'NSC',opacity:0},String(i+1));const ln=line(L,`M240 ${y+22} H860`,'#D8D2C6',3);
  raw(c,ci,t=>{const k=sIn(t,a,0.3);ci.setAttribute('opacity',k.toFixed(3));no.setAttribute('opacity',k.toFixed(3));drawP(ln,sIn(t,a+0.1,0.5));});}};
