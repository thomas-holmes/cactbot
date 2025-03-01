'use strict';

// O6S - Sigmascape 2.0 Savage
// localization:
//   de: timeline done, triggers incomplete
//   fr: timeline done, triggers incomplete
//   ja: timeline done, triggers incomplete
[{
  zoneRegex: /Sigmascape V2\.0 \(Savage\)/,
  timelineFile: 'o6s.txt',
  triggers: [
    {
      id: 'O6S Demonic Shear',
      regex: / 14:2829:Demon Chadarnook starts using Demonic Shear on (\y{Name})/,
      regexDe: / 14:2829:Gefallener Chadarnook starts using Dämonische Schere on (\y{Name})/,
      regexFr: / 14:2829:Démon Chadarnouk starts using Cisailles Démoniaques on (\y{Name})/,
      regexJa: / 14:2829:チャダルヌーク・デーモン starts using デモニックシアー on (\y{Name})/,
      regexKo: / 14:2829:차다르누크 악령 starts using 악령의 참격 on (\y{Name})/,
      alertText: function(data, matches) {
        if (matches[1] == data.me) {
          return {
            en: 'Tank Buster on YOU',
            de: 'Tank Buster auf DIR',
            fr: 'Tankbuster sur VOUS',
            ko: '탱버 → 나',
          };
        }
        if (data.role == 'healer') {
          return {
            en: 'Buster on ' + data.ShortName(matches[1]),
            de: 'Buster auf ' + data.ShortName(matches[1]),
            fr: 'Tankbuster sur '+data.ShortName(matches[1]),
            ko: '탱버 → '+data.ShortName(matches[1]),
          };
        }
      },
      tts: function(data, matches) {
        if (matches[1] == data.me) {
          return {
            en: 'buster',
            de: 'tenkbasta',
            fr: 'tankbuster',
            ko: '탱버',
            ja: 'バスター',
          };
        }
      },
    },
    {
      id: 'O6S Storms Grip',
      regex: / 03:Added new combatant The Storm's Grip/,
      regexDe: / 03:Added new combatant Sturmgebiet/,
      regexFr: / 03:Added new combatant Zone De Tempête/,
      regexJa: / 03:Added new combatant 暴風域/,
      regexKo: / 03:Added new combatant 폭풍 영역/,
      condition: function(data) {
        return data.role == 'tank';
      },
      infoText: {
        en: 'Hallowed Wind Stack',
        de: 'Heiliger Boden Wind',
        fr: 'Packez vous dans le vent',
        ko: '쉐어징 천무',
        ja: '隅でスタック',
      },
    },
    {
      id: 'O6S Demonic Stone',
      regex: /1B:\y{ObjectId}:(\y{Name}):....:....:0001:0000:0000:0000:/,
      alarmText: function(data, matches) {
        if (data.me == matches[1]) {
          return {
            en: 'Demonic Stone on YOU',
            de: 'Dämonischer Stein auf DIR',
            fr: 'Pierre démoniaque sur VOUS',
            ko: '악령의 돌 장판 → 나',
            ja: 'デモニックストーン on YOU',
          };
        }
      },
    },
    {
      regex: /1B:\y{ObjectId}:(\y{Name}):....:....:0017:0000:0000:0000:/,
      run: function(data, matches) {
        data.lastKiss = matches[1];
      },
    },
    {
      id: 'O6S Last Kiss Marker',
      regex: /1B:\y{ObjectId}:(\y{Name}):....:....:0017:0000:0000:0000:/,
      condition: function(data, matches) {
        return data.me == matches[1];
      },
      alarmText: {
        en: 'Last Kiss on YOU',
        de: 'Letzter Kuss auf DIR',
        fr: 'Baiser fatal sur VOUS',
        ko: '죽음의 입맞춤 → 나',
        ja: '口づけ on YOU',
      },
      tts: {
        en: 'last kiss',
        de: 'letz ter kuss',
        fr: 'baiser fatal',
        ko: '죽음의 입맞춤',
        ja: '口づけ',
      },
    },
    {
      id: 'O6S Last Kiss',
      regex: /1A:\y{ObjectId}:(\y{Name}) gains the effect of Last Kiss/,
      regexDe: /1A:\y{ObjectId}:(\y{Name}) gains the effect of Letzter Kuss/,
      regexFr: /1A:\y{ObjectId}:(\y{Name}) gains the effect of Baiser Fatal/,
      regexJa: /1A:\y{ObjectId}:(\y{Name}) gains the effect of 死の口づけ/,
      regexKo: /1A:\y{ObjectId}:(\y{Name}) gains the effect of 죽음의 입맞춤/,
      condition: function(data, matches) {
        // The person who gets the marker briefly gets the effect, so
        // don't tell them twice.
        return data.me == matches[1] && data.lastKiss != data.me;
      },
      alarmText: {
        en: 'Last Kiss on YOU',
        de: 'Letzter Kuss auf DIR',
        fr: 'Baiser fatal sur VOUS',
        ko: '죽음의 입맞춤 → 나',
        ja: '口づけ on YOU',
      },
      tts: {
        en: 'last kiss',
        de: 'letz ter kuss',
        fr: 'baiser fatal',
        ko: '죽음의 ',
        ja: '口づけ',
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Demon Chadarnook': 'Gefallener Chadarnook',
        'Easterly': 'Ostwind',
        'Goddess Chadarnook': 'Heilige Chadarnook',
        'Haunt': 'Böser Schatten',
        'Portrayal of Fire': 'Feuergemälde',
        'Portrayal of Wind': 'Windgemälde',
        'Portrayal of Earth': 'Erdgemälde',
        'Portrayal of Water': 'Wassergemälde',
        'The Storm\'s Grip': 'Sturmgebiet',
        'I have claimed the girl in the picture!': 'Das Mädchen in diesem Bildnis gehört mir!',
      },
      'replaceText': {
        '--targetable--': '--anvisierbar--',
        '--untargetable--': '--nich anvisierbar--',
        'Engage!': 'Start!',
        'Enrage': 'Finalangriff',

        'Demonic Howl': 'Dämonisches Heulen',
        'Demonic Pain': 'Dämonischer Schmerz',
        'Demonic Shear': 'Dämonische Schere',
        'Demonic Spout': 'Dämonischer Überschwang',
        'Demonic Stone': 'Dämonischer Stein',
        'Demonic Storm': 'Dämonischer Sturm',
        'Demonic Typhoon': 'Dämonischer Taifun',
        'Demonic Wave': 'Dämonische Welle',
        'Divine Lure': 'Göttliche Verlockung',
        'Downpour': 'Flutschwall',
        'Dull Pain': 'Dumpfer Schmerz',
        'Earthquake': 'Erdbeben',
        'Easterlies': 'Ostwinde',
        'Featherlance': 'Federlanze',
        'Flash Fire': 'Blitzfeuer',
        'Flash Gale': 'Blitzwind',
        'Flash Torrent': 'Blitzregen',
        'Last Kiss': 'Todeskuss',
        'Lullaby': 'Wiegenlied',
        'Materialize': 'Materialisierung',
        'Poltergeist': 'Poltergeist',
        'Possession': 'Besessenheit',
        'Release': 'Befreiung',
        'Rock Hard': 'Felsspalter',
        'Song Of Bravery': 'Lied Der Tapferkeit',
        'The Price': 'Tödliche Versuchung',
        'Flash Flood': 'Blitzregen',
      },
      '~effectNames': {
        'Apathetic': 'Apathie',
        'Black Paint': 'Schwarze Farbe',
        'Blue Paint': 'Blaue Farbe',
        'Fire Resistance Up': 'Feuerresistenz +',
        'Invisible': 'Unsichtbar',
        'Knockback Penalty': 'Rückstoß Unwirksam',
        'Last Kiss': 'Letzter Kuss',
        'Red Paint': 'Rote Farbe',
        'Seduced': 'Versuchung',
        'Slippery Prey': 'Unmarkierbar',
        'Yellow Paint': 'Gelbe Farbe',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Demon Chadarnook': 'Démon Chadarnouk',
        'Easterly': 'Rafale Ultime',
        'Goddess Chadarnook': 'Déesse Chadarnouk',
        'Haunt': 'Ombre Maléfique',
        'Portrayal of Fire': 'Peinture Du Feu',
        'Portrayal of Wind': 'Peinture Du Vent',
        'Portrayal of Earth': 'Peinture De La Terre',
        'Portrayal of Water': 'Peinture De L\'eau',
        'The Storm\'s Grip': 'Emprise De La Tempête',
        'I have claimed the girl in the picture!': 'Héhéhé... La fille du tableau m\'appartient',
        'Engage!': 'À l\'attaque',
      },
      'replaceText': {
        '--Reset--': '--Réinitialisation--',
        '--sync--': '--Synchronisation--',
        '--targetable--': '--Ciblable--',
        '--untargetable--': '--Impossible à cibler--',
        'Enrage': 'Enrage',
        'Demonic Howl': 'Hurlement Démoniaque',
        'Demonic Pain': 'Douleur Démoniaque',
        'Demonic Shear': 'Cisailles Démoniaques',
        'Demonic Spout': 'Jaillissement Démoniaque',
        'Demonic Stone': 'Pierre Démoniaque',
        'Demonic Storm': 'Tempête Démoniaque',
        'Demonic Typhoon': 'Typhon Démoniaque',
        'Demonic Wave': 'Vague Démoniaque',
        'Divine Lure': 'Séduction Divine',
        'Downpour': 'Déluge',
        'Dull Pain': 'Douleur Sourde',
        'Earthquake': 'Grand Séisme',
        'Engage!': 'À l\'attaque',
        'Featherlance': 'Lance De Plume',
        'Flash Fire': 'Flammes Subites',
        'Flash Gale': 'Vent Subit',
        'Flash Torrent': 'Pluie Subite',
        'Last Kiss': 'Baiser Fatal',
        'Lullaby': 'Berceuse',
        'Materialize': 'Matérialisation',
        'Poltergeist': 'Esprit Frappeur',
        'Possession': 'Possession',
        'Release': 'Libération',
        'Rock Hard': 'Brise-roc',
        'Song Of Bravery': 'Chant Du Courage',
        'The Price': 'Tentation Mortelle',
        'Flash Flood': 'Pluie Subite',
        'Easterlies': 'Rafale Ultime',
      },
      '~effectNames': {
        'Apathetic': 'Apathie',
        'Black Paint': 'Peinture Noire',
        'Blue Paint': 'Peinture Bleue',
        'Fire Resistance Up': 'Résistance Au Feu Accrue',
        'Invisible': 'Invisible',
        'Knockback Penalty': 'Résistance Aux Projections/attractions',
        'Last Kiss': 'Baiser Fatal',
        'Red Paint': 'Peinture Rouge',
        'Seduced': 'Séduction',
        'Slippery Prey': 'Marquage Impossible',
        'Yellow Paint': 'Peinture Jaune',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Demon Chadarnook': 'チャダルヌーク・デーモン',
        'Easterly': '極風',
        'Goddess Chadarnook': 'チャダルヌーク・ゴッデス',
        'Haunt': '悪霊の影',
        'Portrayal Of Fire': '火の絵画',
        'Portrayal Of Wind': '風の絵画',
        'Portrayal of Earth': '土の絵画',
        'Portrayal of Water': '水の絵画',
        'The Storm\'s Grip': '暴風域',
        'I have claimed the girl in the picture!': 'グフフフ……この絵の女は',
      },
      'replaceText': {
        'Demonic Howl': 'デモニックハウル',
        'Demonic Pain': 'デモニックペイン',
        'Demonic Shear': 'デモニックシアー',
        'Demonic Spout': 'デモニックスパウト',
        'Demonic Stone': 'デモニックストーン',
        'Demonic Storm': 'デモニックストーム',
        'Demonic Typhoon': 'デモニックタイフーン',
        'Demonic Wave': 'デモニックウェーブ',
        'Divine Lure': '女神の誘惑',
        'Downpour': '水責め',
        'Dull Pain': 'ダルペイン',
        'Earthquake': '大地震',
        'Easterlies': '極風',
        'Engage!': '戦闘開始！',
        'Featherlance': 'フェザーランス',
        'Flash Fire': 'フラッシュファイア',
        'Flash Gale': 'フラッシュウィンド',
        'Flash Torrent': 'フラッシュレイン',
        'Last Kiss': '死の口づけ',
        'Lullaby': '子守歌',
        'Materialize': '実体化',
        'Poltergeist': 'ポルターガイスト',
        'Possession': '絵画憑依',
        'Release': '憑依解除',
        'Rock Hard': 'ロッククラッシャー',
        'Song Of Bravery': '勇気の歌',
        'The Price': '死の誘い',
      },
      '~effectNames': {
        'Apathetic': '無気力',
        'Black Paint': '黒色の絵の具',
        'Blue Paint': '水色の絵の具',
        'Fire Resistance Up': '火属性耐性向上',
        'Invisible': 'インビジブル',
        'Knockback Penalty': 'ノックバック無効',
        'Last Kiss': '死の口づけ',
        'Red Paint': '赤色の絵の具',
        'Seduced': '誘惑',
        'Slippery Prey': 'マーキング対象外',
        'Yellow Paint': '黄色の絵の具',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Demon Chadarnook': '차다르누크 악령',
        'Easterly': '극풍',
        'Goddess Chadarnook': '차다르누크 여신',
        'Haunt': '악령의 그림자',
        'Portrayal Of Fire': '불의 그림',
        'Portrayal Of Wind': '바람의 그림',
        'Portrayal of Earth': '땅의 그림',
        'Portrayal of Water': '물의 그림',
        'The Storm\'s Grip': '폭풍 영역',
        'I have claimed the girl in the picture!': '우후후후…… 그림 속 여자는',
      },
      'replaceText': {
        'Demonic Howl': '악령의 외침',
        'Demonic Pain': '악령의 고통',
        'Demonic Shear': '악령의 참격',
        'Demonic Spout': '악령의 물기둥',
        'Demonic Stone': '악령의 돌',
        'Demonic Storm': '악령의 폭풍',
        'Demonic Typhoon': '악령의 태풍',
        'Demonic Wave': '악령의 물결',
        'Divine Lure': '여신의 유혹',
        'Downpour': '물고문',
        'Dull Pain': '약한 고통',
        'Earthquake': '대지진',
        'Easterlies': '극풍',
        'Engage!': '전투 시작!',
        'Featherlance': '깃털창',
        'Flash Fire': '불바다',
        'Flash Gale': '돌풍',
        'Flash Torrent': '급류',
        'Last Kiss': '죽음의 입맞춤',
        'Lullaby': '자장가',
        'Materialize': '실체화',
        'Poltergeist': '폴터가이스트',
        'Possession': '그림 빙의',
        'Release': '빙의 해제',
        'Rock Hard': '암석 분쇄',
        'Song Of Bravery': '용기의 노래',
        'The Price': '죽음의 유혹',
      },
      '~effectNames': {
        'Apathetic': '무기력',
        'Black Paint': '검은색 물감',
        'Blue Paint': '파란색 물감',
        'Fire Resistance Up': '불속성 저항 상승',
        'Invisible': 'Invisible',
        'Knockback Penalty': '넉백 무효',
        'Last Kiss': '죽음의 입맞춤',
        'Red Paint': '빨간색 물감',
        'Seduced': '유혹',
        'Slippery Prey': '징 대상에서 제외',
        'Yellow Paint': '노란색 물감',
      },
    },
  ],
}];
