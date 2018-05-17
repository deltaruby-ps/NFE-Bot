/**
 * Commands
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains the base commands for Cassius.
 *
 * @license MIT license
 */
'use strict';

// Users who use the settour command when a tournament is already
// scheduled will be added here and prompted to reuse the command.
// This prevents accidentally overwriting a scheduled tournament.
/**@type {Map<string, string>} */
let overwriteWarnings = new Map();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

String.prototype.isNumber = function() {
    return /^\d+$/.test(this);
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

if (typeof(String.prototype.trim) === "undefined") {
    String.prototype.trim = function() {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

const {
    resolve
} = require('path');

function requireReadFile(path) {
    return require(resolve(process.cwd(), path));
}

function stringify(obj, options) {
    var spaces
    var EOL = '\n'
    if (typeof options === 'object' && options !== null) {
        if (options.spaces) {
            spaces = options.spaces
        }
        if (options.EOL) {
            EOL = options.EOL
        }
    }

    var str = JSON.stringify(obj, options ? options.replacer : null, spaces)

    return str.replace(/\n/g, EOL) + EOL
}

var _fs
try {
    _fs = require('graceful-fs')
} catch (_) {
    _fs = require('fs')
}

const fs = require('fs')

function rolld8s(diceno) {
    var dicerolls = [];
    for (var x = 0; x < diceno; x++) {
        dicerolls.push(randInt(1, 8));
    };
    return dicerolls
};

function writeFile(file, obj, options, callback) {
    if (callback == null) {
        callback = options
        options = {}
    }
    options = options || {}
    var fs = options.fs || _fs

    var str = ''
    try {
        str = stringify(obj, options)
    } catch (err) {
        // Need to return whether a callback was passed or not
        if (callback) callback(err, null)
        return
    }

    fs.writeFile(file, str, options, callback)
}

function readFile(file, options, callback) {
    if (callback == null) {
        callback = options
        options = {}
    }

    if (typeof options === 'string') {
        options = {
            encoding: options
        }
    }

    options = options || {}
    var fs = options.fs || _fs

    var shouldThrow = true
    if ('throws' in options) {
        shouldThrow = options.throws
    }

    fs.readFile(file, options, function(err, data) {
        if (err) return callback(err)

        data = stripBom(data)

        var obj
        try {
            obj = JSON.parse(data, options ? options.reviver : null)
        } catch (err2) {
            if (shouldThrow) {
                err2.message = file + ': ' + err2.message
                return callback(err2)
            } else {
                return callback(null, null)
            }
        }

        callback(null, obj)
    })
}

function mode(array) {
    if (array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0],
        maxCount = 1;
    for (var i = 0; i < array.length; i++) {
        var el = array[i];
        if (modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;
        if (modeMap[el] > maxCount) {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}

var turnOrder = []
var whichSquad = ''
var users = []

function findSquad() {
    var squadNames = ['One', 'Two', 'Three', 'Four', 'Five'];
    for (var i = 0; i < squadNames.length; i++) { // Not using for... in because enumeration
        var squadFile = JSON.parse(fs.readFileSync('./squads/squad' + squadNames[i] + '.json'));
        if (!(squadFile == {})) {
            return squadNames[i]
        };
    };
}

function addExtraInfoToJSON(squadFile) {
    for (var x; x < users.length; x++) {
        if (squadFile[x]['Class'] == 'Pyrokinetic') {
            squadFile[x]['fireStacks'] = 0;
        } // DO OTHER CLASSES SOMETIME //
        if (squadFile[x]['Wep'] == 'Wand') {
            squadFile[x]['disableArcaneSoul'] = false;
        }
        return squadFile
    };
};

function passiveCheck(attacker, defender, accroll, numberOfDice, squadFile) {
    var passivesInvoked = []; var damageModifier = 0;
    var className = squadFile[user.id]['Class'].slice(0, -1) // JS is badly language (can't name var class)
    var classLevel = squadFile[user.id]['Class'].slice(-1)
    if (squadFile[attacker][className] == 'Pyrokinetic') {
        if (accRoll > (15 - squadFile[attacker][fireStacks])) {
            passivesInvoked.push('Invoke: Fire triggers! The attack gains +1 dice!');
            numberOfDice +=1;
        };
        if ((squadFile[attacker][gainedStackYet] == false) && (classLevel > 3) && (typeOfMove == 'standard' || 'movement')) {
            squadFile[attacker][fireStacks] += 1;
            passivesInvoked.push('Potential Energy triggers! ' + attacker + ' gains 1 Fire Stack, and now has ' + parseInt(squadFile[attacker][fireStacks]) + ' stacks!');
            squadFile[attacker][gainedStackYet] = true
        };
    };
    if (squadFile[attacker][className] == 'Rifter') {
        if (accRoll > 13) {
            passivesInvoked.push('Time Matrix triggers! The attack gains +5 damage!');
            damageModifier += 5;
        };
    };
    if (squadFile[defender][className] == 'Cryokinetic') {
        if (accRoll > (15 - squadFile[defender][iceStacks])) {
            passivesInvoked.push('Invoke: Ice triggers! The attack gains +1 dice!');
            numberOfDice -= 1;
        };
        if ((squadFile[defender][stacksGainedThisTurn] > 3) && (defenderClassLevel > 3)) {
            squadFile[defender][iceStacks] += 1;
            passivesInvoked.push('Subzero triggers! ' + defender + ' gains 1 Ice Stack, and now has ' + parseInt(squadFile[defender][iceStacks]) + ' stacks!');
            squadFile[defender][stacksGainedThisTurn] += 1
        };
    if (squadFile[defender][className] == 'Guardian') {
        if (accRoll > 15) {
            passivesInvoked.push('Strike Guard triggers! The attack loses 5 damage!');
            damageModifier -= 5;
        };
    };
    };
    return([passivesInvoked, numberOfDice, accRoll, damageModifier])
};


/**@type {{[k: string]: Command | string}} */
let commands = {
    // Developer commands
    timer: async function(target, room, user) {
        if (!target.isNumber()) return;
        this.say("The timer has been set for " + target + " seconds.");
        sleep((parseInt(target) * 1000));
        this.say("Timer completed.");
    },

    custom: function(target, room, user) {
        this.say(target)
    },

    // The command which the bot will recieve from Kyubs containing player data.
    apl: function(target, room, user) { // Example Format: One, Acir, Pyrokinetic 7, Axe 7, Shell Bell, Crystal Hourglass
        var params = target.replace(/\s/g, '').split(',');
        this.say(target);
        var filename = 'squads/squad' + params[0] + '.json';
        var levels = [parseInt(params[2].slice(-1)), parseInt(params[3].slice(-1))]
        var weaponStats = requireReadFile('./stats/' + params[3].slice(0, -1).toLowerCase() + '.json');
        var classStats = requireReadFile('./stats/' + params[2].slice(0, -1).toLowerCase() + '.json');
        var data = {}
        data[params[1]] = {
            'Class': params[2],
            'Wep': params[3],
            'PA': params[4],
            'AC': params[5],
            'HP': parseInt(weaponStats['hp'].split(',')[levels[1] - 1]) + parseInt(classStats['hp'].split(',')[levels[0] - 1]),
            'CHP': parseInt(weaponStats['hp'].split(',')[levels[1] - 1]) + parseInt(classStats['hp'].split(',')[levels[0] - 1]),
            'MAG': parseInt(weaponStats['magic'].split(',')[levels[1] - 1]) + parseInt(classStats['magic'].split(',')[levels[0] - 1]),
            'ATK': parseInt(weaponStats['atk'].split(',')[levels[1] - 1]) + parseInt(classStats['atk'].split(',')[levels[0] - 1]),
            'ME': Math.floor((parseInt(weaponStats['mdef'].split(',')[levels[1] - 1]) + parseInt(classStats['mdef'].split(',')[levels[0] - 1])) / 10),
            'PE': Math.floor((parseInt(weaponStats['pdef'].split(',')[levels[1] - 1]) + parseInt(classStats['pdef'].split(',')[levels[0] - 1])) / 10),
            'MP': parseInt(weaponStats['mov'].split(',')[levels[1] - 1]) + parseInt(classStats['mov'].split(',')[levels[0] - 1]),
            'accmods': 0,
            'dicemods': 0,
            'usedStandard': false,
            'usedSwift': false
        };
        var oldData = requireReadFile(filename);
        var combinedData = Object.assign({}, data, oldData);
        writeFile(filename, combinedData, {
            spaces: 2
        }, function(err) {
            console.error(err)
        });
    },

    clearpl: function(target, room, user) {
        var filename = 'squads/squad' + target + '.json';
        cleareddata = {}
        writeFile(filename, cleareddata, function(err) {
            console.error(err)
        });
    },
	nfetour: function(target, room, user) {
		this.say(//tour create PU, elimination);
		this.say(//tour name NFE);
		this.say(//tour rules -PU, +AuroraVeil, +Ferroseed, +Haunter, +Gurdurr, +Clefairy, -Type-Null);
	};
	setbanlist: function(target, room, user) {
		
	};
    keeproomalive: async function(target, room, user) {
        while (true) {
            this.say('bad users are bad');
            await sleep(600000);
        };
    },
    host: async function(target, room, user) {
        this.say("%host acir");
        this.say("%open");
        this.say("%bsu");
        this.say("The timer has been set for 120 seconds.");
        await sleep(2000);
        whichSquad = findSquad()
        squadJSON = JSON.parse(fs.readFileSync('./squads/squad' + whichSquad + '.json'));
        console.log(squadJSON)
        for (var k in squadJSON) users.push(k);
        console.log(squadJSON)
        var filename = './squads/squad' + whichSquad + '.json';
        var votedNumber = 0;
        var votes = [];
        //for (var y = 0; y < users.length; y++) {squadJSON[users[y]]['vote'] = '';};
        //writeFile(filename, squadJSON, {spaces: 2}, function(err) {console.error(err)});
        this.say("%close");
        this.say("democracy is stupid - %vote is disabled");
        //voteloop:
        //for (var q = 0; q < 5; q++) {
        //  console.log(q);
        //  await sleep(2000) // Checking every 2 seconds to see if votes have come through
        //  for (var i = 0; i < users.length; i++) {
        //      if (!(squadJSON[users[i]]['vote'] == '')) {
        //          votes.push(squadJSON[users[i]]['vote'])
        //          votedNumber = votedNumber + 1;};
        //      if (votedNumber == users.length) {
        //          break voteloop
        //      };
        //  };
        //};
        squadJSON = addExtraInfoToJSON(squadJSON)
        var hammeredVote = mode(votes);
        this.say('i would setmap but kyubs isnt here and im lazy')
        var isGameRunning = true
        this.say('initilizing a new host module...')
        for (var z = 0; z < 200; z++) {
            console.log(turnOrder)
            for (var a = 0; a < turnOrder.length; a++) {
                var activePlayer = turnOrder[a]
                this.say('%info');
                this.say('**Go:** ' + activePlayer)
                this.say('The timer has been set for 150 seconds.')
                console.log(squadJSON)
                playerTurnLoop:
                    for (var q = 0; q < 60; q++) {
                        await sleep(2000);
                        console.log(q);
                        var squadJSON = JSON.parse(fs.readFileSync('./squads/squad' + whichSquad + '.json', 'utf8'));
                        console.log('bad users')
                        console.log(activePlayer);
                        console.log(squadJSON[activePlayer])
                        if (squadJSON[activePlayer]['usedStandard'] == true) {
                            squadJSON[activePlayer]['usedStandard'] = false;
                            squadJSON[activePlayer]['usedSwift'] = false;
                            for (var key in squadJSON[activePlayer]['cooldowns']) {
                                if (squadJSON[activePlayer]['cooldowns'].hasOwnProperty(key)) {
                                    if (squadJSON[activePlayer]['cooldowns'][key] != true) {
                                        squadJSON[activePlayer]['cooldowns'][key] -= 1;
                                        if (squadJSON[activePlayer]['cooldowns'][key] > 0) {
                                            squadJSON[activePlayer]['cooldowns'][key] = 0
                                        };
                                    }
                                }
                            };
                            writeFile('./squads/squad' + whichSquad + '.json', squadJSON, {
                                spaces: 2
                            }, function(err) {
                                console.error(err)
                            });
                            break playerTurnLoop
                        };
                    };
            };
        };
    },

    use: function(target, room, user) {
        const split = target.split(',');
        if (split.length < 2) return this.say("/w " + user.id + ", You must specify who you are attacking and the move you are using.")
        const moveName = split[0].toLowerCase().trim()
        const whoAt = split[1].toLowerCase().trim()
        var additionalParams;
        if (split.length > 2) {
            additionalParams = split[2].toLowerCase().trim();
        }
        var squadFile = JSON.parse(fs.readFileSync('./squads/squad' + whichSquad + '.json'));
        console.log(squadFile);
        var wep = squadFile[user.id]['Wep'].slice(0, -1)
        var wepLevel = squadFile[user.id]['Wep'].slice(-1)
        console.log('below is the important data')
        console.log(squadFile[user.id]['dicemods'])
        if (users.includes(user.id) && users.includes(whoAt)) {
            if (wep == 'Wand') {
                if (moveName == 'idle') {
                    squadFile[user.id]['usedStandard'] = true;
                };
                console.log('its a wand ig')
                if (moveName == 'magicshot') {
                    if (squadFile[user.id]['usedStandard'] == true) {
                        return this.say('You have already used your standard action this turn!')
                    };
                    this.say('%wt Magic Shot')
                    var accRoll = randInt(1, 20);
                    var missRate = 3;
                    var hitOrMiss = 'misses!';
                    if (parseInt(squadFile[whoAt]['ME']) + missRate < accRoll - 1 + squadFile[user.id]['accmods']) {
                        hitOrMiss = 'hits!';
                        squadFile[user.id]['accmods'] = 0;
                    };
                    if (accRoll == 20) {
                        hitOrMiss = 'crits!'
                        squadFile[user.id]['dicemods'] = squadFile[user.id]['dicemods'] + 2
                    };
                    this.say('**Accuracy Roll:** ' + accRoll + ' - Magic Shot ' + hitOrMiss)
                    if (hitOrMiss == 'hits!' || hitOrMiss == 'crits!–') {
                        var damageRolls = []
                        damageRolls = rolld8s(2 + squadFile[user.id]['dicemods']);
                        squadFile[user.id]['dicemods'] = 0;
                        var totalDamage = damageRolls.reduce((a, b) => a + b, 0) + 7 + parseInt(squadFile[user.id]['MAG']);
                        this.say('**Damage Rolls:** ' + damageRolls + ' **Total Damage:** ' + totalDamage);
                        this.say('%hp -' + totalDamage + ', ' + whoAt)
                    };
                    squadFile[user.id]['usedStandard'] = true;
                };

                // WAND 2 - OCCULT BLAST // 
                if (moveName == 'occultblast' && wepLevel > 1) {
                    if (squadFile[user.id]['usedStandard'] == true) {
                        return this.say('You have already used your standard action this turn!')
                    };
                    console.log(squadFile[user.id]['cooldowns'].hasOwnProperty(moveName))
                    if (squadFile[user.id]['cooldowns'].hasOwnProperty(moveName)) {
                        if (squadFile[user.id]['cooldowns'][moveName] != 0) {
                            return this.say('This move\'s cooldown has not refreshed yet!')
                        }
                    };
                    this.say('%wt Occult Blast')
                    var accRoll = randInt(1, 20);
                    var missRate = 3;
                    var hitOrMiss = 'misses!';
                    var pay10;
                    var pay5;
                    if (additionalParams == 'pay10') {
                        var pay10 = true;
                    };
                    if (additionalParams == 'pay5') {
                        var pay5 = true;
                    };
                    if (pay10 == true) {
                        this.say(user.id + ' paid 10HP in order to increase the range to 5!');
                        this.say('%hp -10, ' + user.id)
                        //if (squadFile[user.id][disableArcaneSoul] == false) {
                        //    this.say('Arcane Soul triggers! ' + user.id + ' gets +1ACC to next attack!');
                        //};
                    }
                    if (pay5 == true) {
                        this.say(user.id + ' paid 5HP in order to increase the range to 4!');
                        this.say('%hp -5, ' + user.id)
                    }
                    if (parseInt(squadFile[whoAt]['ME']) + missRate < accRoll - 1 + squadFile[user.id]['accmods']) {
                        hitOrMiss = 'hits!'
                        squadFile[user.id]['accmods'] = 0;
                    };
                    if (accRoll == 20) {
                        hitOrMiss = 'crits!'
                        squadFile[user.id]['dicemods'] = squadFile[user.id]['dicemods'] + 2
                    }
                    this.say('**Accuracy Roll:** ' + accRoll + ' - Occult Blast ' + hitOrMiss)
                    if (hitOrMiss == 'hits!') {
                        var damageRolls = rolld8s(2 + squadFile[user.id]['dicemods']);
                        squadFile[user.id]['dicemods'] = 0;
                        var totalDamage = damageRolls.reduce((a, b) => a + b, 0) + 9 + parseInt(squadFile[user.id]['MAG']);
                        this.say('**Damage Rolls:** ' + damageRolls + ' **Total Damage:** ' + totalDamage);
                        this.say('%hp -' + totalDamage + ', ' + whoAt)
                    };
                    squadFile[user.id]['usedStandard'] = true;
                    squadFile[user.id]['cooldowns']['occultblast'] = 2;

                };

                // WAND 3 - ENERGIZE //
                if (moveName == 'energize' && wepLevel > 2) {
                    if (squadFile[user.id]['usedSwift'] == false) {
                        this.say('%wt energize')
                        this.say(user.id + ' sacrifices 12HP and loses -1 Acc on their next attack to gain +2 dice and +1MP for 1 turn!');
                        this.say('%hp -12 ,' + user.id);
                        squadFile[user.id]['dicemods'] = 2;
                        squadFile[user.id]['accmods'] = -1;
                        //squadFile[user.id]['disableArcaneSoul'] = true;
                        squadFile[user.id]['usedSwift'] = true;
                    } else {
                        this.say('You have already used your swift action this turn!')
                    }
                };

                // WAND 4 - ELDRITCH SHOT
                if (moveName == 'eldritchshot' && wepLevel > 3) {
                    if (squadFile[user.id]['usedStandard'] == true) {
                        return this.say('You have already used your standard action this turn!')
                    };
                    if (squadFile[user.id]['cooldowns'].hasOwnProperty(moveName)) {
                        if (squadFile[user.id]['cooldowns'][moveName] != 0) {
                            return this.say('This move\'s cooldown has not refreshed yet!')
                        }
                    };
                    this.say('%wt Eldritch Shot')
                    var accRoll = randInt(1, 20);
                    var missRate = 4;
                    var numberOfDice = 3;
                    var hitOrMiss = 'misses!';
                    if (parseInt(squadFile[whoAt]['ME']) + missRate < accRoll - 1 + squadFile[user.id]['accmods']) {
                        hitOrMiss = 'hits!';
                        squadFile[user.id]['accmods'] = 0;
                    };
                    if (accRoll == 20) {
                        hitOrMiss = 'crits!'
                        squadFile[user.id]['dicemods'] = squadFile[user.id]['dicemods'] + 3
                    }
                    //adjustedValuesArray = passiveCheck(user.id, whoAt, accroll, numberOfDice, squadFile)
                    //
                    this.say('**Accuracy Roll:** ' + accRoll + ' - Eldritch Shot ' + hitOrMiss)
                    if (hitOrMiss == 'hits!') {
                        var damageRolls = []
                        damageRolls = rolld8s(numberOfDice + squadFile[user.id]['dicemods']);
                        squadFile[user.id]['dicemods'] = 0;
                        var totalDamage = damageRolls.reduce((a, b) => a + b, 0) + 12 + parseInt(squadFile[user.id]['MAG']);
                        this.say('**Damage Rolls:** ' + damageRolls + ' **Total Damage:** ' + totalDamage);
                        this.say('%hp -' + totalDamage + ', ' + whoAt)
                    } else if (hitOrMiss == 'misses!') {
                        this.say('Because the attack missed, the user takes 10HP recoil!')
                        this.say('%hp -10 ,' + user.id)
                        //if (squadFile[user.id][disableArcaneSoul] == false) {
                        //    this.say('Arcane Soul triggers! ' + user.id + ' gets +1ACC to next attack!');
                        //}
                        squadFile[user.id]['accmods'] += 1;
                    }
                    squadFile[user.id]['usedStandard'] = true;
                    squadFile[user.id]['cooldowns']['eldritchshot'] = 3; // E2T
                    console.log(squadFile[user.id]['cooldowns'])
                };

                // WAND 5 - CYCLONE
                if (moveName == 'cyclone' && wepLevel > 4) {
                    if (squadFile[user.id]['usedStandard'] == true) {
                        return this.say('You have already used your standard action this turn!')
                    };
                    if (squadFile[user.id]['cooldowns'].hasOwnProperty(moveName)) {
                        if (squadFile[user.id]['cooldowns'][moveName] == true) {
                            return this.say('This move has no uses remaining!')
                        }
                    };
                    this.say('%wt Cyclone')
                    var accRoll = randInt(1, 20);
                    var missRate = 4;
                    var hitOrMiss = 'misses!';
                    var targets = [];
                    var hitMissObject = {};
                    var accrollstring = '**Accuracy Roll:** ' + accRoll + ' - Cyclone ';
                    targets.push(whoAt);
                    if (additionalParams != undefined) {
                        targets.push(additionalParams)
                    }
                    var numberOfDice = targets.length + 1
                    var allMiss = true;
                    if (accRoll == 20) {
                        numberOfDice = numberOfDice * 2
                    };
                    for (var w = 0; w < targets.length; w++) {
                        var eachUser = targets[w]
                        if (accRoll == 20) {
                            hitMissObject[eachUser] = 'crits';
                            allMiss = false;
                        } else if (squadFile[eachUser]['ME'] + missRate < accRoll - 1 + squadFile[user.id]['accmods']) {
                            hitMissObject[eachUser] = 'hits'
                            allMiss = false;
                        } else {
                            hitMissObject[eachUser] = 'misses'
                        }
                    };
                    for (var b = 0; b < targets.length; b++) {
                        accrollstring += (hitMissObject[targets[b]] + ' ' + targets[b] + ' and ')
                    };
                    this.say(accrollstring.slice(0, -5) + '!');
                    if (allMiss == false) {
                        var damageRolls = [];
                        damageRolls = rolld8s(numberOfDice + squadFile[user.id]['dicemods']);
                        squadFile[user.id]['dicemods'] = 0;
                        var totalDamage = damageRolls.reduce((a, b) => a + b, 0) + 10 + parseInt(squadFile[user.id]['MAG']);
                        this.say('**Damage Rolls:** ' + damageRolls + ' **Total Damage:** ' + totalDamage);
                        this.say('%hp -' + totalDamage + ',' + targets)
                    }
                    squadFile[user.id]['usedStandard'] = true;
                    squadFile[user.id]['cooldowns']['cyclone'] = true; // Once
                    console.log(squadFile[user.id]['cooldowns'])
                };

                // WAND 6 - BLIZZARD
                if (moveName == 'cyclone' && wepLevel > 5) {
                    if (squadFile[user.id]['usedStandard'] == true) {
                        return this.say('You have already used your standard action this turn!')
                    };
                    if (squadFile[user.id]['cooldowns'].hasOwnProperty(moveName)) {
                        if (squadFile[user.id]['cooldowns'][moveName] == true) {
                            return this.say('This move has no uses remaining!')
                        }
                    };
                    this.say('%wt Blizzard')
                    var accRoll = randInt(1, 20);
                    var missRate = 4;
                    var hitOrMiss = 'misses!';
                    var targets = [];
                    var hitMissObject = {};
                    var accrollstring = '**Accuracy Roll:** ' + accRoll + ' - Cyclone ';
                    targets.push(whoAt);
                    if (additionalParams != undefined) {
                        targets.push(additionalParams)
                    }
                    numberOfDice = 3;
                    var allMiss = true;
                    if (accRoll == 20) {
                        numberOfDice = numberOfDice * 2
                    };
                    for (var w = 0; w < targets.length; w++) {
                        var eachUser = targets[w]
                        if (accRoll == 20) {
                            hitMissObject[eachUser] = 'crits';
                            allMiss = false;
                        } else if (squadFile[eachUser]['ME'] + missRate < accRoll - 1 + squadFile[user.id]['accmods']) {
                            hitMissObject[eachUser] = 'hits'
                            allMiss = false;
                        } else {
                            hitMissObject[eachUser] = 'misses'
                        }
                    };
                    for (var b = 0; b < targets.length; b++) {
                        accrollstring += (hitMissObject[targets[b]] + ' ' + targets[b] + ' and ')
                    };
                    this.say(accrollstring.slice(0, -5) + '!');
                    if (allMiss == false) {
                        var damageRolls = [];
                        damageRolls = rolld8s(numberOfDice + squadFile[user.id]['dicemods']);
                        squadFile[user.id]['dicemods'] = 0;
                        var totalDamage = damageRolls.reduce((a, b) => a + b, 0) + 10 + parseInt(squadFile[user.id]['MAG']);
                        this.say('**Damage Rolls:** ' + damageRolls + ' **Total Damage:** ' + totalDamage);
                        this.say('%hp -' + totalDamage + ', ' + targets)
                    }
                    squadFile[user.id]['usedStandard'] = true;
                    squadFile[user.id]['cooldowns']['blizzard'] = true; // Once
                    console.log(squadFile[user.id]['cooldowns'])
                };

                // WAND 7 - CATACLYSM
                if (moveName == 'cataclysm' && wepLevel > 6) {
                    if (squadFile[user.id]['usedStandard'] == true) {
                        return this.say('You have already used your standard action this turn!')
                    };
                    if (squadFile[user.id]['cooldowns'].hasOwnProperty(moveName)) {
                        if (squadFile[user.id]['cooldowns'][moveName] == true) {
                            return this.say('This move has no uses remaining!')
                        }
                    };
                    this.say('%wt Cataclysm')
                    var accRoll = randInt(1, 20);
                    var missRate = 4;
                    var hitOrMiss = 'misses!';
                    if (parseInt(squadFile[whoAt]['ME']) + missRate < accRoll - 1 + squadFile[user.id]['accmods']) {
                        hitOrMiss = 'hits!'
                        squadFile[user.id]['accmods'] = 0;
                    };
                    if (accRoll == 20) {
                        hitOrMiss = 'crits!'
                        squadFile[user.id]['dicemods'] = squadFile[user.id]['dicemods'] + 2
                    }
                    this.say('**Accuracy Roll:** ' + accRoll + ' - Cataclysm ' + hitOrMiss)
                    if (hitOrMiss == 'hits!' || hitOrMiss == 'crits!') {
                        this.say('Because Cataclysm hits, the user takes 15HP in recoil!')
                        //if (squadFile[user.id][disableArcaneSoul] == false) {
                        //    this.say('Arcane Soul triggers! ' + user.id + ' gets +1ACC to next attack!');
                        //}
                        var damageRolls = rolld8s(2 + squadFile[user.id]['dicemods']);
                        squadFile[user.id]['dicemods'] = 0;
                        var totalDamage = damageRolls.reduce((a, b) => a + b, 0) + 20 + parseInt(squadFile[user.id]['MAG']);
                        this.say('**Damage Rolls:** ' + damageRolls + ' **Total Damage:** ' + totalDamage);
                        this.say('%hp -' + totalDamage + ', ' + whoAt)
                    } else {
                        this.say('Because Cataclysm misses, the user takes 10HP in recoil!')
                        //if (squadFile[user.id][disableArcaneSoul] == false) {
                        //    this.say('Arcane Soul triggers! ' + user.id + ' gets +1ACC to next attack!');
                        //}                    
                    };
                    squadFile[user.id]['usedStandard'] = true;
                    squadFile[user.id]['cooldowns']['cataclysm'] = true; // Once
                };
            };

            //if (wep == 'Spellbook')
            //    console.log('its a cultist!')
            //if (moveName == 'fireball' && squadFile[user.id]['usedStandard'] == false) {
            //   this.say('%wt fireball')
            //    var accRoll = randInt(1, 20);
            //    var missRate = 2;
            //    var hitOrMiss = 'misses!';
            //    if (parseInt(squadFile[whoAt]['ME']) + missRate < accRoll - 1 + squadFile[user.id]['accmods']) {
            //        hitOrMiss = 'hits!';
            //        squadFile[user.id]['accmods'] = 0;
            //    };
            //    this.say('**Accuracy Roll:** ' + accRoll + ' - Fireball ' + hitOrMiss)
            //    if (hitOrMiss == 'hits!') {
            //        var damageRolls = []
            //        damageRolls = rolld10s(2 + squadFile[user.id]['dicemods']);
            //        squadFile[user.id]['dicemods'] = 0;
            //        var totalDamage = damageRolls.reduce((a, b) => a + b, 0) + 5 + parseInt(squadFile[user.id]['MAG']);
            //        this.say('**Damage Rolls:** ' + damageRolls + ' **Total Damage:** ' + totalDamage);
            //        this.say('%hp -' + totalDamage + ', ' + whoAt)
            //    } else if (hitOrMiss == 'misses!') {
            //        squadFile[user.id]['usedStandard'] = true;
            //    };
            //    if (moveName == 'hex' && squadFile[user.id]['usedStandard'] == false) {
            //        this.say('%wt hex')
            //        var accRoll = randInt(1, 20)
            //        var missRate = 3;
            //       var hitOrMiss = 'misses!';
            //        if (parseInt(squadFile[whoAt]['ME']) + missRate < accRoll - 1 + squadFile[user.id]['accmods']) {
            //            hitOrMiss = 'hits!';
            //            squadFile[user.id]['accmods'] = 0;
            //            this.say('**Accuracy Roll:** ' + accRoll + ' - Hex ' + hitOrMiss)
             //           if (hitOrMiss == 'hits!') {
             //               var damageRolls = []
                 //           damageRolls = rolld8s(2 + squadFile[user.id]['dicemods']);
              ///              squadFile[user.id]['dicemods'] = 0;
               //             var totalDamage = damageRolls.reduce((a, b) => a + b, 0) + 5 + parseInt(squadFile[user.id]['MAG']);
                  //          this.say('**Damage Rolls:** ' + damageRolls + ' **Total Damage:** ' + totalDamage);
                //            this.say('%hp -' + totalDamage + ', ' + whoAt)
                 //        squadFile[whoAt]['hex'] = true // idk man, but the most clunkiest way to do it is to make each move check for whether the hex effect is active - tell me if u find something more clean
                  //     } else if (hitOrMiss == 'misses!') {
                  //          squadFile[user.id]['usedStandard'] = true;
                  //          // iz a eot
                //        };
               //     };
              //  };
                writeFile('./squads/squad' + whichSquad + '.json', squadFile, {
                    spaces: 2
                }, function(err) {
                    console.error(err)
                });
            };
            //};
    },

    turnorder: function(target, room, user) {
        turnOrder = target.split(',')
    },

    vote: function(target, room, user) {
        var squadFile = JSON.parse(fs.readFileSync('./squads/squad' + whichSquad + '.json'));
        if (users.includes(user.id)) {
            var check = false;
            if (users.length == 3) {
                if ((target.toLowerCase() == 'ffa') == false) {
                    this.say(user.id + ', ' + target + ' is not a valid gamemode!');
                    var check = true
                }
            };
            if (users.length == 4) {
                if ((target.toLowerCase() == 'ffa' || target.toLowerCase() == 'ntr' || target.toLowerCase() == '2v2') == false) {
                    this.say(user.id + ', ' + target + ' is not a valid gamemode!');
                    var check = true
                }
            };
            if (users.length == 5) {
                if ((target.toLowerCase() == 'ffa' || target.toLowerCase() == 'ntr') == false) {
                    this.say(user.id + ', ' + target + ' is not a valid gamemode!');
                    var check = true
                }
            };
            if (users.length == 6) {
                if ((target.toLowerCase() == 'ffa' || target.toLowerCase() == 'ntr' || target.toLowerCase() == '3v3' || target.toLowerCase() == '2v2v2') == false) {
                    this.say(user.id + ', ' + target + ' is not a valid gamemode!');
                    var check = true
                }
            };
            if (users.length == 7) {
                if ((target.toLowerCase() == 'ffa' || target.toLowerCase() == 'ntr') == false) {
                    this.say(user.id + ', ' + target + ' is not a valid gamemode!');
                    var check = true
                }
            };
            if (users.length == 8) {
                if ((target.toLowerCase() == 'ffa' || target.toLowerCase() == 'ntr' || target.toLowerCase() == '4v4' || target.toLowerCase() == '2v2v2v2') == false) {
                    this.say(user.id + ', ' + target + ' is not a valid gamemode!');
                    var check = true
                }
            };
            if (check == false) {
                squadFile[user.id]['vote'] = target
                writeFile('./squads/squad' + whichSquad + '.json', squadFile, {
                    spaces: 2
                }, function(err) {
                    console.error(err)
                });
            };
            console.log(squadFile)
        };
    },
    js: 'eval',
    eval: function(target, room, user) {
        try {
            target = eval(target);
            this.say(JSON.stringify(target));
        } catch (e) {
            this.say(e.name + ": " + e.message);
        }
    },

    // General commands
    about: function(target, room, user) {
        if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
        this.say(Config.username + " code by sirDonovan: https://github.com/sirDonovan/Cassius");
    },
    help: function(target, room, user) {
        if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
        if (!Config.guide) return this.say("There is no guide available.");
        this.say(Users.self.name + " guide: " + Config.guide);
    },
    mail: function(target, room, user) {
        if (!(room instanceof Users.User) || !Config.allowMail) return;
        let targets = target.split(',');
        if (targets.length < 2) return this.say("Please use the following format: .mail user, message");
        let to = Tools.toId(targets[0]);
        if (!to || to.length > 18 || to === Users.self.id || to.startsWith('guest')) return this.say("Please enter a valid username");
        let message = targets.slice(1).join(',').trim();
        let id = Tools.toId(message);
        if (!id) return this.say("Please include a message to send.");
        if (message.length > (258 - user.name.length)) return this.say("Your message is too long.");
        let database = Storage.getDatabase('global');
        if (to in database.mail) {
            let queued = 0;
            for (let i = 0, len = database.mail[to].length; i < len; i++) {
                if (Tools.toId(database.mail[to][i].from) === user.id) queued++;
            }
            if (queued >= 3) return this.say("You have too many messages queued for " + targets[0] + ".");
        } else {
            database.mail[to] = [];
        }
        database.mail[to].push({
            time: Date.now(),
            from: user.name,
            text: message
        });
        Storage.exportDatabase('global');
        this.say("Your message has been sent to " + targets[0] + "!");
    },

    // Game commands
    signups: 'creategame',
    creategame: function(target, room, user) {
        if (room instanceof Users.User) return;
        if (!user.hasRank(room, '+')) return;
        if (!Config.games || !Config.games.includes(room.id)) return this.say("Games are not enabled for this room.");
        let format = Games.getFormat(target);
        if (!format || format.inheritOnly) return this.say("The game '" + target + "' was not found.");
        if (format.internal) return this.say(format.name + " cannot be started manually.");
        Games.createGame(format, room);
        if (!room.game) return;
        room.game.signups();
    },
    start: 'startgame',
    startgame: function(target, room, user) {
        if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
        if (room.game) room.game.start();
    },
    cap: 'capgame',
    capgame: function(target, room, user) {
        if (room instanceof Users.User || !room.game || !user.hasRank(room, '+')) return;
        let cap = parseInt(target);
        if (isNaN(cap)) return this.say("Please enter a valid player cap.");
        if (cap < room.game.minPlayers) return this.say(room.game.name + " must have at least " + room.game.minPlayers + " players.");
        if (room.game.maxPlayers && cap > room.game.maxPlayers) return this.say(room.game.name + " cannot have more than " + room.game.maxPlayers + " players.");
        room.game.playerCap = cap;
        this.say("The game will automatically start at **" + cap + "** players!");
    },
    end: 'endgame',
    endgame: function(target, room, user) {
        if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
        if (room.game) room.game.forceEnd();
    },
    join: 'joingame',
    joingame: function(target, room, user) {
        if (room instanceof Users.User || !room.game) return;
        room.game.join(user);
    },
    leave: 'leavegame',
    leavegame: function(target, room, user) {
        if (room instanceof Users.User || !room.game) return;
        room.game.leave(user);
    },

    // Storage commands
    bits: 'points',
    points: function(target, room, user) {
        if (room !== user) return;
        let targetUserid = target ? Tools.toId(target) : user.id;
        /**@type {Array<string>} */
        let points = [];
        user.rooms.forEach((rank, room) => {
            if (!(room.id in Storage.databases) || !('leaderboard' in Storage.databases[room.id])) return;
            if (targetUserid in Storage.databases[room.id].leaderboard) points.push("**" + room.id + "**: " + Storage.databases[room.id].leaderboard[targetUserid].points);
        });
        if (!points.length) return this.say((target ? target.trim() + " does not" : "You do not") + " have points on any leaderboard.");
        this.say(points.join(" | "));
    },

    // Tournament commands
    tour: 'tournament',
    tournament: function(target, room, user) {
        if (room instanceof Users.User || !Config.tournaments || !Config.tournaments.includes(room.id)) return;
        if (!target) {
            if (!user.hasRank(room, '+')) return;
            if (!room.tour) return this.say("I am not currently tracking a tournament in this room.");
            let info = "``" + room.tour.name + " tournament info``";
            if (room.tour.startTime) {
                return this.say(info + ": **Time**: " + Tools.toDurationString(Date.now() - room.tour.startTime) + " | **Remaining players**: " + room.tour.getRemainingPlayerCount() + '/' + room.tour.totalPlayers);
            } else if (room.tour.started) {
                return this.say(info + ": **Remaining players**: " + room.tour.getRemainingPlayerCount() + '/' + room.tour.totalPlayers);
            } else {
                return this.say(info + ": " + room.tour.playerCount + " player" + (room.tour.playerCount > 1 ? "s" : ""));
            }
        } else {
            if (!user.hasRank(room, '%')) return;
            let targets = target.split(',');
            let cmd = Tools.toId(targets[0]);
            let format;
            switch (cmd) {
                case 'end':
                    this.say("/tour end");
                    break;
                case 'start':
                    this.say("/tour start");
                    break;
                default:
                    format = Tools.getFormat(cmd);
                    if (!format) return this.say('**Error:** invalid format.');
                    if (!format.playable) return this.say(format.name + " cannot be played, please choose another format.");
                    let cap;
                    if (targets[1]) {
                        cap = parseInt(Tools.toId(targets[1]));
                        if (cap < 2 || cap > Tournaments.maxCap || isNaN(cap)) return this.say("**Error:** invalid participant cap.");
                    }
                    this.say("/tour new " + format.id + ", elimination, " + (cap ? cap + ", " : "") + (targets.length > 2 ? ", " + targets.slice(2).join(", ") : ""));
            }
        }
    },
    settour: 'settournament',
    settournament: function(target, room, user) {
        if (room instanceof Users.User || !Config.tournaments || !Config.tournaments.includes(room.id) || !user.hasRank(room, '%')) return;
        if (room.id in Tournaments.tournamentTimers) {
            let warned = overwriteWarnings.has(room.id) && overwriteWarnings.get(room.id) === user.id;
            if (!warned) {
                overwriteWarnings.set(room.id, user.id);
                return this.say("A tournament has already been scheduled in this room. To overwrite it, please reuse this command.");
            }
            overwriteWarnings.delete(room.id);
        }
        let targets = target.split(',');
        if (targets.length < 2) return this.say(Config.commandCharacter + "settour - tier, time, cap (optional)");
        let format = Tools.getFormat(targets[0]);
        if (!format) return this.say('**Error:** invalid format.');
        if (!format.playable) return this.say(format.name + " cannot be played, please choose another format.");
        let date = new Date();
        let currentTime = (date.getHours() * 60 * 60 * 1000) + (date.getMinutes() * (60 * 1000)) + (date.getSeconds() * 1000) + date.getMilliseconds();
        let targetTime = 0;
        if (targets[1].includes(':')) {
            let parts = targets[1].split(':');
            let hours = parseInt(parts[0]);
            let minutes = parseInt(parts[1]);
            if (isNaN(hours) || isNaN(minutes)) return this.say("Please enter a valid time.");
            targetTime = (hours * 60 * 60 * 1000) + (minutes * (60 * 1000));
        } else {
            let hours = parseFloat(targets[1]);
            if (isNaN(hours)) return this.say("Please enter a valid time.");
            targetTime = currentTime + (hours * 60 * 60 * 1000);
        }
        let timer = targetTime - currentTime;
        if (timer <= 0) timer += 24 * 60 * 60 * 1000;
        Tournaments.setTournamentTimer(room, timer, format.id, targets[2] ? parseInt(targets[2]) : 0);
        this.say("The " + format.name + " tournament is scheduled for " + Tools.toDurationString(timer) + ".");
    },
    canceltour: 'canceltournament',
    canceltournament: function(target, room, user) {
        if (room instanceof Users.User || !Config.tournaments || !Config.tournaments.includes(room.id) || !user.hasRank(room, '%')) return;
        if (!(room.id in Tournaments.tournamentTimers)) return this.say("There is no tournament scheduled for this room.");
        clearTimeout(Tournaments.tournamentTimers[room.id]);
        this.say("The scheduled tournament was canceled.");
    },
};

module.exports = commands;
