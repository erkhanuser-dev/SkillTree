const STORAGE_KEY = "skillTreeLightLab";

const defaultState = {
  xp: 0,
  level: 1,

  dna: {
    analysis: 20,
    creativity: 20,
    argument: 20,
    memory: 20
  },

  completed: [],
  mistakes: [],
  discoveries: [],

  personalityType: "UNDISCOVERED"
};

let state = loadState();

let currentMode = null;
let currentMissionIndex = 0;
let timerInterval = null;
let timeLeft = 60;
let missionFinished = false;
let novaDragging = false;


/* =========================
   MISSIONS
========================= */

const missions = {

  daily: [
    {
      title: "The Missing Rule",
      question:
        "Three students receive the same information.\n\nA understands it immediately.\nB memorizes every detail.\nC asks several questions before answering.\n\nWhich student is most likely to make a strong decision in an unfamiliar situation — and WHY?",
      hint: "Don't choose based on who is 'smartest'. Think about what each strategy gives them."
    },
    {
      title: "One Variable",
      question:
        "You are testing why students perform differently on a difficult exam.\n\nYou can change only ONE variable in your experiment.\n\nWhat would you change, and why would that variable be useful?",
      hint: "A good experiment changes one thing while keeping other conditions as stable as possible."
    },
    {
      title: "The Prediction",
      question:
        "A website says: 'Students who listen to music while studying remember 40% more.'\n\nBefore believing this statement, give THREE questions you would ask.",
      hint: "Think about the source, the experiment and what exactly '40%' means."
    }
  ],

  battle: [
    {
      title: "Two Sides",
      question:
        "A school wants to replace one large exam with several smaller assessments.\n\nGive ONE argument supporting the change and ONE argument against it.\n\nThen explain which argument needs stronger evidence.",
      hint: "The strongest answer separates an argument from the evidence needed to support it."
    },
    {
      title: "Perspective Switch",
      question:
        "Someone says: 'If a rule exists, following it is always the right choice.'\n\nDefend the statement for a moment.\nThen give one situation where it becomes questionable.",
      hint: "Try to make both sides sound reasonable."
    },
    {
      title: "The Rebuttal",
      question:
        "Someone argues: 'This idea worked once, therefore it will work everywhere.'\n\nExplain the logical weakness in this argument.",
      hint: "One example does not automatically prove a universal rule."
    }
  ],

  ai: [
    {
      title: "Challenge the Machine",
      question:
        "AI says:\n\n'People who read more books are always better thinkers because books contain more information.'\n\nDo you agree?\nFind at least TWO weaknesses in this answer.",
      hint: "Look at the word 'always' and the difference between information and thinking."
    },
    {
      title: "Machine Confidence",
      question:
        "AI says:\n\n'Because most successful people wake up early, waking up early causes success.'\n\nWhat is wrong with this reasoning?",
      hint: "Think about correlation and causation."
    }
  ],

  real: [
    {
      title: "The Group Project",
      question:
        "You are leading a group project. Two members work quickly but make mistakes. Two others work slowly but carefully.\n\nYou have three days left.\n\nHow would you divide the work?",
      hint: "Don't just divide tasks equally. Think about strengths and deadlines."
    },
    {
      title: "The Decision",
      question:
        "Your team has two possible project ideas.\n\nIdea A is impressive but difficult.\nIdea B is simpler but much more realistic.\n\nWhat information would you collect before deciding?",
      hint: "What would reduce uncertainty?"
    },
    {
      title: "The Unexpected Problem",
      question:
        "Halfway through a project, you discover your original plan cannot work.\n\nWhat is the FIRST thing you would do?",
      hint: "The first step doesn't have to be finding a new solution immediately."
    }
  ],

  argue: [
    {
      title: "Sounds Convincing",
      question:
        "Read this argument:\n\n'Everyone I know uses this study method and gets good grades. Therefore, this is the best study method.'\n\nIdentify the weakest part of the reasoning.",
      hint: "Ask yourself whether the group mentioned represents everyone."
    },
    {
      title: "Hidden Assumption",
      question:
        "Argument:\n\n'We shouldn't change the school schedule because students have always studied this way.'\n\nWhat assumption is hidden inside this argument?",
      hint: "Something being old does not automatically tell us whether it is effective."
    },
    {
      title: "Evidence Check",
      question:
        "Someone posts a screenshot saying:\n\n'Scientists proved that this method doubles intelligence.'\n\nWhat would you check before trusting the claim?",
      hint: "Think source, study design, wording and evidence."
    }
  ],

  memory: [
    {
      title: "What Did You Learn?",
      question:
        "Try to remember something from a previous SkillTree experiment.\n\nWhat was the main idea of one challenge you completed earlier?\n\nExplain it WITHOUT looking back.",
      hint: "Close your eyes for a few seconds and reconstruct the situation before writing."
    }
  ]
};


