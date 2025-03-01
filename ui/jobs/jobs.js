'use strict';

// Each option here can be changed in user/jobs.js with a line such as
// Options.ShowRdmProcs = false
// or
// Options.JustBuffTracker: true
// See user/jobs-example.js for documentation.
let Options = {
  Language: 'en',

  LowerOpacityOutOfCombat: true,
  OpacityOutOfCombat: 0.5,

  HideWellFedAboveSeconds: 15 * 60,
  WellFedZones: ['O1S', 'O2S', 'O3S', 'O4S', 'O5S', 'O6S', 'O7S', 'O8S', 'O9S', 'O10S', 'O11S', 'O12S', 'UCU', 'UWU', 'E1S', 'E2S', 'E3S', 'E4S'],
  ShowHPNumber: ['PLD', 'WAR', 'DRK', 'GNB', 'BLU'],
  ShowMPNumber: ['PLD', 'DRK', 'BLM', 'AST', 'WHM', 'SCH', 'BLU'],

  ShowMPTicker: ['BLM'],
  ShowMPTickerOutOfCombat: false,

  MaxLevel: 80,

  JustBuffTracker: false,

  PerBuffOptions: {
    // This is noisy since it's more or less permanently on you.
    // Players are unlikely to make different decisions based on this.
    standardFinish: {
      hide: true,
    },
  },

  RdmCastTime: 1.94 + 0.5,
  WarGcd: 2.45,
  PldGcd: 2.43,
  AstGcd: 2.39,
  BluGcd: 2.40,

  BigBuffIconWidth: 44,
  BigBuffIconHeight: 32,
  BigBuffBarHeight: 5,
  BigBuffTextHeight: 0,
  BigBuffBorderSize: 1,

  // The minimum time on a cooldown before it is shown.
  BigBuffShowCooldownSeconds: 20,

  FarThresholdOffence: 24,
  DrkLowMPThreshold: 2999,
  DrkMediumMPThreshold: 5999,
  PldLowMPThreshold: 3600,
  PldMediumMPThreshold: 9400,
  BlmLowMPThreshold: 2400,
  LowHealthThresholdPercent: 0.2,
  MidHealthThresholdPercent: 0.8,
};

let kMPNormalRate = 0.06;
let kMPCombatRate = 0.02;
let kMPUI1Rate = 0.30;
let kMPUI2Rate = 0.45;
let kMPUI3Rate = 0.60;
let kMPTickInterval = 3.0;

// Regexes to be filled out once we know the player's name.
let kComboBreakers = null;
let kWellFedZoneRegex = null;

let kYouGainEffectRegex = null;
let kYouLoseEffectRegex = null;
let kYouUseAbilityRegex = null;
let kAnybodyAbilityRegex = null;

let kGainSecondsRegex = Regexes.Parse('for (\\y{Float}) Seconds\\.');
function gainSecondsFromLog(log) {
  let m = log.match(kGainSecondsRegex);
  if (m)
    return m[1];
  return 0;
}
let kGainSourceRegex = Regexes.Parse(' from (\\y{Name}) for');
function gainSourceFromLog(log) {
  let m = log.match(kGainSourceRegex);
  if (m)
    return m[1];
  return null;
}
let kAbilitySourceRegex = Regexes.Parse(' 1[56]:\\y{ObjectId}:(\\y{Name}):');
function abilitySourceFromLog(log) {
  let m = log.match(kAbilitySourceRegex);
  if (m)
    return m[1];
  return null;
}

class ComboTracker {
  constructor(comboBreakers, callback) {
    this.comboTimer = null;
    this.comboBreakers = comboBreakers;
    this.comboNodes = {}; // { key => { re: string, next: [node keys], last: bool } }
    this.startList = [];
    this.callback = callback;
    this.current = null;
    this.considerNext = this.startList;
  }

  AddCombo(skillList) {
    if (this.startList.indexOf(skillList[0]) == -1)
      this.startList.push(skillList[0]);

    for (let i = 0; i < skillList.length; ++i) {
      let node = this.comboNodes[skillList[i]];
      if (node == undefined) {
        node = {
          id: skillList[i],
          next: [],
        };
        this.comboNodes[skillList[i]] = node;
      }
      if (i != skillList.length - 1)
        node.next.push(skillList[i + 1]);
      else
        node.last = true;
    }
  }

  HandleAbility(id) {
    for (let i = 0; i < this.considerNext.length; ++i) {
      let next = this.considerNext[i];
      if (this.comboNodes[next].id == id) {
        this.StateTransition(next);
        return true;
      }
    }
    if (this.comboBreakers.indexOf(id) >= 0) {
      this.AbortCombo();
      return true;
    }
    return false;
  }

  StateTransition(nextState) {
    if (this.current == null && nextState == null)
      return;

    window.clearTimeout(this.comboTimer);
    this.comboTimer = null;
    this.current = nextState;

    if (nextState == null) {
      this.considerNext = this.startList;
    } else {
      this.considerNext = [];
      Array.prototype.push.apply(this.considerNext, this.comboNodes[nextState].next);
      Array.prototype.push.apply(this.considerNext, this.startList);

      if (!this.comboNodes[nextState].last) {
        let kComboDelayMs = 15000;
        this.comboTimer = window.setTimeout(this.AbortCombo.bind(this), kComboDelayMs);
      }
    }
    this.callback(nextState);
  }

  AbortCombo() {
    this.StateTransition(null);
  }
}

function setupComboTracker(callback) {
  let comboTracker = new ComboTracker(kComboBreakers, callback);
  comboTracker.AddCombo([
    gLang.kAbility.EnchantedRiposte,
    gLang.kAbility.EnchantedZwerchhau,
    gLang.kAbility.EnchantedRedoublement,
    gLang.kAbility.Verflare,
  ]);
  comboTracker.AddCombo([
    gLang.kAbility.EnchantedRiposte,
    gLang.kAbility.EnchantedZwerchhau,
    gLang.kAbility.EnchantedRedoublement,
    gLang.kAbility.Verholy,
  ]);
  comboTracker.AddCombo([
    gLang.kAbility.HeavySwing,
    gLang.kAbility.SkullSunder,
    gLang.kAbility.ButchersBlock,
  ]);
  comboTracker.AddCombo([
    gLang.kAbility.HeavySwing,
    gLang.kAbility.Maim,
    gLang.kAbility.StormsEye,
  ]);
  comboTracker.AddCombo([
    gLang.kAbility.HeavySwing,
    gLang.kAbility.Maim,
    gLang.kAbility.StormsPath,
  ]);
  comboTracker.AddCombo([
    gLang.kAbility.Overpower,
    gLang.kAbility.MythrilTempest,
  ]);
  comboTracker.AddCombo([
    gLang.kAbility.FastBlade,
    gLang.kAbility.SavageBlade,
    gLang.kAbility.RageofHalone,
  ]);
  comboTracker.AddCombo([
    gLang.kAbility.FastBlade,
    gLang.kAbility.RiotBlade,
    gLang.kAbility.RoyalAuthority,
  ]);
  comboTracker.AddCombo([
    gLang.kAbility.FastBlade,
    gLang.kAbility.RiotBlade,
    gLang.kAbility.FightOrFlight,
    gLang.kAbility.GoringBlade,
  ]);
  comboTracker.AddCombo([
    gLang.kAbility.FastBlade,
    gLang.kAbility.FightOrFlight,
    gLang.kAbility.RiotBlade,
    gLang.kAbility.GoringBlade,
  ]);
  comboTracker.AddCombo([
    gLang.kAbility.FightOrFlight,
    gLang.kAbility.FastBlade,
    gLang.kAbility.RiotBlade,
    gLang.kAbility.GoringBlade,
  ]);
  return comboTracker;
}

function setupRegexes() {
  kWellFedZoneRegex = Regexes.AnyOf(Options.WellFedZones.map(function(x) {
    return gLang.kZone[x];
  }));

  kYouGainEffectRegex = gLang.youGainEffectRegex('(.*)');
  kYouLoseEffectRegex = gLang.youLoseEffectRegex('(.*)');
  kYouUseAbilityRegex = gLang.youUseAbilityRegex('(\\y{AbilityCode})');
  kAnybodyAbilityRegex = gLang.abilityRegex('(\\y{AbilityCode})');

  // Full skill names of abilities that break combos.
  // TODO: it's sad to have to duplicate combo abilities here to catch out-of-order usage.
  kComboBreakers = Object.freeze([
    // rdm
    gLang.kAbility.Verstone,
    gLang.kAbility.Verfire,
    gLang.kAbility.Veraero,
    gLang.kAbility.Verthunder,
    gLang.kAbility.Verholy,
    gLang.kAbility.Verflare,
    gLang.kAbility.Jolt2,
    gLang.kAbility.Jolt,
    gLang.kAbility.Impact,
    gLang.kAbility.Scatter,
    gLang.kAbility.Vercure,
    gLang.kAbility.Verraise,
    gLang.kAbility.Riposte,
    gLang.kAbility.Zwerchhau,
    gLang.kAbility.Redoublement,
    gLang.kAbility.Moulinet,
    gLang.kAbility.EnchantedRiposte,
    gLang.kAbility.EnchantedZwerchhau,
    gLang.kAbility.EnchantedRedoublement,
    gLang.kAbility.EnchantedMoulinet,
    // war
    gLang.kAbility.Tomahawk,
    gLang.kAbility.Overpower,
    gLang.kAbility.SkullSunder,
    gLang.kAbility.ButchersBlock,
    gLang.kAbility.Maim,
    gLang.kAbility.StormsEye,
    gLang.kAbility.StormsPath,
    gLang.kAbility.MythrilTempest,
    // pld
    gLang.kAbility.ShieldLob,
    gLang.kAbility.TotalEclipse,
    gLang.kAbility.SavageBlade,
    gLang.kAbility.RageofHalone,
    gLang.kAbility.RiotBlade,
    gLang.kAbility.RoyalAuthority,
    gLang.kAbility.GoringBlade,
    gLang.kAbility.Prominence,
    gLang.kAbility.HolySpirit,
    gLang.kAbility.HolyCircle,
    gLang.kAbility.Confiteor,
  ]);
}

