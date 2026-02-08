// ─── SOUND SYSTEM ───
let audioStarted = false;
let shootSynth, explosionSynth, invaderMoveSynth, playerDieSynth, ufoSynth;

// Boss music synths
let bossLeadSynth, bossChordSynth, bossBassSynth, bossDrumSynth, bossSnareSynth;
let bossLeadSeq = null;
let bossChordSeq = null;
let bossBassSeq = null;
let bossDrumSeq = null;
let bossSnareSeq = null;
let bossPlaying = false;

function initAudio() {
  if (audioStarted) return;
  Tone.start();
  audioStarted = true;

  shootSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.01 }
  }).toDestination();
  shootSynth.volume.value = -12;

  explosionSynth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.05 }
  }).toDestination();
  explosionSynth.volume.value = -14;

  invaderMoveSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.01 }
  }).toDestination();
  invaderMoveSynth.volume.value = -18;

  playerDieSynth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.2 }
  }).toDestination();
  playerDieSynth.volume.value = -10;

  ufoSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 }
  }).toDestination();
  ufoSynth.volume.value = -14;

  // ── Boss music synths ──

  // Lead melody - square wave brillante (stile ottoni 8-bit)
  bossLeadSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.5, release: 0.08 }
  }).toDestination();
  bossLeadSynth.volume.value = -8;

  // Chord/harmony - PolySynth per accordi pieni (stile brass section)
  bossChordSynth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 4,
    voice: Tone.Synth,
    options: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.35, release: 0.12 }
    }
  }).toDestination();
  bossChordSynth.volume.value = -14;

  // Bass - sawtooth pesante
  bossBassSynth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.005, decay: 0.15, sustain: 0.3, release: 0.05 }
  }).toDestination();
  bossBassSynth.volume.value = -12;

  // Kick drum (low noise burst)
  bossDrumSynth = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 }
  }).toDestination();
  bossDrumSynth.volume.value = -10;

  // Snare (noise burst)
  bossSnareSynth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.03 }
  }).toDestination();
  bossSnareSynth.volume.value = -14;
}

function playShoot() { if (audioStarted) shootSynth.triggerAttackRelease('C6', '0.08'); }
function playExplosion() { if (audioStarted) explosionSynth.triggerAttackRelease('0.15'); }
function playInvaderMove(pitch) {
  if (!audioStarted) return;
  var notes = ['C3', 'D3', 'E3', 'F3'];
  invaderMoveSynth.triggerAttackRelease(notes[pitch % 4], '0.04');
}
function playPlayerDie() { if (audioStarted) playerDieSynth.triggerAttackRelease('C2', '0.5'); }
function playUfo() { if (audioStarted) ufoSynth.triggerAttackRelease('B5', '0.1'); }

// ─── BOSS MUSIC ───
// Colonna sonora originale in stile anime mecha anni '70
// Re minore, marziale, con ottoni polifonici e basso martellante
// 132 BPM, 8 battute in loop

