# Blip · Your tasks, your pixel companion

Turn everyday tasks into progress for a growing pixel pet. Complete tasks to earn XP and drumsticks, then feed Blip to unlock glowing effects, a scepter, a crown, and a throne.

**[Play Blip on GitHub Pages](https://ian-robotics.github.io/Blip/)**

This is a seven-day playtest prototype; progress is saved in your current browser, not an online account.

## Start playing

1. Choose **Continue as guest**, or use the mock login. It does not create an account; do not enter a real password.
2. Choose your Blip’s color and name.
3. On **Today**, complete a starter task or tap **+** to add your own. Choose text or voice, enter a description, and select **Review**.
4. Check the suggested tasks, remove unwanted ones, and adjust urgency if needed. Nothing is added until you confirm.
5. Complete tasks to earn XP and **one drumstick per task’s first completion**. Open **Blip** and tap **Feed 🍗** to increase daily fullness.

Try a description such as: “Buy milk and eggs at Ralphs, review my lecture notes, and prepare my presentation.” Voice input requires a supported browser and microphone permission; text input is always available.

## XP, urgency, and feeding

Groq estimates task difficulty. Rewards are **easy: 10 XP**, **medium: 20 XP**, and **hard: 30 XP**. Urgency is displayed separately; changing it does not change XP. If AI is unavailable or finds no tasks, labeled local suggestions let you continue, using a default 10 XP reward.

XP drives levels and evolution. Feeding is a separate daily activity: each drumstick adds **1 fullness**, with a daily goal of **5** and no upper limit.

| Daily fullness | Blip’s accessories and effects |
| --- | --- |
| 1–2 | Blue glow |
| 3–4 | Scepter and spinning energy ring |
| 5–7 | Scepter, crown, purple glow and particles |
| 8–11 | Golden effects and a throne |
| 12+ | Royal banners and radiating light |

Effects appear on both Today and Blip. Reduced-motion settings keep the decorations while disabling their animations.

You can undo a completed task by clicking its checkmark again. Its XP is returned, and a popup explains any level decrease. Earned badges stay unlocked. Undoing or deleting tasks does not reclaim food or fullness; completing the same task again does not award another drumstick.

## Explore the seven-day demo

- **Skip to tomorrow** settles the current day. Unfinished tasks carry forward, fullness resets, and unused drumsticks stay in your inventory.
- **Day 2 adds 12 built-in tasks**, so you can complete them and feed Blip to preview every accessory without making AI requests.
- In **Blip → This week**, select a past day to review its saved tasks and progress. Historical views are read-only; use **Back to today** to resume playing.
- You can skip six times, ending on Day 7. Tasks and feeding remain available on the final day.
- **Reset demo** clears your tasks, XP, food, fullness, and history. Use it to start over or see the new Day 2 tasks if your save has already passed that day.

Skipping a day with no completed tasks deducts **10 XP** on the first consecutive missed day, **20** on the second, **30** on the third, and so on. Empty task lists also count. Completing a task breaks that sequence. XP never falls below zero, and a settlement popup explains the deduction. Historical snapshots preserve progress immediately before settlement.

Dates are simulated: the app does not automatically advance at midnight or schedule tasks for future days. Saves belong to the browser and site address you use; changing browsers or clearing site data can remove access to your progress.

## Run on your computer

You need **Python 3.10+**. Node.js is optional for playing.

```sh
git clone https://github.com/ian-robotics/Blip.git
cd Blip
python3 scripts/serve.py
```

Open **http://localhost:8000**. Keep the terminal running; press **Ctrl+C** to stop. No package installation is needed. Opening `index.html` directly will not work correctly because the app uses JavaScript modules.

If you have Node.js and npm installed, `npm start` runs the same server.

### Troubleshooting

- **Hosted app is slow to start:** wait briefly and retry. Use the built-in tasks to explore without AI.
- **Microphone unavailable:** choose Text input and check browser permissions.
- **AI suggestions are inaccurate:** revise the description and review again, or remove unwanted drafts before confirming.
- **Changes are not visible locally:** restart an older server if necessary, then hard-refresh with **Cmd+Shift+R** on macOS or **Ctrl+Shift+R** on Windows/Linux.

## Developer playtest shortcut

Enter exactly **`dev`** in text input and select Review to create a debug draft without calling AI. After adding it, click its **XP ✎** button to set a whole-number reward from **0 to 100000**. Undo completion before editing the reward. This shortcut is available to all playtesters.

For source checks, use Node.js 20+ and run `npm run check`. The local test suite is maintained separately and is not included in this repository; `npm test` requires those test files.

Built with HTML, CSS, vanilla JavaScript, and a Python HTTP server.