let kMeleeWithMpJobs = ['BRD', 'DRK', 'PLD'];

function doesJobNeedMPBar(job) {
  return Util.isCasterJob(job) || kMeleeWithMpJobs.indexOf(job) >= 0;
}

function computeBackgroundColorFrom(element, classList) {
  let div = document.createElement('div');
  let classes = classList.split('.');
  for (let i = 0; i < classes.length; ++i)
    div.classList.add(classes[i]);
  element.appendChild(div);
  let color = window.getComputedStyle(div).backgroundColor;
  element.removeChild(div);
  return color;
}

function makeAuraTimerIcon(name, seconds, opacity, iconWidth, iconHeight, iconText,
    barHeight, textHeight, textColor, borderSize, borderColor, barColor, auraIcon) {
  let div = document.createElement('div');
  div.style.opacity = opacity;

  let icon = document.createElement('timer-icon');
  icon.width = iconWidth;
  icon.height = iconHeight;
  icon.bordersize = borderSize;
  icon.textcolor = textColor;
  div.appendChild(icon);

  let barDiv = document.createElement('div');
  barDiv.style.position = 'relative';
  barDiv.style.top = iconHeight;
  div.appendChild(barDiv);

  if (seconds >= 0) {
    let bar = document.createElement('timer-bar');
    bar.width = iconWidth;
    bar.height = barHeight;
    bar.fg = barColor;
    bar.duration = seconds;
    barDiv.appendChild(bar);
  }

  if (textHeight > 0) {
    let text = document.createElement('div');
    text.classList.add('text');
    text.style.width = iconWidth;
    text.style.height = textHeight;
    text.style.overflow = 'hidden';
    text.style.fontSize = textHeight - 1;
    text.style.whiteSpace = 'pre';
    text.style.position = 'relative';
    text.style.top = iconHeight;
    text.style.fontFamily = 'arial';
    text.style.fontWeight = 'bold';
    text.style.color = textColor;
    text.style.textShadow = '-1px 0 3px black, 0 1px 3px black, 1px 0 3px black, 0 -1px 3px black';
    text.style.paddingBottom = textHeight / 4;

    text.innerText = name;
    div.appendChild(text);
  }

  if (iconText)
    icon.text = iconText;
  icon.bordercolor = borderColor;
  icon.icon = auraIcon;
  icon.duration = seconds;

  return div;
}

// TODO: consider using real times and not setTimeout times as these can drift.
class Buff {
  constructor(name, info, list, options) {
    this.name = name;
    this.info = info;
    this.options = options;

    // TODO: these should be different ui elements.
    // TODO: or maybe add some buffer between sections?
    this.activeList = list;
    this.cooldownList = list;
    this.readyList = list;

    // tracked auras
    this.active = null;
    this.cooldown = {};
    this.ready = {};

    // Hacky numbers to sort active > ready > cooldowns by adjusting sort keys.
    this.readySortKeyBase = 1000;
    this.cooldownSortKeyBase = 2000;
  }

  addCooldown(source, effectSeconds) {
    if (!this.info.cooldown)
      return;
    if (this.cooldown[source]) {
      // Unexpected use of the same cooldown by the same name.
      this.cooldown[source].removeCallback();
    }

    let cooldownKey = 'c:' + this.name + ':' + source;

    let secondsUntilShow = this.info.cooldown - this.options.BigBuffShowCooldownSeconds;
    secondsUntilShow = Math.min(Math.max(effectSeconds, secondsUntilShow), this.info.cooldown);
    let showSeconds = this.info.cooldown - secondsUntilShow;
    let addReadyCallback = () => {
      this.addReady(source);
    };

    this.cooldown[source] = this.makeAura(cooldownKey, this.cooldownList, showSeconds,
        secondsUntilShow, this.cooldownSortKeyBase, 'grey', '', 0.5, addReadyCallback);
  }

  addReady(source) {
    if (this.ready[source]) {
      // Unexpected use of the same cooldown by the same name.
      this.ready[source].removeCallback();
    }

    // TODO: if multiple sources, put people's names as text?
    // TODO: we could also count up?
    let txt = '';
    let color = this.info.borderColor;

    let readyKey = 'r:' + this.name + ':' + source;
    this.ready[source] = this.makeAura(readyKey, this.readyList, -1, 0,
        this.readySortKeyBase, color, txt, 0.6);
  }

  makeAura(key, list, seconds, secondsUntilShow,
      adjustSort, textColor, txt, opacity, expireCallback) {
    let aura = {};
    aura.removeCallback = () => {
      list.removeElement(key);
      if (aura.addTimeout) {
        window.clearTimeout(aura.addTimeout);
        aura.addTimeout = null;
      }
      if (aura.removeTimeout) {
        window.clearTimeout(aura.removeTimeout);
        aura.removeTimeout = null;
      }
    };
    aura.addCallback = () => {
      let elem = makeAuraTimerIcon(
          key, seconds, opacity,
          this.options.BigBuffIconWidth, this.options.BigBuffIconHeight,
          txt,
          this.options.BigBuffBarHeight, this.options.BigBuffTextHeight,
          textColor,
          this.options.BigBuffBorderSize,
          this.info.borderColor, this.info.borderColor,
          this.info.icon);
      list.addElement(key, elem, this.info.sortKey + adjustSort);
      aura.addTimeout = null;

      if (seconds > 0) {
        aura.removeTimeout = window.setTimeout(() => {
          aura.removeCallback();
          if (expireCallback)
            expireCallback();
        }, seconds * 1000);
      }
    };
    aura.removeTimeout = null;

    if (secondsUntilShow > 0)
      aura.addTimeout = window.setTimeout(aura.addCallback, secondsUntilShow * 1000);
    else
      aura.addCallback();


    return aura;
  }

  clear() {
    this.onLose();

    let cooldownKeys = Object.keys(this.cooldown);
    for (let i = 0; i < cooldownKeys.length; ++i)
      this.cooldown[cooldownKeys[i]].removeCallback();

    let readyKeys = Object.keys(this.ready);
    for (let i = 0; i < readyKeys.length; ++i)
      this.ready[readyKeys[i]].removeCallback();
  }

  onGain(seconds, source) {
    this.onLose();

    let ready = this.ready[source];
    if (ready)
      ready.removeCallback();
    let cooldown = this.cooldown[source];
    if (cooldown)
      cooldown.removeCallback();

    this.active = this.makeAura(this.name, this.activeList, seconds, 0, 0, 'white', '', 1);
    this.addCooldown(source, seconds);
  }

  onLose() {
    if (!this.active)
      return;
    this.active.removeCallback();
    this.active = null;
  }
}