// Melodia lead - eroica, con salti di quarta/quinta e scale discendenti
var BOSS_LEAD = [
  // Batt 1: apertura drammatica
  { time: '0:0:0', note: 'D5', dur: '8n' },
  { time: '0:0:2', note: 'D5', dur: '16n' },
  { time: '0:1:0', note: 'C5', dur: '8n' },
  { time: '0:1:2', note: 'D5', dur: '8n' },
  { time: '0:2:0', note: 'F5', dur: '4n' },
  { time: '0:3:0', note: 'E5', dur: '8n' },
  { time: '0:3:2', note: 'D5', dur: '8n' },
  // Batt 2: risposta discendente
  { time: '1:0:0', note: 'C5', dur: '8n' },
  { time: '1:0:2', note: 'Bb4', dur: '8n' },
  { time: '1:1:0', note: 'A4', dur: '4n' },
  { time: '1:2:0', note: 'G4', dur: '8n' },
  { time: '1:2:2', note: 'A4', dur: '8n' },
  { time: '1:3:0', note: 'Bb4', dur: '8n' },
  { time: '1:3:2', note: 'A4', dur: '8n' },
  // Batt 3: ripresa con variazione ascendente
  { time: '2:0:0', note: 'D5', dur: '8n' },
  { time: '2:0:2', note: 'D5', dur: '16n' },
  { time: '2:1:0', note: 'E5', dur: '8n' },
  { time: '2:1:2', note: 'F5', dur: '8n' },
  { time: '2:2:0', note: 'A5', dur: '4n' },
  { time: '2:3:0', note: 'G5', dur: '8n' },
  { time: '2:3:2', note: 'F5', dur: '8n' },
  // Batt 4: cadenza verso la tonica
  { time: '3:0:0', note: 'E5', dur: '8n' },
  { time: '3:0:2', note: 'D5', dur: '8n' },
  { time: '3:1:0', note: 'C5', dur: '8n' },
  { time: '3:1:2', note: 'Bb4', dur: '8n' },
  { time: '3:2:0', note: 'A4', dur: '4n' },
  { time: '3:3:0', note: 'D5', dur: '4n' },
  // Batt 5: secondo tema - piu' ritmico e incalzante
  { time: '4:0:0', note: 'A4', dur: '16n' },
  { time: '4:0:1', note: 'A4', dur: '16n' },
  { time: '4:0:2', note: 'D5', dur: '8n' },
  { time: '4:1:0', note: 'A4', dur: '16n' },
  { time: '4:1:1', note: 'A4', dur: '16n' },
  { time: '4:1:2', note: 'E5', dur: '8n' },
  { time: '4:2:0', note: 'F5', dur: '8n' },
  { time: '4:2:2', note: 'E5', dur: '8n' },
  { time: '4:3:0', note: 'D5', dur: '4n' },
  // Batt 6: ribattuto eroico
  { time: '5:0:0', note: 'A4', dur: '16n' },
  { time: '5:0:1', note: 'A4', dur: '16n' },
  { time: '5:0:2', note: 'D5', dur: '8n' },
  { time: '5:1:0', note: 'F5', dur: '4n' },
  { time: '5:2:0', note: 'E5', dur: '8n' },
  { time: '5:2:2', note: 'D5', dur: '8n' },
  { time: '5:3:0', note: 'C5', dur: '8n' },
  { time: '5:3:2', note: 'A4', dur: '8n' },
  // Batt 7: climax - nota alta tenuta
  { time: '6:0:0', note: 'Bb4', dur: '8n' },
  { time: '6:0:2', note: 'C5', dur: '8n' },
  { time: '6:1:0', note: 'D5', dur: '8n' },
  { time: '6:1:2', note: 'E5', dur: '8n' },
  { time: '6:2:0', note: 'F5', dur: '4n' },
  { time: '6:3:0', note: 'A5', dur: '4n' },
  // Batt 8: risoluzione
  { time: '7:0:0', note: 'G5', dur: '8n' },
  { time: '7:0:2', note: 'F5', dur: '8n' },
  { time: '7:1:0', note: 'E5', dur: '8n' },
  { time: '7:1:2', note: 'D5', dur: '8n' },
  { time: '7:2:0', note: 'A4', dur: '4n' },
  { time: '7:3:0', note: 'D5', dur: '4n' },
];

