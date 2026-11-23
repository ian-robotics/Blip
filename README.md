# Blip · Your tasks, your pixel companion

Turn everyday tasks into progress for a growing pixel pet. Complete tasks to earn XP and drumsticks, then feed Blip to unlock glowing effects, a scepter, a crown, and a throne.

**[Play Blip on GitHub Pages](https://ian-robotics.github.io/Blip/)**

This is a fourteen-day playtest prototype. Progress is saved in your current browser; signing in with Google keeps a separate save for your account on that browser, but progress does not sync between devices. See the [privacy policy](https://ian-robotics.github.io/Blip/privacy.html).

## Start playing

1. Choose **Continue with Google** or **Continue as guest**. Google sign-in only shares your name and profile picture with Blip and gives your account its own save. **Log out** switches back to the guest save.
2. Choose your Blip’s color and name.
3. On **Today**, complete a starter task or tap **+** to add your own. Choose text or voice, enter a description, and select **Review**.
4. Check the suggested tasks, remove unwanted ones, and adjust urgency if needed. Nothing is added until you confirm.
5. Complete tasks to earn XP and **one drumstick per task’s first completion**. Your Blip hops and the XP flies into the XP bar. Open **Blip** and tap **Feed 🍗** to increase daily fullness.

Try a description such as: “Buy milk and eggs at Ralphs, review my lecture notes, and prepare my presentation.” Voice input requires a supported browser and microphone permission; text input is always available.

## Blip's message cards and alerts

After you skip to a new day, Blip sends up to three message cards: task ideas from your history, reminders for tasks due today, and short notices. A card stays until you handle it:

- **Swipe right** (or tap **✓**) to keep it. Task ideas are added to today; a reminder jumps to its task.
- **Swipe left** (or tap **✕**) to skip it. Skipped ideas are not suggested again.

Turn on **Alerts** in the controls below the phone to get a system notification when a card arrives while Blip is in a background tab. Clicking the notification brings you back to the card. Alerts only work while the page is open; the browser asks for permission once.

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

## Explore the fourteen-day demo

- **Skip to tomorrow** settles the current day. Tasks whose deadline has passed leave the active list; future tasks remain, fullness resets, and unused drumsticks stay in your inventory.
- After skipping, Blip queues up to three message cards, the first after 7 seconds. A card stays on screen until you swipe it (or use its buttons): **swipe right / ✓** keeps it, **swipe left / ✕** skips it. The next card waits until the current one is handled, and dialogs only hide a card temporarily. An unanswered card returns after a reload. Each simulated day permits at most three notifications and one Groq request, cached across reloads. Groq uses current task titles and recent task history to suggest routines, next steps, or reminders; labeled local suggestions cover slow or unavailable AI. When no incomplete tasks are due today, concrete inspirations inferred from task history take priority. Cards with a concrete task title (Groq task ideas, or repeats of an exact past title) are added to today when kept, and skipped ideas are not suggested again. Keeping a deadline reminder jumps to that task; general planning notices are simply closed. Skipping again cancels the previous day's notifications.
- **Day 2 adds 12 built-in tasks**, so you can complete them and feed Blip to preview every accessory without making AI requests.
- In **Blip → 14-day journey**, select a past day to review its saved tasks and progress. Historical views are read-only; use **Back to today** to resume playing.
- You can skip thirteen times, ending on Day 14. Tasks and feeding remain available on the final day.
- Schedule tasks through Day 14; Days 8–14 add no built-in tasks. Built-in tasks expire at the end of their assigned day; previous tasks remain available in read-only history.
- **Reset demo** clears your tasks, XP, food, fullness, and history. Use it to start over or see the new Day 2 tasks if your save has already passed that day.

Skipping a day with no completed tasks deducts **10 XP** on the first consecutive missed day, **20** on the second, **30** on the third, and so on. Empty task lists also count. Completing a task breaks that sequence. XP never falls below zero, and a settlement popup explains the deduction. Historical snapshots preserve progress immediately before settlement.

Dates are simulated: the app does not automatically advance at midnight or schedule tasks for future days. Saves belong to the browser and site address you use; changing browsers or clearing site data can remove access to your progress.

From Day 3, the first notification repeats an exact historical task title, using both completed and incomplete tasks. Repeated and recent titles take priority; tasks already in the active list are excluded. Groq selects from historical candidates; if it fails to select an exact title, a local card offers that past title instead.