class BuffTracker {
  constructor(options, leftBuffDiv, rightBuffDiv) {
    this.options = options;
    this.leftBuffDiv = leftBuffDiv;
    this.rightBuffDiv = rightBuffDiv;
    this.buffs = {};

    this.buffInfo = {
      potion: {
        gainEffect: gLang.kEffect.Medicated,
        loseEffect: gLang.kEffect.Medicated,
        useEffectDuration: true,
        icon: '../../resources/icon/status/potion.png',
        borderColor: '#AA41B2',
        sortKey: 0,
        cooldown: 270,
      },
      peculiar: {
        gainAbility: gLang.kAbility.PeculiarLight,
        durationSeconds: 10,
        icon: '../../resources/icon/status/peculiar-light.png',
        borderColor: '#F28F7B',
        sortKey: 1,
        cooldown: 60,
      },
      trick: {
        // The flags encode positional data, but the exact specifics are unclear.
        // Trick attack missed appears to be "710?03" but correct is "20710?03".
        gainAbility: gLang.kAbility.TrickAttack,
        gainRegex: gLang.abilityRegex(gLang.kAbility.TrickAttack, null, null, '2.......'),
        durationSeconds: 10,
        icon: '../../resources/icon/status/trick-attack.png',
        // Magenta.
        borderColor: '#FC4AE6',
        sortKey: 1,
        cooldown: 60,
      },
      litany: {
        gainEffect: gLang.kEffect.BattleLitany,
        loseEffect: gLang.kEffect.BattleLitany,
        useEffectDuration: true,
        icon: '../../resources/icon/status/battle-litany.png',
        // Cyan.
        borderColor: '#099',
        sortKey: 2,
        cooldown: 180,
      },
      embolden: {
        // Embolden is special and has some extra text at the end, depending on embolden stage:
        // Potato Chippy gains the effect of Embolden from Tater Tot for 20.00 Seconds. (5)
        // Instead, use somebody using the effect on you:
        //   16:106C22EF:Tater Tot:1D60:Embolden:106C22EF:Potato Chippy:500020F:4D7: etc etc
        gainAbility: gLang.kAbility.Embolden,
        gainRegex: gLang.abilityRegex(gLang.kAbility.Embolden, null, gLang.playerName),
        loseEffect: gLang.kEffect.Embolden,
        durationSeconds: 20,
        icon: '../../resources/icon/status/embolden.png',
        // Lime.
        borderColor: '#57FC4A',
        sortKey: 3,
        cooldown: 120,
      },
      arrow: {
        gainEffect: gLang.kEffect.Arrow,
        loseEffect: gLang.kEffect.Arrow,
        useEffectDuration: true,
        icon: '../../resources/icon/status/arrow.png',
        // Light Blue.
        borderColor: '#37ccee',
        sortKey: 4,
      },
      balance: {
        gainEffect: gLang.kEffect.Balance,
        loseEffect: gLang.kEffect.Balance,
        useEffectDuration: true,
        icon: '../../resources/icon/status/balance.png',
        // Orange.
        borderColor: '#ff9900',
        sortKey: 4,
      },
      bole: {
        gainEffect: gLang.kEffect.Bole,
        loseEffect: gLang.kEffect.Bole,
        useEffectDuration: true,
        icon: '../../resources/icon/status/bole.png',
        // Green.
        borderColor: '#22dd77',
        sortKey: 4,
      },
      ewer: {
        gainEffect: gLang.kEffect.Ewer,
        loseEffect: gLang.kEffect.Ewer,
        useEffectDuration: true,
        icon: '../../resources/icon/status/ewer.png',
        // Light Blue.
        borderColor: '#66ccdd',
        sortKey: 4,
      },
      spear: {
        gainEffect: gLang.kEffect.Spear,
        loseEffect: gLang.kEffect.Spear,
        useEffectDuration: true,
        icon: '../../resources/icon/status/spear.png',
        // Dark Blue.
        borderColor: '#4477dd',
        sortKey: 4,
      },
      spire: {
        gainEffect: gLang.kEffect.Spire,
        loseEffect: gLang.kEffect.Spire,
        useEffectDuration: true,
        icon: '../../resources/icon/status/spire.png',
        // Yellow.
        borderColor: '#ddd044',
        sortKey: 4,
      },
      ladyOfCrowns: {
        gainEffect: gLang.kEffect.LadyOfCrowns,
        loseEffect: gLang.kEffect.LadyOfCrowns,
        useEffectDuration: true,
        icon: '../../resources/icon/status/lady-of-crowns.png',
        // Purple.
        borderColor: '#9e5599',
        sortKey: 4,
      },
      lordOfCrowns: {
        gainEffect: gLang.kEffect.LordOfCrowns,
        loseEffect: gLang.kEffect.LordOfCrowns,
        useEffectDuration: true,
        icon: '../../resources/icon/status/lord-of-crowns.png',
        // Dark Red.
        borderColor: '#9a2222',
        sortKey: 4,
      },
      devilment: {
        gainEffect: gLang.kEffect.Devilment,
        loseEffect: gLang.kEffect.Devilment,
        durationSeconds: 20,
        icon: '../../resources/icon/status/devilment.png',
        // Dark Green.
        borderColor: '#006400',
        sortKey: 5,
        cooldown: 120,
      },
      standardFinish: {
        gainEffect: gLang.kEffect.StandardFinish,
        loseEffect: gLang.kEffect.StandardFinish,
        durationSeconds: 60,
        icon: '../../resources/icon/status/standard-finish.png',
        // Green.
        borderColor: '#32CD32',
        sortKey: 6,
      },
      technicalFinish: {
        gainEffect: gLang.kEffect.TechnicalFinish,
        loseEffect: gLang.kEffect.TechnicalFinish,
        durationSeconds: 20,
        icon: '../../resources/icon/status/technical-finish.png',
        // Dark Peach.
        borderColor: '#E0757C',
        sortKey: 6,
        cooldown: 120,
      },
      chain: {
        gainAbility: gLang.kAbility.ChainStratagem,
        durationSeconds: 15,
        icon: '../../resources/icon/status/chain-stratagem.png',
        // Blue.
        borderColor: '#4674E5',
        sortKey: 7,
        cooldown: 120,
      },
      lefteye: {
        gainEffect: gLang.kEffect.LeftEye,
        loseEffect: gLang.kEffect.LeftEye,
        useEffectDuration: true,
        icon: '../../resources/icon/status/dragon-sight.png',
        // Orange.
        borderColor: '#FA8737',
        sortKey: 8,
        cooldown: 120,
      },
      righteye: {
        gainEffect: gLang.kEffect.RightEye,
        loseEffect: gLang.kEffect.RightEye,
        useEffectDuration: true,
        icon: '../../resources/icon/status/dragon-sight.png',
        // Orange.
        borderColor: '#FA8737',
        sortKey: 8,
        cooldown: 120,
      },
      brotherhood: {
        gainEffect: gLang.kEffect.Brotherhood,
        loseEffect: gLang.kEffect.Brotherhood,
        useEffectDuration: true,
        icon: '../../resources/icon/status/brotherhood.png',
        // Dark Orange.
        borderColor: '#994200',
        sortKey: 9,
        cooldown: 90,
      },
      devotion: {
        gainEffect: gLang.kEffect.Devotion,
        loseEffect: gLang.kEffect.Devotion,
        useEffectDuration: true,
        icon: '../../resources/icon/status/devotion.png',
        // Yellow.
        borderColor: '#ffbf00',
        sortKey: 10,
        cooldown: 180,
      },
    };

    let keys = Object.keys(this.buffInfo);
    this.gainEffectMap = {};
    this.loseEffectMap = {};
    this.gainAbilityMap = {};
    for (let i = 0; i < keys.length; ++i) {
      let buff = this.buffInfo[keys[i]];
      buff.name = keys[i];

      let overrides = this.options.PerBuffOptions[buff.name] || {};
      buff.borderColor = overrides.borderColor || buff.borderColor;
      buff.icon = overrides.icon || buff.icon;
      buff.side = overrides.side || buff.side || 'right';
      buff.sortKey = overrides.sortKey || buff.sortKey;
      buff.hide = overrides.hide === undefined ? buff.hide : overrides.hide;

      if (buff.gainEffect) {
        if (buff.gainEffect in this.gainEffectMap)
          console.error('Duplicate buff entry: ' + buff.gainEffect);
        this.gainEffectMap[buff.gainEffect] = buff;
      }
      if (buff.loseEffect) {
        if (buff.loseEffect in this.loseEffectMap)
          console.error('Duplicate buff entry: ' + buff.loseEffect);
        this.loseEffectMap[buff.loseEffect] = buff;
      }
      if (buff.gainAbility) {
        if (buff.gainAbility in this.gainAbilityMap)
          console.error('Duplicate buff entry: ' + buff.gainAbility);
        this.gainAbilityMap[buff.gainAbility] = buff;
      }
    }
  }

  onUseAbility(id, log) {
    let b = this.gainAbilityMap[id];
    if (!b)
      return;

    if (b.gainRegex && !log.match(b.gainRegex))
      return;

    let seconds = b.durationSeconds;
    let source = abilitySourceFromLog(log);
    this.onBigBuff(b.name, seconds, b, source);
  }

  onYouGainEffect(name, log) {
    let b = this.gainEffectMap[name];
    if (!b)
      return;
    let seconds = -1;
    if (b.useEffectDuration)
      seconds = gainSecondsFromLog(log);
    else if ('durationSeconds' in b)
      seconds = b.durationSeconds;

    let source = gainSourceFromLog(log);
    this.onBigBuff(b.name, seconds, b, source);
  }

  onYouLoseEffect(name, log) {
    let b = this.loseEffectMap[name];
    if (!b)
      return;
    this.onLoseBigBuff(b.name, b);
  }

  onBigBuff(name, seconds, info, source) {
    if (seconds <= 0)
      return;

    let list = this.rightBuffDiv;
    if (info.side == 'left' && this.leftBuffDiv)
      list = this.leftBuffDiv;

    let buff = this.buffs[name];
    if (!buff) {
      this.buffs[name] = new Buff(name, info, list, this.options);
      buff = this.buffs[name];
    }

    buff.onGain(seconds, source);
  }

  onLoseBigBuff(name) {
    let buff = this.buffs[name];
    if (!buff)
      return;
    buff.onLose();
  }

  clear() {
    let keys = Object.keys(this.buffs);
    for (let i = 0; i < keys.length; ++i)
      this.buffs[keys[i]].clear();
  }
}

class Bars {
  constructor(options) {
    this.options = options;
    this.init = false;
    this.me = null;
    this.o = {};
    this.casting = {};
    this.job = '';
    this.hp = 0;
    this.maxHP = 0;
    this.currentShield = 0;
    this.mp = 0;
    this.prevMP = 0;
    this.maxMP = 0;
    this.level = 0;
    this.distance = -1;
    this.whiteMana = -1;
    this.blackMana = -1;
    this.oath = -1;
    this.umbralStacks = 0;
    this.inCombat = false;
    this.combo = 0;
    this.comboTimer = null;

    this.comboFuncs = [];
    this.jobFuncs = [];
    this.gainEffectFuncMap = {};
    this.loseEffectFuncMap = {};
    this.abilityFuncMap = {};
  }