// Accordi polifonici - brass section con triadi e power chords
var BOSS_CHORDS = [
  // Dm
  { time: '0:0:0', notes: ['D3', 'A3', 'D4', 'F4'], dur: '2n' },
  { time: '0:2:0', notes: ['D3', 'A3', 'D4'], dur: '4n' },
  { time: '0:3:0', notes: ['C3', 'G3', 'C4'], dur: '4n' },
  // Bbmaj -> A
  { time: '1:0:0', notes: ['Bb2', 'F3', 'Bb3', 'D4'], dur: '2n' },
  { time: '1:2:0', notes: ['A2', 'E3', 'A3', 'C#4'], dur: '2n' },
  // Dm
  { time: '2:0:0', notes: ['D3', 'A3', 'D4', 'F4'], dur: '2n' },
  { time: '2:2:0', notes: ['F3', 'A3', 'C4', 'F4'], dur: '2n' },
  // Gm -> A
  { time: '3:0:0', notes: ['G3', 'Bb3', 'D4'], dur: '4n' },
  { time: '3:1:0', notes: ['A3', 'C#4', 'E4'], dur: '4n' },
  { time: '3:2:0', notes: ['D3', 'A3', 'D4', 'F4'], dur: '2n' },
  // Dm stabs ritmici
  { time: '4:0:0', notes: ['D3', 'A3', 'D4'], dur: '8n' },
  { time: '4:0:2', notes: ['D3', 'A3', 'D4'], dur: '8n' },
  { time: '4:1:0', notes: ['D3', 'A3', 'D4'], dur: '8n' },
  { time: '4:1:2', notes: ['D3', 'A3', 'D4'], dur: '8n' },
  { time: '4:2:0', notes: ['F3', 'A3', 'C4'], dur: '2n' },
  // Bb -> A
  { time: '5:0:0', notes: ['D3', 'A3', 'D4'], dur: '8n' },
  { time: '5:0:2', notes: ['D3', 'A3', 'D4'], dur: '8n' },
  { time: '5:1:0', notes: ['Bb2', 'F3', 'Bb3', 'D4'], dur: '4n' },
  { time: '5:2:0', notes: ['A2', 'E3', 'A3', 'C#4'], dur: '2n' },
  // Climax: Bb -> C -> Dm
  { time: '6:0:0', notes: ['Bb2', 'F3', 'Bb3', 'D4'], dur: '4n' },
  { time: '6:1:0', notes: ['C3', 'G3', 'C4', 'E4'], dur: '4n' },
  { time: '6:2:0', notes: ['D3', 'A3', 'D4', 'F4'], dur: '4n' },
  { time: '6:3:0', notes: ['A3', 'C#4', 'E4', 'A4'], dur: '4n' },
  // Risoluzione Dm
  { time: '7:0:0', notes: ['D3', 'A3', 'D4', 'F4'], dur: '2n' },
  { time: '7:2:0', notes: ['A2', 'E3', 'A3', 'C#4'], dur: '4n' },
  { time: '7:3:0', notes: ['D3', 'A3', 'D4', 'F4'], dur: '4n' },
];