/* =========================
   STATE
========================= */

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!saved) return structuredClone(defaultState);

    return {
      ...structuredClone(defaultState),
      ...saved,
      dna: {
        ...defaultState.dna,
        ...(saved.dna || {})
      }
    };

  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


/* =========================
   NAVIGATION
========================= */

document.querySelectorAll("[data-section]").forEach(button => {

  button.addEventListener("click", () => {

    const sectionName = button.dataset.section;

    document.querySelectorAll(".section").forEach(section => {
      section.classList.remove("active-section");
    });

    document.getElementById(sectionName).classList.add("active-section");

    document.querySelectorAll(".nav-btn").forEach(nav => {
      nav.classList.toggle(
        "active",
        nav.dataset.section === sectionName
      );
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

});


/* =========================
   PROFILE
========================= */

function updateProfile() {

  const xpInLevel = state.xp % 100;

  document.getElementById("headerLevel").textContent = state.level;
  document.getElementById("treeLevel").textContent = state.level;

  document.getElementById("bigLevel").textContent =
    String(state.level).padStart(2, "0");

  document.getElementById("xpBar").style.width =
    xpInLevel + "%";

  document.getElementById("xpText").textContent =
    `${xpInLevel} / 100 XP`;

  document.getElementById("nextLevel").textContent =
    `${100 - xpInLevel} XP`;

  updateDNA();
  updatePersonality();
  updateDiscoveries();
  updateStats();
  updateTree();
}


function updateDNA() {

  const dna = state.dna;

  Object.entries(dna).forEach(([key, value]) => {

    const rounded = Math.round(value);

    const valueEl = document.getElementById(key + "Value");
    const barEl = document.getElementById(key + "Bar");

    if (valueEl) valueEl.textContent = rounded;
    if (barEl) barEl.style.width = Math.min(100, rounded) + "%";
  });

  const total =
    dna.analysis +
    dna.creativity +
    dna.argument +
    dna.memory;

  const average = Math.round(total / 4);

  document.getElementById("dnaPercent").textContent =
    average + "%";
}


function updatePersonality() {

  const dna = state.dna;

  const sorted = Object.entries(dna)
    .sort((a,b) => b[1] - a[1]);

  const main = sorted[0][0];
  const second = sorted[1][0];

  let type = "Explorer";
  let description =
    "You naturally explore possibilities before locking onto one answer.";

  if (main === "analysis") {
    type = second === "argument"
      ? "Strategist"
      : "Analyst";

    description =
      "You tend to break complicated situations into smaller pieces and look for patterns.";
  }

  if (main === "creativity") {
    type = "Explorer";

    description =
      "You naturally search for unusual connections and alternative possibilities.";
  }

  if (main === "argument") {
    type = second === "analysis"
      ? "Strategist"
      : "Advocate";

    description =
      "You naturally test ideas by comparing claims, evidence and opposing perspectives.";
  }

  if (main === "memory") {
    type = "Archivist";

    description =
      "You naturally build knowledge by connecting new information with what you already know.";
  }

  const totalActivity =
    state.completed.length + state.mistakes.length;

  if (totalActivity === 0) {
    type = "UNDISCOVERED";
    description =
      "Complete experiments to discover how your mind naturally works.";
  }

  state.personalityType = type;

  document.getElementById("personalityType").textContent =
    type.toUpperCase();

  document.getElementById("personalityDescription").textContent =
    description;

  const traits = getTraits(dna);

  document.getElementById("traitTags").innerHTML =
    traits.map(trait => `<span>${trait}</span>`).join("");
}


function getTraits(dna) {

  const traits = [];

  if (dna.analysis >= 30)
    traits.push("PATTERN SEEKER");

  if (dna.creativity >= 30)
    traits.push("IDEA MAKER");

  if (dna.argument >= 30)
    traits.push("COUNTER-THINKER");

  if (dna.memory >= 30)
    traits.push("KNOWLEDGE KEEPER");

  if (!traits.length)
    traits.push("STILL FORMING");

  return traits.slice(0, 3);
}


function updateDiscoveries() {

  const container =
    document.getElementById("discoveries");

  document.getElementById("discoveryCount").textContent =
    state.discoveries.length;

  if (!state.discoveries.length) {

    container.innerHTML = `
      <div class="empty-discovery">
        <span>+</span>
        <p>Your first cognitive trait will appear here.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    state.discoveries.slice(-4).reverse().map(item => `
      <div class="discovery">
        <strong>${item.name}</strong>
        <span>${item.description}</span>
      </div>
    `).join("");
}


function updateStats() {

  document.getElementById("completedCount").textContent =
    state.completed.length;

  document.getElementById("mistakeCount").textContent =
    state.mistakes.length;

  document.getElementById("skillCount").textContent =
    Object.values(state.dna)
      .filter(v => v >= 35).length;

  document.getElementById("totalXp").textContent =
    state.xp;
}


function updateTree() {

  document.getElementById("treeAnalysis").textContent =
    Math.round(state.dna.analysis) + "%";

  document.getElementById("treeCreativity").textContent =
    Math.round(state.dna.creativity) + "%";

  document.getElementById("treeArgument").textContent =
    Math.round(state.dna.argument) + "%";

  document.getElementById("treeMemory").textContent =
    Math.round(state.dna.memory) + "%";
}


/* =========================
   EXPERIMENTS
========================= */

document.querySelectorAll(".experiment-card").forEach(card => {

  card.addEventListener("click", () => {

    currentMode = card.dataset.mode;
    currentMissionIndex = 0;

    openMission();
  });

});


function openMission() {

  const mission =
    missions[currentMode][currentMissionIndex];

  missionFinished = false;

  document.getElementById("missionOverlay")
    .classList.add("open");

  document.getElementById("missionMode").textContent =
    currentMode.toUpperCase();

  document.getElementById("missionNumber").textContent =
    String(currentMissionIndex + 1).padStart(2, "0");

  document.getElementById("missionTitle").textContent =
    mission.title;

  document.getElementById("missionQuestion").textContent =
    mission.question;

  document.getElementById("answerInput").value = "";

  document.getElementById("answerInput").disabled = false;

  document.getElementById("submitAnswer").disabled = false;

  document.getElementById("resultBox").classList.remove("show");

  document.getElementById("hintBox").style.display = "none";

  document.getElementById("hintBox").textContent =
    mission.hint;

  document.getElementById("nextMission").textContent =
    currentMissionIndex <
    missions[currentMode].length - 1
      ? "NEXT EXPERIMENT →"
      : "FINISH →";

  startTimer();

  document.getElementById("answerInput").focus();

  nova(
    currentMode === "memory"
      ? "Let's see if your brain kept something useful."
      : "Don't try to impress me. Try to think."
  );
}


function startTimer() {

  clearInterval(timerInterval);

  timeLeft = 60;

  document.getElementById("timer").textContent =
    timeLeft;

  timerInterval = setInterval(() => {

    timeLeft--;

    document.getElementById("timer").textContent =
      timeLeft;

    if (timeLeft <= 0) {

      clearInterval(timerInterval);

      document.getElementById("answerInput").disabled = true;
      document.getElementById("submitAnswer").disabled = true;

      showResult(0, true);
    }

  }, 1000);
}


document.getElementById("hintBtn")
  .addEventListener("click", () => {

    const hint =
      document.getElementById("hintBox");

    hint.style.display =
      hint.style.display === "block"
        ? "none"
        : "block";
  });


document.getElementById("submitAnswer")
  .addEventListener("click", () => {

    if (missionFinished) return;

    const answer =
      document.getElementById("answerInput").value.trim();

    if (!answer) {

      showToast("Write something first.");

      return;
    }

    clearInterval(timerInterval);

    const score = evaluateAnswer(answer);

    showResult(score, false);

    registerProgress(score, answer);
  });


/* =========================
   SCORING
========================= */

function evaluateAnswer(answer) {

  const words =
    answer.split(/\s+/).filter(Boolean);

  const wordCount = words.length;

  let score = 25;

  if (wordCount >= 25) score += 12;
  if (wordCount >= 50) score += 12;
  if (wordCount >= 80) score += 8;

  if (/[.!?]/.test(answer))
    score += 6;

  const connectors = [
    "because",
    "however",
    "therefore",
    "although",
    "but",
    "for example",
    "since",
    "because",
    "потому",
    "однако",
    "поэтому",
    "например",
    "себебі",
    "бірақ",
    "сондықтан"
  ];

  const connectorCount =
    connectors.filter(word =>
      answer.toLowerCase().includes(word)
    ).length;

  score += connectorCount * 5;

  if (currentMode === "ai") {

    const keywords = [
      "evidence",
      "correlation",
      "cause",
      "always",
      "source",
      "logic",
      "доказ",
      "причин",
      "источник",
      "логик"
    ];

    score += keywords.filter(k =>
      answer.toLowerCase().includes(k)
    ).length * 5;
  }

  if (currentMode === "argue") {

    const keywords = [
      "assumption",
      "evidence",
      "example",
      "general",
      "source",
      "доказ",
      "предполож",
      "обобщ",
      "пример"
    ];

    score += keywords.filter(k =>
      answer.toLowerCase().includes(k)
    ).length * 5;
  }

  if (answer.includes("?"))
    score += 4;

  return Math.min(100, score);
}


/* =========================
   PROGRESS
========================= */

function registerProgress(score, answer) {

  state.completed.push({
    mode: currentMode,
    score,
    date: Date.now()
  });

  if (score < 55) {

    state.mistakes.push({
      mode: currentMode,
      text: answer.slice(0, 180),
      date: Date.now()
    });

  }

  let xpGain = 10;

  if (score >= 75) xpGain = 30;
  else if (score >= 55) xpGain = 20;

  state.xp += xpGain;

  const oldLevel = state.level;

  state.level =
    Math.floor(state.xp / 100) + 1;

  updateDNAByMode(score);

  discoverTraits();

  saveState();
  updateProfile();

  if (state.level > oldLevel) {

    nova(
      `LEVEL UP! You reached level ${state.level}. Your profile is changing.`
    );

    showToast(`LEVEL UP — LVL ${state.level}`);
  } else {

    nova(
      score >= 75
        ? "Interesting. That answer tells me something about your thinking."
        : "Not perfect. Good. Mistakes are more useful than easy wins."
    );
  }
}


function updateDNAByMode(score) {

  const amount =
    score >= 75 ? 4 :
    score >= 55 ? 2 : 1;

  const map = {
    daily: ["analysis"],
    battle: ["argument", "analysis"],
    ai: ["analysis", "argument"],
    real: ["creativity", "analysis"],
    argue: ["argument"],
    memory: ["memory"]
  };

  const targets = map[currentMode] || ["analysis"];

  targets.forEach(key => {
    state.dna[key] =
      Math.min(100, state.dna[key] + amount);
  });

  /*
    Small natural decay toward 20 keeps the profile
    from becoming completely one-dimensional.
  */

  Object.keys(state.dna).forEach(key => {

    if (!targets.includes(key)) {

      state.dna[key] = Math.max(
        20,
        state.dna[key] - 0.15
      );
    }

  });
}


function discoverTraits() {

  const checks = [

    {
      condition: state.dna.analysis >= 35,
      name: "PATTERN SEEKER",
      description: "You increasingly look for structure before answering."
    },

    {
      condition: state.dna.argument >= 35,
      name: "COUNTER-THINKER",
      description: "You naturally test claims by looking for weaknesses."
    },

    {
      condition: state.dna.creativity >= 35,
      name: "IDEA MAKER",
      description: "You increasingly explore alternative solutions."
    },

    {
      condition: state.dna.memory >= 35,
      name: "KNOWLEDGE KEEPER",
      description: "You are getting better at retrieving previous knowledge."
    },

    {
      condition: state.level >= 3,
      name: "CONSISTENT THINKER",
      description: "Your progress is becoming a pattern, not a coincidence."
    }
  ];

  checks.forEach(check => {

    if (
      check.condition &&
      !state.discoveries.some(
        d => d.name === check.name
      )
    ) {

      state.discoveries.push({
        name: check.name,
        description: check.description
      });

      showToast(`NEW DISCOVERY: ${check.name}`);

    }

  });
}


/* =========================
   RESULT
========================= */

function showResult(score, timeout) {

  missionFinished = true;

  const result =
    document.getElementById("resultBox");

  document.getElementById("resultScore")
    .textContent = score;

  if (timeout) {

    document.getElementById("resultTitle")
      .textContent = "TIME'S UP";

    document.getElementById("resultText")
      .textContent =
      "The timer ended before the answer was submitted. Try the challenge again later.";

  } else if (score >= 75) {

    document.getElementById("resultTitle")
      .textContent = "STRONG SIGNAL";

    document.getElementById("resultText")
      .textContent =
      "Your answer contains enough reasoning for the lab to learn something about you.";

  } else if (score >= 55) {

    document.getElementById("resultTitle")
      .textContent = "INTERESTING SIGNAL";

    document.getElementById("resultText")
      .textContent =
      "There is a useful idea here. The next experiment can make your reasoning sharper.";

  } else {

    document.getElementById("resultTitle")
      .textContent = "WE FOUND A WEAK SPOT";

    document.getElementById("resultText")
      .textContent =
      "That's actually useful. SkillTree learns fastest from the places where your reasoning breaks.";
  }

  result.classList.add("show");
}


document.getElementById("nextMission")
  .addEventListener("click", () => {
  