  UpdateJob() {
    this.comboFuncs = [];
    this.jobFuncs = [];
    this.gainEffectFuncMap = {};
    this.loseEffectFuncMap = {};
    this.abilityFuncMap = {};

    this.gainEffectFuncMap[gLang.kEffect.WellFed] = (name, log) => {
      let seconds = gainSecondsFromLog(log);
      let now = Date.now(); // This is in ms.
      this.foodBuffExpiresTimeMs = now + (seconds * 1000);
      this.UpdateFoodBuff();
    };

    let container = document.getElementById('jobs-container');
    if (container == null) {
      let root = document.getElementById('container');
      container = document.createElement('div');
      container.id = 'jobs-container';
      root.appendChild(container);
    }
    while (container.childNodes.length)
      container.removeChild(container.childNodes[0]);

    this.o = {};

    let barsLayoutContainer = document.createElement('div');
    barsLayoutContainer.id = 'jobs';
    container.appendChild(barsLayoutContainer);

    barsLayoutContainer.classList.add(this.job.toLowerCase());
    if (Util.isTankJob(this.job))
      barsLayoutContainer.classList.add('tank');
    else if (Util.isHealerJob(this.job))
      barsLayoutContainer.classList.add('healer');
    else if (Util.isCombatJob(this.job))
      barsLayoutContainer.classList.add('dps');
    else if (Util.isCraftingJob(this.job))
      barsLayoutContainer.classList.add('crafting');
    else if (Util.isGatheringJob(this.job))
      barsLayoutContainer.classList.add('gathering');

    let pullCountdownContainer = document.createElement('div');
    pullCountdownContainer.id = 'pull-bar';
    // Pull counter not affected by opacity option.
    barsLayoutContainer.appendChild(pullCountdownContainer);
    this.o.pullCountdown = document.createElement('timer-bar');
    pullCountdownContainer.appendChild(this.o.pullCountdown);

    let opacityContainer = document.createElement('div');
    opacityContainer.id = 'opacity-container';
    barsLayoutContainer.appendChild(opacityContainer);

    // Holds health/mana.
    let barsContainer = document.createElement('div');
    barsContainer.id = 'bars';
    opacityContainer.appendChild(barsContainer);

    this.o.pullCountdown.width = window.getComputedStyle(pullCountdownContainer).width;
    this.o.pullCountdown.height = window.getComputedStyle(pullCountdownContainer).height;
    this.o.pullCountdown.lefttext = gLang.kUIStrings.Pull;
    this.o.pullCountdown.righttext = 'remain';
    this.o.pullCountdown.hideafter = 0;
    this.o.pullCountdown.fg = 'rgb(255, 120, 120)';

    this.o.rightBuffsContainer = document.createElement('div');
    this.o.rightBuffsContainer.id = 'right-side-icons';
    barsContainer.appendChild(this.o.rightBuffsContainer);

    this.o.rightBuffsList = document.createElement('widget-list');
    this.o.rightBuffsContainer.appendChild(this.o.rightBuffsList);

    this.o.rightBuffsList.rowcolsize = 7;
    this.o.rightBuffsList.maxnumber = 7;
    this.o.rightBuffsList.toward = 'right down';
    this.o.rightBuffsList.elementwidth = this.options.BigBuffIconWidth + 2;

    if (this.options.JustBuffTracker) {
      // Just alias these two together so the rest of the code doesn't have
      // to care that they're the same thing.
      this.o.leftBuffsList = this.o.rightBuffsList;
      this.o.rightBuffsList.rowcolsize = 20;
      this.o.rightBuffsList.maxnumber = 20;
      // Hoist the buffs up to hide everything else.
      barsLayoutContainer.appendChild(this.o.rightBuffsContainer);
      barsLayoutContainer.classList.add('justbuffs');
    } else {
      this.o.leftBuffsContainer = document.createElement('div');
      this.o.leftBuffsContainer.id = 'left-side-icons';
      barsContainer.appendChild(this.o.leftBuffsContainer);

      this.o.leftBuffsList = document.createElement('widget-list');
      this.o.leftBuffsContainer.appendChild(this.o.leftBuffsList);

      this.o.leftBuffsList.rowcolsize = 7;
      this.o.leftBuffsList.maxnumber = 7;
      this.o.leftBuffsList.toward = 'left down';
      this.o.leftBuffsList.elementwidth = this.options.BigBuffIconWidth + 2;
    }

    this.buffTracker = new BuffTracker(this.options, this.o.leftBuffsList, this.o.rightBuffsList);

    if (Util.isCraftingJob(this.job)) {
      this.o.cpContainer = document.createElement('div');
      this.o.cpContainer.id = 'cp-bar';
      barsContainer.appendChild(this.o.cpContainer);
      this.o.cpBar = document.createElement('resource-bar');
      this.o.cpContainer.appendChild(this.o.cpBar);
      this.o.cpBar.width = window.getComputedStyle(this.o.cpContainer).width;
      this.o.cpBar.height = window.getComputedStyle(this.o.cpContainer).height;
      this.o.cpBar.centertext = 'maxvalue';
      this.o.cpBar.bg = computeBackgroundColorFrom(this.o.cpBar, 'bar-border-color');
      this.o.cpBar.fg = computeBackgroundColorFrom(this.o.cpBar, 'cp-color');
      return;
    } else if (Util.isGatheringJob(this.job)) {
      this.o.gpContainer = document.createElement('div');
      this.o.gpContainer.id = 'gp-bar';
      barsContainer.appendChild(this.o.gpContainer);
      this.o.gpBar = document.createElement('resource-bar');
      this.o.gpContainer.appendChild(this.o.gpBar);
      this.o.gpBar.width = window.getComputedStyle(this.o.gpContainer).width;
      this.o.gpBar.height = window.getComputedStyle(this.o.gpContainer).height;
      this.o.gpBar.centertext = 'maxvalue';
      this.o.gpBar.bg = computeBackgroundColorFrom(this.o.gpBar, 'bar-border-color');
      this.o.gpBar.fg = computeBackgroundColorFrom(this.o.gpBar, 'gp-color');
      return;
    }

    let showHPNumber = this.options.ShowHPNumber.indexOf(this.job) >= 0;
    let showMPNumber = this.options.ShowMPNumber.indexOf(this.job) >= 0;
    let showMPTicker = this.options.ShowMPTicker.indexOf(this.job) >= 0;

    let healthText = showHPNumber ? 'value' : '';
    let manaText = showMPNumber ? 'value' : '';

    this.o.healthContainer = document.createElement('div');
    this.o.healthContainer.id = 'hp-bar';
    if (showHPNumber)
      this.o.healthContainer.classList.add('show-number');
    barsContainer.appendChild(this.o.healthContainer);

    this.o.healthBar = document.createElement('resource-bar');
    this.o.healthContainer.appendChild(this.o.healthBar);
    // TODO: Let the component do this dynamically.
    this.o.healthBar.width = window.getComputedStyle(this.o.healthContainer).width;
    this.o.healthBar.height = window.getComputedStyle(this.o.healthContainer).height;
    this.o.healthBar.lefttext = healthText;
    this.o.healthBar.bg = computeBackgroundColorFrom(this.o.healthBar, 'bar-border-color');

    if (doesJobNeedMPBar(this.job)) {
      this.o.manaContainer = document.createElement('div');
      this.o.manaContainer.id = 'mp-bar';
      barsContainer.appendChild(this.o.manaContainer);
      if (showMPNumber)
        this.o.manaContainer.classList.add('show-number');

      this.o.manaBar = document.createElement('resource-bar');
      this.o.manaContainer.appendChild(this.o.manaBar);
      // TODO: Let the component do this dynamically.
      this.o.manaBar.width = window.getComputedStyle(this.o.manaContainer).width;
      this.o.manaBar.height = window.getComputedStyle(this.o.manaContainer).height;
      this.o.manaBar.lefttext = manaText;
      this.o.manaBar.bg = computeBackgroundColorFrom(this.o.manaBar, 'bar-border-color');
    }

    if (showMPTicker) {
      this.o.mpTickContainer = document.createElement('div');
      this.o.mpTickContainer.id = 'mp-tick';
      barsContainer.appendChild(this.o.mpTickContainer);

      this.o.mpTicker = document.createElement('timer-bar');
      this.o.mpTickContainer.appendChild(this.o.mpTicker);
      this.o.mpTicker.width = window.getComputedStyle(this.o.mpTickContainer).width;
      this.o.mpTicker.height = window.getComputedStyle(this.o.mpTickContainer).height;
      this.o.mpTicker.bg = computeBackgroundColorFrom(this.o.mpTicker, 'bar-border-color');
      this.o.mpTicker.style = 'fill';
      this.o.mpTicker.loop = true;
    }

    let setup = {
      'RDM': this.setupRdm,
      'WAR': this.setupWar,
      'DRK': this.setupDrk,
      'PLD': this.setupPld,
      'AST': this.setupAst,
      'BLU': this.setupBlu,
      'MNK': this.setupMnk,
      'BLM': this.setupBlm,
    };
    if (setup[this.job])
      setup[this.job].bind(this)();
  }