// Basso martellante in ottavi - fondamentale del groove
var BOSS_BASS = [
  // Batt 1-2: Dm -> Bb -> A
  { time: '0:0:0', note: 'D2', dur: '8n' }, { time: '0:0:2', note: 'D3', dur: '8n' },
  { time: '0:1:0', note: 'D2', dur: '8n' }, { time: '0:1:2', note: 'D3', dur: '8n' },
  { time: '0:2:0', note: 'D2', dur: '8n' }, { time: '0:2:2', note: 'A2', dur: '8n' },
  { time: '0:3:0', note: 'C2', dur: '8n' }, { time: '0:3:2', note: 'C3', dur: '8n' },
  { time: '1:0:0', note: 'Bb1', dur: '8n' }, { time: '1:0:2', note: 'Bb2', dur: '8n' },
  { time: '1:1:0', note: 'Bb1', dur: '8n' }, { time: '1:1:2', note: 'F2', dur: '8n' },
  { time: '1:2:0', note: 'A1', dur: '8n' }, { time: '1:2:2', note: 'A2', dur: '8n' },
  { time: '1:3:0', note: 'A1', dur: '8n' }, { time: '1:3:2', note: 'E2', dur: '8n' },
  // Batt 3-4: Dm -> F -> Gm -> A -> Dm
  { time: '2:0:0', note: 'D2', dur: '8n' }, { time: '2:0:2', note: 'D3', dur: '8n' },
  { time: '2:1:0', note: 'D2', dur: '8n' }, { time: '2:1:2', note: 'D3', dur: '8n' },
  { time: '2:2:0', note: 'F2', dur: '8n' }, { time: '2:2:2', note: 'F2', dur: '8n' },
  { time: '2:3:0', note: 'A2', dur: '8n' }, { time: '2:3:2', note: 'A2', dur: '8n' },
  { time: '3:0:0', note: 'G2', dur: '8n' }, { time: '3:0:2', note: 'G2', dur: '8n' },
  { time: '3:1:0', note: 'A2', dur: '8n' }, { time: '3:1:2', note: 'A2', dur: '8n' },
  { time: '3:2:0', note: 'D2', dur: '8n' }, { time: '3:2:2', note: 'D3', dur: '8n' },
  { time: '3:3:0', note: 'D2', dur: '8n' }, { time: '3:3:2', note: 'A2', dur: '8n' },
  // Batt 5-6: sezione ritmica - basso ostinato
  { time: '4:0:0', note: 'D2', dur: '8n' }, { time: '4:0:2', note: 'D2', dur: '8n' },
  { time: '4:1:0', note: 'D2', dur: '8n' }, { time: '4:1:2', note: 'D2', dur: '8n' },
  { time: '4:2:0', note: 'F2', dur: '8n' }, { time: '4:2:2', note: 'F2', dur: '8n' },
  { time: '4:3:0', note: 'A2', dur: '8n' }, { time: '4:3:2', note: 'D3', dur: '8n' },
  { time: '5:0:0', note: 'D2', dur: '8n' }, { time: '5:0:2', note: 'D2', dur: '8n' },
  { time: '5:1:0', note: 'Bb1', dur: '8n' }, { time: '5:1:2', note: 'Bb2', dur: '8n' },
  { time: '5:2:0', note: 'A1', dur: '8n' }, { time: '5:2:2', note: 'A2', dur: '8n' },
  { time: '5:3:0', note: 'A1', dur: '8n' }, { time: '5:3:2', note: 'E2', dur: '8n' },
  // Batt 7-8: climax e risoluzione
  { time: '6:0:0', note: 'Bb1', dur: '8n' }, { time: '6:0:2', note: 'Bb2', dur: '8n' },
  { time: '6:1:0', note: 'C2', dur: '8n' }, { time: '6:1:2', note: 'C3', dur: '8n' },
  { time: '6:2:0', note: 'D2', dur: '8n' }, { time: '6:2:2', note: 'D3', dur: '8n' },
  { time: '6:3:0', note: 'A2', dur: '8n' }, { time: '6:3:2', note: 'A2', dur: '8n' },
  { time: '7:0:0', note: 'D2', dur: '8n' }, { time: '7:0:2', note: 'D3', dur: '8n' },
  { time: '7:1:0', note: 'D2', dur: '8n' }, { time: '7:1:2', note: 'D3', dur: '8n' },
  { time: '7:2:0', note: 'A1', dur: '8n' }, { time: '7:2:2', note: 'A2', dur: '8n' },
  { time: '7:3:0', note: 'D2', dur: '8n' }, { time: '7:3:2', note: 'D3', dur: '8n' },
];

// Kick pattern - accenti forti su 1 e 3
var BOSS_KICK = [];
for (var b = 0; b < 8; b++) {
  BOSS_KICK.push({ time: b + ':0:0', vel: 1.0 });
  BOSS_KICK.push({ time: b + ':1:0', vel: 0.6 });
  BOSS_KICK.push({ time: b + ':2:0', vel: 0.9 });
  BOSS_KICK.push({ time: b + ':3:0', vel: 0.6 });
}

