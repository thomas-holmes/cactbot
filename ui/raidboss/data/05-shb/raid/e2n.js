'use strict';

[{
  zoneRegex: /^Eden's Gate: Descent$/,
  timelineFile: 'e2n.txt',
  timelineTriggers: [
    {
      id: 'E2N Punishing Ray',
      regex: /Punishing Ray/,
      beforeSeconds: 9,
      infoText: {
        en: 'Get Puddles',
        de: 'Flächen nehmen',
        fr: 'Prenez les rayons',
      },
    },
  ],
  triggers: [
    {
      id: 'E2N Shadowflame Tank',
      regex: / 14:3E4D:Voidwalker starts using Shadowflame on (\y{Name})/,
      regexDe: / 14:3E4D:Nichtswandler starts using Schattenflamme on (\y{Name})/,
      regexJa: / 14:3E4D:ヴォイドウォーカー starts using シャドーフレイム on (\y{Name})/,
      regexFr: / 14:3E4D:Marcheuse Du Néant starts using Flamme D'ombre on (\y{Name})/,
      condition: function(data) {
        return data.role == 'tank';
      },
      alertText: {
        en: 'Tank Buster on YOU',
        de: 'Tankbuster auf DIR',
        fr: 'Tankbuster sur VOUS',
      },
    },
    {
      id: 'E2N Shadowflame Healer',
      regex: / 14:3E4D:Voidwalker starts using Shadowflame on \y{Name}/,
      regexDe: / 14:3E4D:Nichtswandler starts using Schattenflamme on \y{Name}/,
      regexJa: / 14:3E4D:ヴォイドウォーカー starts using シャドーフレイム on \y{Name}/,
      regexFr: / 14:3E4D:Marcheuse Du Néant starts using Flamme D'ombre on (\y{Name})/,
      suppressSeconds: 1,
      condition: function(data) {
        return data.role == 'healer';
      },
      infoText: {
        en: 'tank busters',
        de: 'tank buster',
        fr: 'Tank busters',
      },
    },
    {
      id: 'E2N Entropy',
      regex: / 14:3E6D:Voidwalker starts using Entropy/,
      regexDe: / 14:3E6D:Nichtswandler starts using Entropie/,
      regexJa: / 14:3E6D:ヴォイドウォーカー starts using エントロピー/,
      regexFr: / 14:3E6D:Marcheuse Du Néant starts using Entropie/,
      condition: function(data) {
        return data.role == 'healer';
      },
      infoText: {
        en: 'aoe',
        de: 'AoE',
        fr: 'Dégâts de zone',
      },
    },
    {
      id: 'E2N Doomvoid Slicer',
      regex: / 14:3E3C:Voidwalker starts using Doomvoid Slicer/,
      regexDe: / 14:3E3C:Nichtswandler starts using Nichtsmarter-Sense/,
      regexJa: / 14:3E3C:ヴォイドウォーカー starts using ドゥームヴォイド・スライサー/,
      regexFr: / 14:3E3C:Marcheuse Du Néant starts using Entaille Du Néant Ravageur/,
      infoText: {
        en: 'Get Under',
        de: 'Unter ihn',
        fr: 'Intérieur',
      },
    },
    {
      id: 'E2N Empty Hate',
      regex: / 14:3E46:the Hand of Erebos starts using Empty Hate/,
      regexDe: / 14:3E46:Arm Des Erebos starts using Gähnender Abgrund/,
      regexJa: / 14:3E46:エレボスの巨腕 starts using 虚ろなる悪意/,
      regexFr: / 14:3E46:Bras D'érèbe starts using Vaine Malice/,
      infoText: {
        en: 'Knockback',
        de: 'Knockback',
        fr: 'Poussée',
      },
    },
    {
      id: 'E2N Darkfire Counter',
      regex: / 14:3E42:Voidwalker starts using Dark Fire III/,
      regexDe: / 14:3E42:Nichtswandler starts using Dunkel-Feuga/,
      regexJa: / 14:3E42:ヴォイドウォーカー starts using ダークファイガ/,
      regexFr: / 14:3E42:Marcheuse Du Néant starts using Méga Feu Ténébreux/,
      run: function(data) {
        data.fireCount = data.fireCount || 0;
        data.fireCount++;
      },
    },
    {
      id: 'E2N Dark Fire No Waiting',
      regex: / 1B:\y{ObjectId}:(\y{Name}):....:....:004C:/,
      condition: function(data, matches) {
        return data.me == matches[1];
      },
      alertText: {
        en: 'Spread',
        de: 'Verteilen',
        fr: 'Dispersez-vous',
      },
    },
    {
      id: 'E2N Unholy Darkness No Waiting',
      regex: / 1B:\y{ObjectId}:(\y{Name}):....:....:003E:/,
      alertText: function(data, matches) {
        if (matches[1] == data.me) {
          return {
            en: 'Stack on YOU',
            de: 'Auf DIR sammeln',
            fr: 'Package sur VOUS',
          };
        }
        return {
          en: 'Stack on ' + data.ShortName(matches[1]),
          de: 'Auf ' + data.ShortName(matches[1]) + ' sammeln',
          fr: 'Package sur '+ data.ShortName(matches[1]),
        };
      },
    },
    {
      id: 'E2N Shadoweye No Waiting',
      regex: / 1B:\y{ObjectId}:(\y{Name}):....:....:00B3:/,
      alertText: function(data, matches) {
        return {
          en: 'Look Away from ' + data.ShortName(matches[1]),
          de: 'Schau weg von ' + data.ShortName(matches[1]),
          fr: 'Ne regardez pas '+ data.ShortName(matches[1]),
        };
      },
    },
    {
      id: 'E2N Dark Fire Collect',
      regex: / 1B:\y{ObjectId}:(\y{Name}):....:....:00B5:/,
      run: function(data, matches) {
        data.spell = data.spell || {};
        data.spell[matches[1]] = 'fire';
      },
    },
    {
      id: 'E2N Dark Fire Waiting',
      regex: / 1B:\y{ObjectId}:(\y{Name}):....:....:00B5:/,
      condition: function(data, matches) {
        return data.me == matches[1];
      },
      infoText: {
        en: 'Delayed Fire',
        de: 'Verzögertes Feuer',
        fr: 'Feu retardé',
      },
    },
    {
      id: 'E2N Countdown Marker Fire',
      regex: / 1B:\y{ObjectId}:(\y{Name}):....:....:00B8:/,
      condition: function(data, matches) {
        return data.me == matches[1] && data.spell[data.me] == 'fire';
      },
      alertText: function(data) {
        if (data.fireCount == 3) {
          return {
            en: 'Spread (don\'t stack!)',
            de: 'Verteilen (nicht zusammen stehen)',
            fr: 'Dispersez-vous', // FIXME
          };
        }
        return {
          en: 'Spread',
          de: 'Verteilen',
          fr: 'Dispersez-vous',
        };
      },
    },
    {
      id: 'E2N Unholy Darkness Collect',
      regex: / 1B:\y{ObjectId}:(\y{Name}):....:....:00B4:/,
      run: function(data, matches) {
        data.spell = data.spell || {};
        data.spell[matches[1]] = 'stack';
      },
    },
    {
      id: 'E2N Unholy Darkness Waiting',
      regex: / 1B:\y{ObjectId}:(\y{Name}):....:....:00B4:/,
      condition: function(data, matches) {
        return data.me == matches[1];
      },
      infoText: {
        en: 'Delayed Stack',
        de: 'Verzögertes sammeln',
        fr: 'Package retardé',
      },
    },
    {
      id: 'E2N Countdown Marker Unholy Darkness',
      regex: / 1B:\y{ObjectId}:(\y{Name}):....:....:00B8:/,
      condition: function(data, matches) {
        // The third fire coincides with stack.
        // These people should avoid.
        if (data.spell[data.me] == 'fire' && data.fireCount == 3)
          return false;
        return data.spell[matches[1]] == 'stack';
      },
      alertText: function(data, matches) {
        if (matches[1] == data.me) {
          return {
            en: 'Stack on YOU',
            de: 'Auf DIR sammeln',
            fr: 'Package sur VOUS',
          };
        }
        return {
          en: 'Stack on ' + data.ShortName(matches[1]),
          de: 'Auf ' + data.ShortName(matches[1]) + ' sammeln',
          fr: 'Package sur ' + data.ShortName(matches[1]),
        };
      },
    },
    {
      id: 'E2N Shadoweye Collect',
      regex: / 1B:\y{ObjectId}:(\y{Name}):....:....:00B7:/,
      run: function(data, matches) {
        data.spell = data.spell || {};
        data.spell[matches[1]] = 'eye';
      },
    },
    {
      id: 'E2N Shadoweye Waiting',
      regex: / 1B:\y{ObjectId}:(\y{Name}):....:....:00B7:/,
      condition: function(data, matches) {
        return data.me == matches[1];
      },
      infoText: {
        en: 'Delayed Shadoweye',
        de: 'Verzögertes Schattenauge',
        fr: 'Œil de l\'ombre retardé',
      },
    },
    {
      id: 'E2N Countdown Marker Shadoweye',
      regex: / 1B:\y{ObjectId}:(\y{Name}):....:....:00B8:/,
      condition: function(data, matches) {
        return data.spell[matches[1]] == 'eye';
      },
      delaySeconds: 2,
      alarmText: function(data, matches) {
        if (data.me != matches[1]) {
          return {
            en: 'Look Away from ' + data.ShortName(matches[1]),
            de: 'Von ' + data.ShortName(matches[1]) + ' weg schauen',
            fr: 'Ne regardez pas ' + data.ShortName(matches[1]),
          };
        }
      },
      infoText: function(data, matches) {
        if (data.me == matches[1]) {
          return {
            en: 'Eye on YOU',
            de: 'Auge auf DIR',
            fr: 'Œil de l\'ombre sur VOUS',
          };
        }
      },
    },
    {
      id: 'E2N Countdown Marker Cleanup',
      regex: / 1B:\y{ObjectId}:(\y{Name}):....:....:00B8:/,
      delaySeconds: 10,
      run: function(data, matches) {
        delete data.spell[matches[1]];
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Engage!': 'Start!',
        'Voidwalker': 'Nichtswandler',
        'The Hand of Erebos': 'Arm des Erebos',
      },
      'replaceText': {
        'Spell-In-Waiting': 'Verzögerung',
        'Shadowflame': 'Schattenflamme',
        'Doomvoid Guillotine': 'Nichtsmarter-Fallbeil',
        'Dark Fire III': 'Dunkel-Feuga',
        'attack': 'Attacke',
        'Unholy Darkness': 'Unheiliges Dunkel',
        '--targetable--': '--anvisierbar--',
        'Punishing Ray': 'Strafender Strahl',
        'Doomvoid Slicer': 'Nichtsmarter-Sense',
        'Empty Hate': 'Gähnender Abgrund',
        'Shadoweye': 'Schattenauge',
        'Enrage': 'Finalangriff',
        'Entropy': 'Entropie',
        '--untargetable--': '--nich anvisierbar--',
      },
      '~effectNames': {
        'Spell-in-Waiting: Shadoweye': 'Verzögerung: Schattenauge',
        'Infirmity': 'Gebrechlichkeit',
        'Petrification': 'Stein',
        'Bleeding': 'Blutung',
        'Diabolic Curse': 'Diabolischer Fluch',
        'Spell-in-Waiting: Dark Fire III': 'Verzögerung: Dunkel-Feuga',
        'Brink of Death': 'Sterbenselend',
        'Spell-in-Waiting: Unholy Darkness': 'Verzögerung: Unheiliges Dunkel',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Voidwalker': 'Marcheuse du néant',
        'Engage!': 'À l\'attaque',
      },
      'replaceText': {
        'Spell-in-Waiting': 'Déphasage incantatoire',
        '--sync--': '--Synchronisation--',
        'Shadowflame': 'Flamme d\'ombre',
        'Doomvoid Guillotine': 'Guillotine du néant ravageur',
        'Dark Fire III': 'Méga Feu ténébreux',
        'attack': 'Attaque',
        'Unholy Darkness': 'Miracle sombre',
        '--targetable--': '--Ciblable--',
        '--Reset--': '--Réinitialisation--',
        'Punishing Ray': 'Rayon punitif',
        'Doomvoid Slicer': 'Entaille du néant ravageur',
        'Empty Hate': 'Vaine malice',
        'Shadoweye': 'Œil de l\'ombre',
        'Enrage': 'Enrage',
        'Entropy': 'Entropie',
        '--untargetable--': '--Impossible à cibler--',
      },
      '~effectNames': {
        'Spell-in-Waiting: Shadoweye': 'Sort déphasé: Œil de l\'ombre',
        'Infirmity': 'Infirmité',
        'Petrification': 'Pétrification',
        'Bleeding': 'Saignant',
        'Diabolic Curse': 'Maléfice Du Néant',
        'Spell-in-Waiting: Dark Fire III': 'Sort déphasé: Méga Feu ténébreux',
        'Brink of Death': 'Mourant',
        'Spell-in-Waiting: Unholy Darkness': 'Sort déphasé: Miracle sombre',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Engage!': '戦闘開始！',
      },
      'replaceText': {
        'Spell-in-Waiting': 'ディレイスペル',
        'Shadowflame': 'シャドーフレイム',
        'Doomvoid Guillotine': 'ドゥームヴォイド・ギロチン',
        'Dark Fire III': 'ダークファイガ',
        'attack': '攻撃',
        'Unholy Darkness': 'ダークホーリー',
        'Punishing Ray': 'パニッシュレイ',
        'Doomvoid Slicer': 'ドゥームヴォイド・スライサー',
        'Empty Hate': '虚ろなる悪意',
        'Shadoweye': 'シャドウアイ',
        'Entropy': 'エントロピー',
      },
      '~effectNames': {
        'Spell-in-Waiting: Shadoweye': 'ディレイスペル：シャドウアイ',
        'Infirmity': '虚弱',
        'Petrification': '石化',
        'Bleeding': 'ペイン',
        'Diabolic Curse': 'ヴォイドの呪詛',
        'Spell-in-Waiting: Dark Fire III': 'ディレイスペル：ダークファイガ',
        'Brink of Death': '衰弱［強］',
        'Spell-in-Waiting: Unholy Darkness': 'ディレイスペル：ダークホーリー',
      },
    },
  ],
}];