  addJobBarContainer() {
    let id = this.job.toLowerCase() + '-bar';
    let container = document.getElementById(id);
    if (!container) {
      container = document.createElement('div');
      container.id = id;
      document.getElementById('bars').appendChild(container);
    }
    return container;
  }

  addJobBoxContainer() {
    let id = this.job.toLowerCase() + '-boxes';
    let boxes = document.getElementById(id);
    if (!boxes) {
      boxes = document.createElement('div');
      boxes.id = id;
      document.getElementById('bars').appendChild(boxes);
    }
    return boxes;
  }

  addResourceBox(options) {
    let boxes = this.addJobBoxContainer();
    let boxDiv = document.createElement('div');
    if (options.classList) {
      for (let i = 0; i < options.classList.length; ++i)
        boxDiv.classList.add(options.classList[i]);
    }
    boxes.appendChild(boxDiv);

    let textDiv = document.createElement('div');
    boxDiv.appendChild(textDiv);
    textDiv.classList.add('text');

    return textDiv;
  }

  addProcBox(options) {
    let id = this.job.toLowerCase() + '-procs';

    let container = document.getElementById(id);
    if (!container) {
      container = document.createElement('div');
      container.id = id;
      document.getElementById('bars').appendChild(container);
    }

    let timerBox = document.createElement('timer-box');
    container.appendChild(timerBox);
    timerBox.style = 'empty';
    if (options.fgColor)
      timerBox.fg = computeBackgroundColorFrom(timerBox, options.fgColor);
    timerBox.bg = 'black';
    timerBox.toward = 'bottom';
    timerBox.threshold = options.threshold ? options.threshold : 0;
    timerBox.hideafter = '';
    timerBox.roundupthreshold = false;
    timerBox.valuescale = options.scale ? options.scale : 1;
    if (options.id)
      timerBox.id = options.id;

    return timerBox;
  }

  addTimerBar(options) {
    let container = this.addJobBarContainer();

    let timerDiv = document.createElement('div');
    timerDiv.id = options.id;
    let timer = document.createElement('timer-bar');
    container.appendChild(timerDiv);
    timerDiv.appendChild(timer);

    timer.width = window.getComputedStyle(timerDiv).width;
    timer.height = window.getComputedStyle(timerDiv).height;
    timer.toward = 'left';
    timer.bg = computeBackgroundColorFrom(timer, 'bar-border-color');
    if (options.fgColor)
      timer.fg = computeBackgroundColorFrom(timer, options.fgColor);

    return timer;
  }

  addResourceBar(options) {
    let container = this.addJobBarContainer();

    let barDiv = document.createElement('div');
    barDiv.id = options.id;
    let bar = document.createElement('resource-bar');
    container.appendChild(barDiv);
    barDiv.appendChild(bar);

    bar.bg = 'rgba(0, 0, 0, 0)';
    bar.fg = computeBackgroundColorFrom(bar, options.fgColor);
    bar.width = window.getComputedStyle(barDiv).width;
    bar.height = window.getComputedStyle(barDiv).height;
    bar.maxvalue = options.maxvalue;

    return bar;
  }

  setupWar() {
    let gcd = this.options.WarGcd;

    let textBox = this.addResourceBox({
      classList: ['war-color-beast'],
    });

    this.jobFuncs.push((jobDetail) => {
      let beast = jobDetail.beast;
      if (textBox.innerText === beast)
        return;
      textBox.innerText = beast;
      let p = textBox.parentNode;
      if (beast < 50) {
        p.classList.add('low');
        p.classList.remove('mid');
      } else if (beast < 100) {
        p.classList.remove('low');
        p.classList.add('mid');
      } else {
        p.classList.remove('low');
        p.classList.remove('mid');
      }
    });

    let eyeBox = this.addProcBox({
      fgColor: 'war-color-eye',
      scale: gcd,
    });

    this.comboFuncs.push((skill) => {
      // TODO: handle flags where you don't hit something.
      // flags are 0 if hit nothing, 710003 if not in combo, 32710003 if good.
      if (skill == gLang.kAbility.MythrilTempest) {
        if (eyeBox.duration > 0) {
          let old = parseFloat(eyeBox.duration) - parseFloat(eyeBox.elapsed);
          eyeBox.duration = 0;
          eyeBox.duration = Math.min(old + 10, 30);
        }
        return;
      }
      if (skill == gLang.kAbility.StormsEye) {
        eyeBox.duration = 0;
        // Storm's Eye applies with some animation delay here, and on the next
        // Storm's Eye, it snapshots the damage when the gcd is started, so
        // add some of a gcd here in duration time from when it's applied.
        eyeBox.duration = 30 + 1;
      }

      // Min number of skills until eye without breaking combo.
      let minSkillsUntilEye;
      if (skill == gLang.kAbility.HeavySwing) {
        minSkillsUntilEye = 2;
      } else if (skill == gLang.kAbility.SkullSunder) {
        minSkillsUntilEye = 4;
      } else if (skill == gLang.kAbility.Maim) {
        minSkillsUntilEye = 1;
      } else {
        // End of combo, or broken combo.
        minSkillsUntilEye = 3;
      }

      // The new threshold is "can I finish the current combo and still
      // have time to do a Storm's Eye".
      let oldThreshold = parseFloat(eyeBox.threshold);
      let newThreshold = (minSkillsUntilEye + 2) * gcd;

      // Because thresholds are nonmonotonic (when finishing a combo)
      // be careful about setting them in ways that are visually poor.
      if (eyeBox.value >= oldThreshold &&
          eyeBox.value >= newThreshold)
        eyeBox.threshold = newThreshold;
      else
        eyeBox.threshold = oldThreshold;
    });

    this.loseEffectFuncMap[gLang.kEffect.StormsEye] = () => {
      // Because storm's eye is tracked from the hit, and the ability is delayed,
      // you can have the sequence: Storm's Eye (ability), loses effect, gains effect.
      // To fix this, don't "lose" unless it's been going on a bit.
      if (eyeBox.elapsed > 10)
        eyeBox.duration = 0;
    };
  }

  setupDrk() {
    let bloodBox = this.addResourceBox({
      classList: ['drk-color-blood'],
    });

    let darksideBox = this.addProcBox({
      fgColor: 'drk-color-darkside',
      threshold: 10,
    });

    this.jobFuncs.push((jobDetail) => {
      let blood = jobDetail.blood;
      if (bloodBox.innerText === blood)
        return;
      bloodBox.innerText = blood;
      let p = bloodBox.parentNode;
      if (blood < 50) {
        p.classList.add('low');
        p.classList.remove('mid');
      } else if (blood < 90) {
        p.classList.remove('low');
        p.classList.add('mid');
      } else {
        p.classList.remove('low');
        p.classList.remove('mid');
      }

      let oldSeconds = parseFloat(darksideBox.duration) - parseFloat(darksideBox.elapsed);
      let seconds = jobDetail.darksideMilliseconds / 1000.0;
      if (!darksideBox.duration || seconds > oldSeconds) {
        darksideBox.duration = 0;
        darksideBox.duration = seconds;
      }
    });
  }

  setupPld() {
    let gcd = this.options.PldGcd;

    let textBox = this.addResourceBox({
      classList: ['pld-color-oath'],
    });

    this.jobFuncs.push((jobDetail) => {
      let oath = jobDetail.oath;
      if (textBox.innerText === oath)
        return;
      textBox.innerText = oath;
      let p = textBox.parentNode;
      if (oath < 50) {
        p.classList.add('low');
        p.classList.remove('mid');
      } else if (blood < 100) {
        p.classList.remove('low');
        p.classList.add('mid');
      } else {
        p.classList.remove('low');
        p.classList.remove('mid');
      }
    });

    let goreBox = this.addProcBox({
      fgColor: 'pld-color-gore',
      scale: gcd,
      threshold: gcd * 3 + 0.3,
    });

    this.comboFuncs.push((skill) => {
      if (skill == gLang.kAbility.GoringBlade) {
        goreBox.duration = 0;
        // Technically, goring blade is 21, but 2.43 * 9 = 21.87, so if you
        // have the box show 21, it looks like you're awfully late with
        // your goring blade and just feels really bad.  So, lie to the
        // poor paladins who don't have enough skill speed so that the UI
        // is easier to read for repeating goring, royal, royal, goring
        // and not having the box run out early.
        goreBox.duration = 22;
      }
    });
  }

  setupBlu() {
    let gcd = this.options.BluGcd;

    let offguardBox = this.addProcBox({
      id: 'blu-procs-offguard',
      fgColor: 'blu-color-offguard',
      scale: gcd,
      threshold: gcd * 3,
    });

    let tormentBox = this.addProcBox({
      id: 'blu-procs-torment',
      fgColor: 'blu-color-torment',
      scale: gcd,
      threshold: gcd * 3,
    });

    this.abilityFuncMap[gLang.kAbility.OffGuard] = () => {
      offguardBox.duration = 0;
      offguardBox.duration = 30;
    };
    this.abilityFuncMap[gLang.kAbility.SongOfTorment] = () => {
      tormentBox.duration = 0;
      tormentBox.duration = 30;
    };
  }