// Snare - controtempo su 2 e 4, con ghost notes
var BOSS_SNARE = [];
for (var b = 0; b < 8; b++) {
  BOSS_SNARE.push({ time: b + ':0:2', vel: 0.3 });
  BOSS_SNARE.push({ time: b + ':1:0', vel: 0.8 });
  BOSS_SNARE.push({ time: b + ':1:2', vel: 0.3 });
  BOSS_SNARE.push({ time: b + ':2:2', vel: 0.3 });
  BOSS_SNARE.push({ time: b + ':3:0', vel: 0.8 });
  BOSS_SNARE.push({ time: b + ':3:2', vel: 0.3 });
}

// Mothership: trasposta una quarta sopra (Sol minore), piu' veloce e aggressiva
function transposeNote(note, semitones) {
  var noteNames = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  // Parse note
  var match = note.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return note;
  var name = match[1];
  var octave = parseInt(match[2]);
  // Normalize flats/sharps
  var altMap = { 'Db': 'C#', 'Eb': 'Eb', 'Gb': 'F#', 'Ab': 'Ab', 'Bb': 'Bb' };
  if (altMap[name]) name = altMap[name];
  var idx = noteNames.indexOf(name);
  if (idx < 0) return note;
  idx += semitones;
  while (idx < 0) { idx += 12; octave--; }
  while (idx >= 12) { idx -= 12; octave++; }
  return noteNames[idx] + octave;
}

var MOTHER_LEAD = BOSS_LEAD.map(function(n) {
  return { time: n.time, note: transposeNote(n.note, 5), dur: n.dur };
});

var MOTHER_CHORDS = BOSS_CHORDS.map(function(c) {
  return {
    time: c.time,
    notes: c.notes.map(function(n) { return transposeNote(n, 5); }),
    dur: c.dur
  };
});

var MOTHER_BASS = BOSS_BASS.map(function(n) {
  return { time: n.time, note: transposeNote(n.note, 5), dur: n.dur };
});

// Intro riff
var BOSS_INTRO_NOTES = [
  { note: 'D4', dur: '16n' },
  { note: 'D4', dur: '16n' },
  { note: 'F4', dur: '8n' },
  { note: 'A4', dur: '8n' },
  { note: 'D5', dur: '4n' },
  { note: 'C5', dur: '8n' },
  { note: 'Bb4', dur: '8n' },
  { note: 'A4', dur: '4n' },
  { note: 'D5', dur: '2n' },
];

var BOSS_INTRO_CHORDS_DATA = [
  { notes: ['D3', 'A3', 'D4', 'F4'], dur: '4n' },
  { notes: ['D3', 'A3', 'D4', 'F4'], dur: '4n' },
  { notes: ['F3', 'A3', 'C4', 'F4'], dur: '4n' },
  { notes: ['A3', 'C#4', 'E4'], dur: '4n' },
  { notes: ['D3', 'A3', 'D4', 'F4'], dur: '2n' },
];

// Victory fanfare
var VICTORY_NOTES = [
  { note: 'D5', dur: '16n', delay: 0 },
  { note: 'D5', dur: '16n', delay: 0.08 },
  { note: 'D5', dur: '8n', delay: 0.16 },
  { note: 'F5', dur: '4n', delay: 0.35 },
  { note: 'E5', dur: '8n', delay: 0.7 },
  { note: 'F5', dur: '8n', delay: 0.9 },
  { note: 'A5', dur: '4n', delay: 1.1 },
  { note: 'D6', dur: '2n', delay: 1.5 },
];

var VICTORY_CHORDS_DATA = [
  { notes: ['D4', 'F#4', 'A4'], dur: '4n', delay: 0.35 },
  { notes: ['D4', 'F#4', 'A4', 'D5'], dur: '2n', delay: 1.1 },
  { notes: ['D4', 'F#4', 'A4', 'D5'], dur: '1n', delay: 1.5 },
];

