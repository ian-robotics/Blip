import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpeechService } from '../js/services/speech.js';

function setup() {
  const instances = [];
  class Recognition {
    constructor() { instances.push(this); }
    start() { this.started = true; }
    stop() { this.stopped = true; }
    abort() { this.aborted = true; }
  }
  return { instances, service: createSpeechService({ SpeechRecognition: Recognition }) };
}

test('speech combines final and interim transcripts and finishes cleanly', () => {
  const { instances, service } = setup();
  const updates = [];
  let ended;
  assert.equal(service.start({ onTranscript: text => updates.push(text), onEnd: result => { ended = result; } }), true);
  const recognition = instances[0];
  const final = [{ transcript: 'buy milk' }];
  final.isFinal = true;
  const interim = [{ transcript: 'email TA' }];
  interim.isFinal = false;
  recognition.onresult({ resultIndex: 0, results: [final, interim] });
  assert.deepEqual(updates, ['buy milk, email TA']);
  service.stop();
  assert.equal(recognition.stopped, true);
  recognition.onend();
  assert.deepEqual(ended, { text: 'buy milk, email TA', failed: false });
});

test('denied microphone disables live retry; cancellation detaches callbacks', () => {
  const { instances, service } = setup();
  let ended;
  service.start({ onTranscript() {}, onEnd: value => { ended = value; } });
  instances[0].onerror({ error: 'not-allowed' });
  instances[0].onend();
  assert.equal(service.available, false);
  assert.deepEqual(ended, { text: '', failed: true });
  const second = setup();
  second.service.start({ onTranscript() {}, onEnd() { assert.fail('cancel must not notify'); } });
  second.service.cancel();
  assert.equal(second.instances[0].onend, null);
  assert.equal(second.instances[0].onresult, null);
  assert.equal(second.instances[0].aborted, true);
});

test('unsupported recognition and startup failures can fall back to demo', () => {
  assert.equal(createSpeechService({}).available, false);
  const service = createSpeechService({ SpeechRecognition: class { start() { throw new Error('unavailable'); } abort() {} } });
  assert.equal(service.start({ onTranscript() {}, onEnd() {} }), false);
  assert.equal(service.available, false);
});