  // TODO: none of this is actually super useful.
  setupAst() {
    let gcd = this.options.AstGcd;

    let combustBox = this.addProcBox({
      id: 'ast-procs-combust',
      fgColor: 'ast-color-combust',
      scale: gcd,
      threshold: gcd * 3,
    });

    let beneficBox = this.addProcBox({
      id: 'ast-procs-benefic',
      fgColor: 'ast-color-benefic',
      scale: gcd,
      threshold: gcd * 3,
    });

    let heliosBox = this.addProcBox({
      id: 'ast-procs-helios',
      fgColor: 'ast-color-helios',
      scale: gcd,
      threshold: gcd * 3,
    });

    // Sorry, no differentation for noct asts here.  <_<
    this.abilityFuncMap[gLang.kAbility.Combust2] = () => {
      combustBox.duration = 0;
      combustBox.duration = 30;
    };
    this.abilityFuncMap[gLang.kAbility.AspectedBenefic] = () => {
      beneficBox.duration = 0;
      beneficBox.duration = 18;
    };
    this.abilityFuncMap[gLang.kAbility.AspectedHelios] = () => {
      heliosBox.duration = 0;
      heliosBox.duration = 30;
    };
  }

  setupMnk() {
    let lightningTimer = this.addTimerBar({
      id: 'mnk-timers-lightning',
      fgColor: 'mnk-color-lightning-0',
    });

    let formTimer = this.addTimerBar({
      id: 'mnk-timers-combo',
      fgColor: 'mnk-color-form',
    });

    let textBox = this.addResourceBox({
      classList: ['mnk-color-chakra'],
    });

    let lightningFgColors = [];
    for (let i = 0; i <= 3; ++i)
      lightningFgColors.push(computeBackgroundColorFrom(lightningTimer, 'mnk-color-lightning-' + i));

    this.jobFuncs.push((jobDetail) => {
      let chakra = jobDetail.chakraStacks;
      if (textBox.innerText !== chakra) {
        textBox.innerText = chakra;
        let p = textBox.parentNode;
        if (chakra < 5)
          p.classList.add('dim');
        else
          p.classList.remove('dim');
      }

      let stacks = jobDetail.lightningStacks;
      lightningTimer.fg = lightningFgColors[stacks];
      if (stacks == 0) {
        // Show sad red bar when you've lost all your pancakes.
        lightningTimer.style = 'fill';
        lightningTimer.value = 0;
        lightningTimer.duration = 0;
      } else {
        lightningTimer.style = 'empty';

        // Setting the duration resets the timer bar to 0, so set
        // duration first before adjusting the value.
        let old = parseFloat(lightningTimer.duration) - parseFloat(lightningTimer.elapsed);
        let lightningSeconds = jobDetail.lightningMilliseconds / 1000.0;
        if (lightningSeconds > old) {
          lightningTimer.duration = 16;
          lightningTimer.value = lightningSeconds;
        }
      }
    });

    let dragonKickBox = this.addProcBox({
      id: 'mnk-procs-dragonkick',
      fgColor: 'mnk-color-dragonkick',
      threshold: 6,
    });

    let twinSnakesBox = this.addProcBox({
      id: 'mnk-procs-twinsnakes',
      fgColor: 'mnk-color-twinsnakes',
      threshold: 6,
    });

    let demolishBox = this.addProcBox({
      id: 'mnk-procs-demolish',
      fgColor: 'mnk-color-demolish',
      // Slightly shorter time, to make the box not pop right as
      // you hit snap punch at t=6 (which is probably fine).
      threshold: 5,
    });

    this.abilityFuncMap[gLang.kAbility.TwinSnakes] = () => {
      twinSnakesBox.duration = 0;
      twinSnakesBox.duration = 15;
    };
    this.abilityFuncMap[gLang.kAbility.FourPointFury] = () => {
      // FIXME: using this at zero.
      let old = parseFloat(twinSnakesBox.duration) - parseFloat(twinSnakesBox.elapsed);
      twinSnakesBox.duration = 0;
      if (old > 0)
        twinSnakesBox.duration = Math.min(old + 10, 15);
    };
    this.abilityFuncMap[gLang.kAbility.Demolish] = () => {
      demolishBox.duration = 0;
      demolishBox.duration = 18;
    };
    this.gainEffectFuncMap[gLang.kEffect.LeadenFist] = () => {
      dragonKickBox.duration = 0;
      dragonKickBox.duration = 30;
    };
    this.loseEffectFuncMap[gLang.kEffect.LeadenFist] = () => dragonKickBox.duration = 0;
    this.gainEffectFuncMap[gLang.kEffect.PerfectBalance] = (name, log) => {
      formTimer.duration = 0;
      formTimer.duration = gainSecondsFromLog(log);
      formTimer.fg = computeBackgroundColorFrom(formTimer, 'mnk-color-pb');
    };

    let changeFormFunc = (name, log) => {
      formTimer.duration = 0;
      formTimer.duration = gainSecondsFromLog(log);
      formTimer.fg = computeBackgroundColorFrom(formTimer, 'mnk-color-form');
    };
    this.gainEffectFuncMap[gLang.kEffect.OpoOpoForm] = changeFormFunc;
    this.gainEffectFuncMap[gLang.kEffect.RaptorForm] = changeFormFunc;
    this.gainEffectFuncMap[gLang.kEffect.CoeurlForm] = changeFormFunc;
  }

  setupRdm() {
    let container = this.addJobBarContainer();

    let incs = 20;
    for (let i = 0; i < 100; i += incs) {
      let marker = document.createElement('div');
      marker.classList.add('marker');
      marker.classList.add((i % 40 == 0) ? 'odd' : 'even');
      container.appendChild(marker);
      marker.style.left = i + '%';
      marker.style.width = incs + '%';
    }

    let whiteManaBar = this.addResourceBar({
      id: 'rdm-white-bar',
      fgColor: 'rdm-color-white-mana',
      maxvalue: 100,
    });

    let blackManaBar = this.addResourceBar({
      id: 'rdm-black-bar',
      fgColor: 'rdm-color-black-mana',
      maxvalue: 100,
    });

    let whiteManaBox = this.addResourceBox({
      classList: ['rdm-color-white-mana'],
    });

    let blackManaBox = this.addResourceBox({
      classList: ['rdm-color-black-mana'],
    });

    let whiteProc = this.addProcBox({
      id: 'rdm-procs-white',
      fgColor: 'rdm-color-white-mana',
      threshold: 1000,
    });
    whiteProc.bigatzero = false;
    let blackProc = this.addProcBox({
      id: 'rdm-procs-black',
      fgColor: 'rdm-color-black-mana',
      threshold: 1000,
    });
    blackProc.bigatzero = false;
    let impactProc = this.addProcBox({
      id: 'rdm-procs-impact',
      fgColor: 'rdm-color-impact',
      threshold: 1000,
    });
    impactProc.bigatzero = false;

    this.jobFuncs.push(function(jobDetail) {
      let white = jobDetail.whiteMana;
      let black = jobDetail.blackMana;

      whiteManaBar.value = white;
      blackManaBar.value = black;

      if (whiteManaBox.innerText !== white) {
        whiteManaBox.innerText = white;
        let p = whiteManaBox.parentNode;
        if (white < 80)
          p.classList.add('dim');
        else
          p.classList.remove('dim');
      }
      if (blackManaBox.innerText !== black) {
        blackManaBox.innerText = black;
        let p = blackManaBox.parentNode;
        if (black < 80)
          p.classList.add('dim');
        else
          p.classList.remove('dim');
      }
    });

    this.gainEffectFuncMap[gLang.kEffect.VerstoneReady] = (name, log) => {
      whiteProc.duration = 0;
      whiteProc.duration = gainSecondsFromLog(log) - this.options.RdmCastTime;
    };
    this.loseEffectFuncMap[gLang.kEffect.VerstoneReady] = () => whiteProc.duration = 0;
    this.gainEffectFuncMap[gLang.kEffect.VerfireReady] = (name, log) => {
      blackProc.duration = 0;
      blackProc.duration = gainSecondsFromLog(log) - this.options.RdmCastTime;
    };
    this.loseEffectFuncMap[gLang.kEffect.VerfireReady] = () => blackProc.duration = 0;
    this.gainEffectFuncMap[gLang.kEffect.Impactful] = (name, log) => {
      impactfulProc.duration = 0;
      impactfulProc = gainSecondsFromLog(log) - this.options.RdmCastTime;
    };
    this.loseEffectFuncMap[gLang.kEffect.Impactful] = () => impactfulProc.duration = 0;
  }