function startBossMusic(type) {
  if (!audioStarted || bossPlaying) return;
  bossPlaying = true;

  var isMothership = (type === 'mothership');
  Tone.Transport.bpm.value = isMothership ? 152 : 132;

  var lead = isMothership ? MOTHER_LEAD : BOSS_LEAD;
  var chords = isMothership ? MOTHER_CHORDS : BOSS_CHORDS;
  var bass = isMothership ? MOTHER_BASS : BOSS_BASS;

  // Lead melody
  bossLeadSeq = new Tone.Part(function(time, value) {
    bossLeadSynth.triggerAttackRelease(value.note, value.dur, time);
  }, lead);
  bossLeadSeq.loop = true;
  bossLeadSeq.loopEnd = '8:0:0';

  // Chords (polyphonic)
  bossChordSeq = new Tone.Part(function(time, value) {
    bossChordSynth.triggerAttackRelease(value.notes, value.dur, time);
  }, chords);
  bossChordSeq.loop = true;
  bossChordSeq.loopEnd = '8:0:0';

  // Bass
  bossBassSeq = new Tone.Part(function(time, value) {
    bossBassSynth.triggerAttackRelease(value.note, value.dur, time);
  }, bass);
  bossBassSeq.loop = true;
  bossBassSeq.loopEnd = '8:0:0';

  // Kick
  bossDrumSeq = new Tone.Part(function(time, value) {
    bossDrumSynth.triggerAttackRelease('C1', '8n', time, value.vel);
  }, BOSS_KICK);
  bossDrumSeq.loop = true;
  bossDrumSeq.loopEnd = '8:0:0';

  // Snare
  bossSnareSeq = new Tone.Part(function(time, value) {
    bossSnareSynth.triggerAttackRelease('16n', time, value.vel);
  }, BOSS_SNARE);
  bossSnareSeq.loop = true;
  bossSnareSeq.loopEnd = '8:0:0';

  bossLeadSeq.start(0);
  bossChordSeq.start(0);
  bossBassSeq.start(0);
  bossDrumSeq.start(0);
  bossSnareSeq.start(0);
  Tone.Transport.start();
}

function stopBossMusic() {
  if (!bossPlaying) return;
  bossPlaying = false;

  var seqs = [bossLeadSeq, bossChordSeq, bossBassSeq, bossDrumSeq, bossSnareSeq];
  seqs.forEach(function(s) {
    if (s) { s.stop(); s.dispose(); }
  });
  bossLeadSeq = null;
  bossChordSeq = null;
  bossBassSeq = null;
  bossDrumSeq = null;
  bossSnareSeq = null;
  Tone.Transport.stop();
}

function playBossIntro() {
  if (!audioStarted) return;
  var now = Tone.now();

  // Melodia intro
  var t = 0;
  BOSS_INTRO_NOTES.forEach(function(n) {
    bossLeadSynth.triggerAttackRelease(n.note, n.dur, now + t);
    t += 0.18;
  });

  // Accordi intro
  var ct = 0;
  BOSS_INTRO_CHORDS_DATA.forEach(function(c) {
    bossChordSynth.triggerAttackRelease(c.notes, c.dur, now + ct);
    ct += 0.35;
  });

  // Rullo di tamburo
  for (var i = 0; i < 8; i++) {
    bossDrumSynth.triggerAttackRelease('C1', '16n', now + i * 0.12, 0.3 + i * 0.08);
  }
}

function playVictoryFanfare() {
  if (!audioStarted) return;
  stopBossMusic();

  var now = Tone.now();
  VICTORY_NOTES.forEach(function(n) {
    bossLeadSynth.triggerAttackRelease(n.note, n.dur, now + n.delay);
  });
  VICTORY_CHORDS_DATA.forEach(function(c) {
    bossChordSynth.triggerAttackRelease(c.notes, c.dur, now + c.delay);
  });
  // Rullo trionfale
  for (var i = 0; i < 4; i++) {
    bossDrumSynth.triggerAttackRelease('C1', '8n', now + i * 0.3, 0.9);
    bossSnareSynth.triggerAttackRelease('8n', now + 0.15 + i * 0.3, 0.7);
  }
}

