# Blip Task Pet

Blip is a task tracker with a growing pixel pet. Type or speak your tasks, complete them to earn XP, and help Blip evolve while unlocking badges.

Built with HTML, CSS, and vanilla JavaScript. Progress is saved in your browser.

Try a seven-day demo: skip up to six times, then tap a day in Blip’s “This week” grid to review saved end-of-day progress. Past days are read-only.

## Try Demo
https://ian-robotics.github.io/Blip/


## Run locally

With Python 3 installed, run this command from the project directory:

```sh
python3 scripts/serve.py
```

Alternatively, run `npm start`. The development server disables caching so updated scripts load after a refresh.

Open **http://localhost:8000** in your browser. Use the local server rather than opening `index.html` directly, since the app uses JavaScript modules.

Voice input requires a supported browser and microphone permission. You can always type tasks instead.

### Optional Groq task parsing

Fill `GROQ_API_KEY` in the local `.env` file (use `.env.example` as a template).
Use a new key, not one shared in chat. `.env` is ignored by Git and blocked by
the development server. Set `GROQ_MODEL` to a model enabled in your Groq account
that supports JSON mode. Set `GROQ_KEY_EXPIRES_AT` to the actual expiry date from
the console (YYYY-MM-DD); this is a local check, not provider configuration.

Run `npm start`, then open http://localhost:8000. Restart an older running server
first. Both text and speech transcripts use `/api/parse`. No extra dependencies
are required. The backend rereads environment settings per request. Real process
environment variables override `.env`.

Both typed input and speech transcripts must be parsed by Groq. API errors preserve
input for retry and never create local-parser tasks. Groq suggests a priority
and matching reward (low=10, normal=20, high=30 XP); the server validates this contract.
On the confirmation screen users can tap a priority to change it, and the reward follows.
They can also remove tasks or revise the source and reparse. Added task cards cannot be edited.
Rewards persist with tasks and historical snapshots. Existing saves without a reward
field continue to use the priority reward mapping. This is a local prototype: browser
storage is user-controlled and these UI locks are not account-level anti-cheat controls.

The local server binds to loopback and serves only app assets. It is a development
server; a public deployment needs a hosted backend with authentication/rate limits.
