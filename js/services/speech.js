/** Browser adapter. No DOM or application state dependencies. */
export function createSpeechService(browser = window) {
  const Recognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
  let active = null;
  let blocked = false;

  function cancel() {
    if (!active) return;
    const recognition = active;
    active = null;
    recognition.onend = recognition.onresult = recognition.onerror = null;
    try { recognition.abort(); } catch { /* Already stopped. */ }
  }

  return {
    get available() { return Boolean(Recognition) && !blocked; },
    start({ onTranscript, onEnd }) {
      cancel();
      let finalText = '';
      let interim = '';
      let failed = false;
      try {
        const recognition = new Recognition();
        active = recognition;
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = event => {
          interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) finalText += result[0].transcript.trim() + ', ';
            else interim += result[0].transcript;
          }
          onTranscript(finalText + interim);
        };
        recognition.onerror = event => {
          if (['not-allowed', 'service-not-allowed', 'audio-capture', 'network'].includes(event.error)) {
            failed = true;
            blocked = true;
          }
        };
        recognition.onend = () => {
          if (active !== recognition) return;
          active = null;
          onEnd({ text: (finalText + interim).trim().replace(/,\s*$/, ''), failed });
        };
        recognition.start();
        return true;
      } catch {
        blocked = true;
        cancel();
        return false;
      }
    },
    stop() { if (active) active.stop(); },
    cancel
  };
}