function playBossHit() {
  if (!audioStarted) return;
  explosionSynth.triggerAttackRelease('0.08');
}

function playBossDeath() {
  if (!audioStarted) return;
  for (var i = 0; i < 5; i++) {
    setTimeout(function() {
      if (audioStarted) explosionSynth.triggerAttackRelease('0.2');
    }, i * 150);
  }
}

// ─── SPEECH SYNTHESIS (voce di Imperatore Xarion - robotica drammatica) ───
let bossVoiceReady = false;
let bossVoices = [];

// Pre-carica le voci (sono asincrone in alcuni browser)
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = function() {
    bossVoices = window.speechSynthesis.getVoices();
    bossVoiceReady = true;
  };
  bossVoices = window.speechSynthesis.getVoices();
  if (bossVoices.length > 0) bossVoiceReady = true;
}

let bossSpeaking = false; // true mentre Imperatore Xarion sta parlando

function speakBoss(text) {
  if (!('speechSynthesis' in window)) {
    bossSpeaking = false;
    return;
  }
  window.speechSynthesis.cancel();
  bossSpeaking = true;

  // Funzione per creare un utterance con voce maschile italiana
  function makeUtterance(word) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'it-IT';
    utterance.rate = 0.4;
    utterance.pitch = 0.1;
    utterance.volume = 1.0;

    if (bossVoices.length > 0) {
      const nm = function(v) { return v.name.toLowerCase(); };
      const italianMale = bossVoices.find(function(v) {
        return v.lang.startsWith('it') && (
          nm(v).indexOf('luca') >= 0 ||
          nm(v).indexOf('male') >= 0 ||
          nm(v).indexOf('uomo') >= 0 ||
          nm(v).indexOf('marco') >= 0 ||
          nm(v).indexOf('giorgio') >= 0 ||
          nm(v).indexOf('diego') >= 0
        );
      });
      const italianNotFemale = bossVoices.find(function(v) {
        return v.lang.startsWith('it') &&
          nm(v).indexOf('female') < 0 &&
          nm(v).indexOf('alice') < 0 &&
          nm(v).indexOf('elsa') < 0 &&
          nm(v).indexOf('federica') < 0 &&
          nm(v).indexOf('donna') < 0;
      });
      const italianAny = bossVoices.find(function(v) {
        return v.lang.startsWith('it');
      });
      const chosen = italianMale || italianNotFemale || italianAny;
      if (chosen) utterance.voice = chosen;
    }
    return utterance;
  }

  // Pronuncia parola per parola con pause, poi segnala fine
  const words = text.split(' ');
  let wordIndex = 0;

  function speakNextWord() {
    if (wordIndex >= words.length) {
      // Tutte le parole dette, piccola pausa finale poi sblocca
      setTimeout(function() { bossSpeaking = false; }, 400);
      return;
    }
    const utterance = makeUtterance(words[wordIndex]);
    wordIndex++;
    utterance.onend = function() {
      // Pausa drammatica tra le parole
      setTimeout(speakNextWord, 350);
    };
    utterance.onerror = function() {
      setTimeout(speakNextWord, 200);
    };
    window.speechSynthesis.speak(utterance);
  }

  speakNextWord();

  // Ronzio robotico di sottofondo
  if (audioStarted) {
    try {
      const robotBuzz = new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.3, decay: 0.5, sustain: 0.3, release: 1.0 }
      }).toDestination();
      robotBuzz.volume.value = -20;
      robotBuzz.triggerAttackRelease('C1', words.length * 0.8 + 0.5);
      setTimeout(function() {
        robotBuzz.triggerAttackRelease('D#1', 0.8);
      }, 400);
    } catch(e) {}
  }
}
