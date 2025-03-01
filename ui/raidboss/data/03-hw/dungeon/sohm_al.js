'use strict';

// Sohm Al (normal)
// Nobody remembers what to do here, so here's triggers.
[{
  zoneRegex: /^Sohm Al$/,
  triggers: [
    {
      id: 'Sohm Al Myath Stack',
      regex: /1B:\y{ObjectId}:(\y{Name}):....:....:0017:0000:0000:0000:/,
      alertText: function(data, matches) {
        if (matches[1] == data.me) {
          return {
            en: 'Stack on YOU',
            de: 'Stack auf DIR',
            fr: 'Stack sur VOUS',
          };
        }
        return {
          en: 'Stack on ' + matches[1],
          de: 'Stack auf ' + matches[1],
          fr: 'Stack sur ' + matches[1],
        };
      },
      tts: {
        en: 'stack',
        de: 'stek',
        fr: 'stack',
      },
    },
    {
      id: 'Sohm Al Myath Spread',
      regex: /1B:\y{ObjectId}:(\y{Name}):....:....:00AE:0000:0000:0000:/,
      alertText: function(data, matches) {
        if (matches[1] == data.me) {
          return {
            en: 'Move away from others',
            de: 'Weg von den anderen',
            fr: 'Eloignez-vous des autres',
          };
        }
        return {
          en: 'Move away from ' + matches[1],
          de: 'Weg von ' + matches[1],
          fr: 'Eloignez-vous de ' + matches[1],
        };
      },
      tts: {
        en: 'don\'t stack',
        de: 'nicht stek en',
        fr: 'ne restez pas packé',
      },
    },
    {
      id: 'Sohm Al Myath Chyme',
      regex: / 03:Added new combatant Chyme Of The Mountain/,
      regexDe: / 03:Added new combatant Gebirgsbrei/,
      regexFr: / 03:Added new combatant Chyme Des Montagnes/,
      alertText: {
        en: 'Kill Chyme Add',
        de: 'Brei Add töten',
        fr: 'Tuez l\'add',
      },
      tts: {
        en: 'kill chyme',
        de: 'brei töten',
        fr: 'tuez lad',
      },
    },
    {
      id: 'Sohm Al Tioman Meteor',
      regex: /1B:\y{ObjectId}:(\y{Name}):....:....:0007:0000:0000:0000:/,
      alertText: function(data, matches) {
        if (matches[1] == data.me) {
          return {
            en: 'place meteor on edge',
            de: 'Meteor an Kante ablegen',
            fr: 'Météore à placer sur le côté',
          };
        }
      },
      tts: function(data, matches) {
        if (matches[1] == data.me) {
          return {
            en: 'meteor',
            de: 'meteor',
            fr: 'météore',
          };
        }
      },
    },
  ],
}];