  setupBlm() {
    let thunderDot = this.addProcBox({
      id: 'blm-dot-thunder',
      fgColor: 'blm-color-dot',
      threshold: 4,
    });
    let thunderProc = this.addProcBox({
      id: 'blm-procs-thunder',
      fgColor: 'blm-color-thunder',
      threshold: 1000,
    });
    thunderProc.bigatzero = false;
    let fireProc = this.addProcBox({
      id: 'blm-procs-fire',
      fgColor: 'blm-color-fire',
      threshold: 1000,
    });
    fireProc.bigatzero = false;

    // This could have two boxes here for the rare case where you
    // have two long-lived enemies, but it's an edge case that
    // maybe only makes sense in ucob?
    this.abilityFuncMap[gLang.kAbility.Thunder1] = () => {
      thunderDot.duration = 0;
      thunderDot.duration = 18;
    };
    this.abilityFuncMap[gLang.kAbility.Thunder2] = () => {
      thunderDot.duration = 0;
      thunderDot.duration = 12;
    };
    this.abilityFuncMap[gLang.kAbility.Thunder3] = () => {
      thunderDot.duration = 0;
      thunderDot.duration = 24;
    };
    this.abilityFuncMap[gLang.kAbility.Thunder4] = () => {
      thunderDot.duration = 0;
      thunderDot.duration = 18;
    };

    this.gainEffectFuncMap[gLang.kEffect.Thundercloud] = (name, log) => {
      thunderProc.duration = 0;
      thunderProc.duration = gainSecondsFromLog(log);
    };
    this.loseEffectFuncMap[gLang.kEffect.Thundercloud] = () => thunderProc.duration = 0;

    this.gainEffectFuncMap[gLang.kEffect.Firestarter] = (name, log) => {
      fireProc.duration = 0;
      fireProc.duration = gainSecondsFromLog(log);
    };
    this.loseEffectFuncMap[gLang.kEffect.Firestarter] = () => fireProc.duration = 0;

    // It'd be super nice to use grid here.
    // Maybe some day when cactbot uses new cef.
    let stacksContainer = document.createElement('div');
    stacksContainer.id = 'blm-stacks';
    this.addJobBarContainer().appendChild(stacksContainer);

    let heartStacksContainer = document.createElement('div');
    heartStacksContainer.id = 'blm-stacks-heart';
    stacksContainer.appendChild(heartStacksContainer);
    let heartStacks = [];
    for (let i = 0; i < 3; ++i) {
      let d = document.createElement('div');
      heartStacksContainer.appendChild(d);
      heartStacks.push(d);
    }

    let xenoStacksContainer = document.createElement('div');
    xenoStacksContainer.id = 'blm-stacks-xeno';
    stacksContainer.appendChild(xenoStacksContainer);
    let xenoStacks = [];
    for (let i = 0; i < 2; ++i) {
      let d = document.createElement('div');
      xenoStacksContainer.appendChild(d);
      xenoStacks.push(d);
    }

    let umbralTimer = this.addResourceBox({
      classList: ['blm-umbral-timer'],
    });
    let xenoTimer = this.addResourceBox({
      classList: ['blm-xeno-timer'],
    });

    this.jobFuncs.push((jobDetail) => {
      if (this.umbralStacks != jobDetail.umbralStacks) {
        this.umbralStacks = jobDetail.umbralStacks;
        this.UpdateMPTicker();
      }
      let fouls = jobDetail.foulCount;
      for (let i = 0; i < 2; ++i) {
        if (fouls > i)
          xenoStacks[i].classList.add('active');
        else
          xenoStacks[i].classList.remove('active');
      }
      let hearts = jobDetail.umbralHearts;
      for (let i = 0; i < 3; ++i) {
        if (hearts > i)
          heartStacks[i].classList.add('active');
        else
          heartStacks[i].classList.remove('active');
      }

      let stacks = jobDetail.umbralStacks;
      let seconds = Math.ceil(jobDetail.umbralMilliseconds / 1000.0);
      let p = umbralTimer.parentNode;
      if (!stacks) {
        umbralTimer.innerText = '';
        p.classList.remove('fire');
        p.classList.remove('ice');
      } else if (stacks > 0) {
        umbralTimer.innerText = seconds;
        p.classList.add('fire');
        p.classList.remove('ice');
      } else {
        umbralTimer.innerText = seconds;
        p.classList.remove('fire');
        p.classList.add('ice');
      }

      if (!jobDetail.enochian) {
        xenoTimer.innerText = '';
        xenoTimer.parentNode.classList.remove('active');
      } else {
        xenoTimer.innerText = Math.ceil(jobDetail.nextPolygotMilliseconds / 1000.0);
        xenoTimer.parentNode.classList.add('active');
      }
    });
  }

  OnComboChange(skill) {
    for (let i = 0; i < this.comboFuncs.length; ++i)
      this.comboFuncs[i](skill);
  }

  UpdateHealth() {
    if (!this.o.healthBar) return;
    this.o.healthBar.value = this.hp;
    this.o.healthBar.maxvalue = this.maxHP;
    this.o.healthBar.extraValue = this.currentShield;

    let percent = (this.hp + this.currentShield) / this.maxHP;

    if (this.maxHP > 0 && percent < this.options.LowHealthThresholdPercent)
      this.o.healthBar.fg = computeBackgroundColorFrom(this.o.healthBar, 'hp-color.low');
    else if (this.maxHP > 0 && percent < this.options.MidHealthThresholdPercent)
      this.o.healthBar.fg = computeBackgroundColorFrom(this.o.healthBar, 'hp-color.mid');
    else
      this.o.healthBar.fg = computeBackgroundColorFrom(this.o.healthBar, 'hp-color');
  }

  UpdateMPTicker() {
    if (!this.o.mpTicker) return;
    let delta = this.mp - this.prevMP;
    this.prevMP = this.mp;

    // Hide out of combat if requested
    if (!this.options.ShowMPTickerOutOfCombat && !this.inCombat) {
      this.o.mpTicker.duration = 0;
      this.o.mpTicker.style = 'empty';
      return;
    }
    this.o.mpTicker.style = 'fill';

    let baseTick = this.inCombat ? kMPCombatRate : kMPNormalRate;
    let umbralTick = 0;
    if (this.umbralStacks == -1) umbralTick = kMPUI1Rate;
    if (this.umbralStacks == -2) umbralTick = kMPUI2Rate;
    if (this.umbralStacks == -3) umbralTick = kMPUI3Rate;

    let mpTick = Math.floor(this.maxMP * baseTick) + Math.floor(this.maxMP * umbralTick);
    if (delta == mpTick && this.umbralStacks <= 0) // MP ticks disabled in AF
      this.o.mpTicker.duration = kMPTickInterval;

    // Update color based on the astral fire/ice state
    let colorTag = 'mp-tick-color';
    if (this.umbralStacks < 0) colorTag = 'mp-tick-color.ice';
    if (this.umbralStacks > 0) colorTag = 'mp-tick-color.fire';
    this.o.mpTicker.fg = computeBackgroundColorFrom(this.o.mpTicker, colorTag);
  }

  UpdateMana() {
    this.UpdateMPTicker();

    if (!this.o.manaBar) return;
    this.o.manaBar.value = this.mp;
    this.o.manaBar.maxvalue = this.maxMP;
    let lowMP = -1;
    let mediumMP = -1;
    let far = -1;

    if (this.job == 'RDM' || this.job == 'BLM' || this.job == 'SMN' || this.job == 'ACN')
      far = this.options.FarThresholdOffence;

    if (this.job == 'DRK') {
      lowMP = this.options.DrkLowMPThreshold;
      mediumMP = this.options.DrkMediumMPThreshold;
    } else if (this.job == 'PLD') {
      lowMP = this.options.PldLowMPThreshold;
      mediumMP = this.options.PldMediumMPThreshold;
    } else if (this.job == 'BLM') {
      lowMP = this.options.BlmLowMPThreshold;
    }

    if (far >= 0 && this.distance > far)
      this.o.manaBar.fg = computeBackgroundColorFrom(this.o.manaBar, 'mp-color.far');
    else if (lowMP >= 0 && this.mp <= lowMP)
      this.o.manaBar.fg = computeBackgroundColorFrom(this.o.manaBar, 'mp-color.low');
    else if (mediumMP >= 0 && this.mp <= mediumMP)
      this.o.manaBar.fg = computeBackgroundColorFrom(this.o.manaBar, 'mp-color.medium');
    else
      this.o.manaBar.fg = computeBackgroundColorFrom(this.o.manaBar, 'mp-color');
  }

  UpdateCP() {
    if (!this.o.cpBar) return;
    this.o.cpBar.value = this.cp;
    this.o.cpBar.maxvalue = this.maxCP;
  }

  UpdateGP() {
    if (!this.o.gpBar) return;
    this.o.gpBar.value = this.gp;
    this.o.gpBar.maxvalue = this.maxGP;
  }

  UpdateOpacity() {
    let opacityContainer = document.getElementById('opacity-container');
    if (!opacityContainer)
      return;
    if (this.inCombat || !this.options.LowerOpacityOutOfCombat ||
        Util.isCraftingJob(this.job) || Util.isGatheringJob(this.job))
      opacityContainer.style.opacity = 1.0;
    else
      opacityContainer.style.opacity = this.options.OpacityOutOfCombat;
  }

  UpdateFoodBuff() {
    // Non-combat jobs don't set up the left buffs list.
    if (!this.init || !this.o.leftBuffsList)
      return;

    let CanShowWellFedWarning = function() {
      if (this.inCombat)
        return false;
      if (this.level < this.options.MaxLevel)
        return true;
      return this.zone.search(kWellFedZoneRegex) >= 0;
    };

    // Returns the number of ms until it should be shown. If <= 0, show it.
    let TimeToShowWellFedWarning = function() {
      let now_ms = Date.now();
      let show_at_ms = this.foodBuffExpiresTimeMs - (this.options.HideWellFedAboveSeconds * 1000);
      return show_at_ms - now_ms;
    };

    window.clearTimeout(this.foodBuffTimer);
    this.foodBuffTimer = null;

    let canShow = CanShowWellFedWarning.bind(this)();
    let showAfterMs = TimeToShowWellFedWarning.bind(this)();

    if (!canShow || showAfterMs > 0) {
      this.o.leftBuffsList.removeElement('foodbuff');
      if (canShow)
        this.foodBuffTimer = window.setTimeout(this.UpdateFoodBuff.bind(this), showAfterMs);
    } else {
      let div = makeAuraTimerIcon(
          'foodbuff', -1, 1,
          this.options.BigBuffIconWidth, this.options.BigBuffIconHeight,
          '',
          this.options.BigBuffBarHeight, this.options.BigBuffTextHeight,
          'white',
          this.options.BigBuffBorderSize,
          'yellow', 'yellow',
          '../../resources/icon/status/food.png');
      this.o.leftBuffsList.addElement('foodbuff', div, -1);
    }
  }

  OnPartyWipe(e) {
    // TODO: add reset for job-specific ui
    if (this.buffTracker)
      this.buffTracker.clear();
  }

  OnInCombatChanged(e) {
    if (this.inCombat == e.detail.inGameCombat)
      return;

    this.inCombat = e.detail.inGameCombat;
    if (this.inCombat)
      this.SetPullCountdown(0);

    this.UpdateOpacity();
    this.UpdateFoodBuff();
    this.UpdateMPTicker();
  }

  OnZoneChanged(e) {
    this.zone = e.detail.zoneName;
    this.UpdateFoodBuff();
    if (this.buffTracker)
      this.buffTracker.clear();
  }

  SetPullCountdown(seconds) {
    if (this.o.pullCountdown == null) return;

    let in_countdown = seconds > 0;
    let showing_countdown = parseFloat(this.o.pullCountdown.duration) > 0;
    if (in_countdown != showing_countdown) {
      this.o.pullCountdown.duration = seconds;
      if (in_countdown) {
        let audio = new Audio('../../resources/sounds/PowerAuras/sonar.ogg');
        audio.volume = 0.3;
        audio.play();
      }
    }
  }

  OnPlayerChanged(e) {
    if (!this.init) {
      this.me = e.detail.name;
      setupRegexes();
      this.combo = setupComboTracker(this.OnComboChange.bind(this));
      this.init = true;
    }

    let update_job = false;
    let update_hp = false;
    let update_mp = false;
    let update_cp = false;
    let update_gp = false;
    let update_level = false;
    if (e.detail.job != this.job) {
      this.job = e.detail.job;
      // Combos are job specific.
      this.combo.AbortCombo();
      // Update MP ticker as umbral stacks has changed.
      this.umbralStacks = 0;
      this.UpdateMPTicker();
      update_job = update_hp = update_mp = update_cp = update_gp = true;
    }
    if (e.detail.level != this.level) {
      this.level = e.detail.level;
      update_level = true;
    }
    if (e.detail.currentHP != this.hp || e.detail.maxHP != this.maxHP ||
      e.detail.currentShield != this.currentShield) {
      this.hp = e.detail.currentHP;
      this.maxHP = e.detail.maxHP;
      this.currentShield = e.detail.currentShield;
      update_hp = true;

      if (this.hp == 0)
        this.combo.AbortCombo(); // Death resets combos.
    }
    if (e.detail.currentMP != this.mp || e.detail.maxMP != this.maxMP) {
      this.mp = e.detail.currentMP;
      this.maxMP = e.detail.maxMP;
      update_mp = true;
    }
    if (e.detail.currentCP != this.cp || e.detail.maxCP != this.maxCP) {
      this.cp = e.detail.currentCP;
      this.maxCP = e.detail.maxCP;
      update_cp = true;
    }
    if (e.detail.currentGP != this.gp || e.detail.maxGP != this.maxGP) {
      this.gp = e.detail.currentGP;
      this.maxGP = e.detail.maxGP;
      update_gp = true;
    }
    if (update_job) {
      this.UpdateJob();
      // On reload, we need to set the opacity after setting up the job bars.
      this.UpdateOpacity();
    }
    if (update_hp)
      this.UpdateHealth();
    if (update_mp)
      this.UpdateMana();
    if (update_cp)
      this.UpdateCP();
    if (update_gp)
      this.UpdateGP();
    if (update_level)
      this.UpdateFoodBuff();

    if (e.detail.jobDetail) {
      for (let i = 0; i < this.jobFuncs.length; ++i)
        this.jobFuncs[i](e.detail.jobDetail);
    }
  }

  OnTargetChanged(e) {
    let update = false;
    if (e.detail.name == null) {
      if (this.distance != -1) {
        this.distance = -1;
        update = true;
      }
    } else if (e.detail.distance != this.distance, this.job) {
      this.distance = e.detail.distance;
      update = true;
    }
    if (update) {
      this.UpdateHealth();
      this.UpdateMana();
    }
  }

  OnLogEvent(e) {
    if (!this.init)
      return;

    for (let i = 0; i < e.detail.logs.length; i++) {
      let log = e.detail.logs[i];

      // TODO: only consider this when not in battle.
      if (log[15] == '0') {
        let r = log.match(gLang.countdownStartRegex());
        if (r != null) {
          let seconds = parseFloat(r[1]);
          this.SetPullCountdown(seconds);
          continue;
        }
        if (log.search(gLang.countdownCancelRegex()) >= 0) {
          this.SetPullCountdown(0);
          continue;
        }
        if (log.search(/:test:jobs:/) >= 0) {
          this.Test();
          continue;
        }
      } else if (log[15] == '1') {
        if (log[16] == 'A') {
          let m = log.match(kYouGainEffectRegex);
          if (m) {
            let name = m[1];
            let f = this.gainEffectFuncMap[name];
            if (f)
              f(name, log);
            this.buffTracker.onYouGainEffect(name, log);
          }
        } else if (log[16] == 'E') {
          let m = log.match(kYouLoseEffectRegex);
          if (m) {
            let name = m[1];
            let f = this.loseEffectFuncMap[name];
            if (f)
              f(name, log);
            this.buffTracker.onYouLoseEffect(name, log);
          }
        }
        // TODO: consider flags for missing.
        // flags:damage is 1:0 in most misses.
        if (log[16] == '5' || log[16] == '6') {
          let m = log.match(kYouUseAbilityRegex);
          if (m) {
            let id = m[1];
            this.combo.HandleAbility(id);
            let f = this.abilityFuncMap[id];
            if (f)
              f(id);
            this.buffTracker.onUseAbility(id, log);
          } else {
            let m = log.match(kAnybodyAbilityRegex);
            if (m)
              this.buffTracker.onUseAbility(m[1], log);
          }
        }
      }
    }
  }

  Test() {
    let logs = [];
    let t = '[10:10:10.000] ';
    logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Medicated from ' + this.me + ' for 30.2 Seconds.');
    logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Embolden from  for 20 Seconds. (5)');
    logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Battle Litany from  for 25 Seconds.');
    logs.push(t + '1A:10000000:' + this.me + ' gains the effect of The Balance from  for 12 Seconds.');
    logs.push(t + '1A:10000000:Okonomi Yaki gains the effect of Foe Requiem from Okonomi Yaki for 9999.00 Seconds.');
    logs.push(t + '15:1048638C:Okonomi Yaki:8D2:Trick Attack:40000C96:Striking Dummy:20710103:154B:');
    logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Left Eye from That Guy for 15.0 Seconds.');
    logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Right Eye from That Guy for 15.0 Seconds.');
    logs.push(t + '15:1048638C:Tako Yaki:1D0C:Chain Stratagem:40000C96:Striking Dummy:28710103:154B:');
    logs.push(t + '15:1048638C:Tako Yaki:B45:Hypercharge:40000C96:Striking Dummy:28710103:154B:');
    logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Devotion from That Guy for 15.0 Seconds.');
    logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Brotherhood from That Guy for 15.0 Seconds.');
    logs.push(t + '1A:10000000:' + this.me + ' gains the effect of Brotherhood from Other Guy for 15.0 Seconds.');
    let e = { detail: { logs: logs } };
    this.OnLogEvent(e);
  }
}

let gBars;

document.addEventListener('onPlayerChangedEvent', function(e) {
  gBars.OnPlayerChanged(e);
});
document.addEventListener('onTargetChangedEvent', function(e) {
  gBars.OnTargetChanged(e);
});
document.addEventListener('onPartyWipe', function(e) {
  gBars.OnPartyWipe(e);
});
document.addEventListener('onInCombatChangedEvent', function(e) {
  gBars.OnInCombatChanged(e);
});
document.addEventListener('onZoneChangedEvent', function(e) {
  gBars.OnZoneChanged(e);
});
document.addEventListener('onLogEvent', function(e) {
  gBars.OnLogEvent(e);
});

UserConfig.getUserConfigLocation('jobs', function() {
  gBars = new Bars(Options);
});
