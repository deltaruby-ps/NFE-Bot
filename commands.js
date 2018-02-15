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

async function pause(ms) { // So each function with a timer dosen't have to be async
    await sleep(parseInt(ms));
    return
};

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
        var weaponStats = JSON.parse(fs.readFileSync('./stats/' + params[3].slice(0, -1).toLowerCase() + '.json'));
        var classStats = JSON.parse(fs.readFileSync('./stats/' + params[2].slice(0, -1).toLowerCase() + '.json'));
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
            'MP': parseInt(weaponStats['mov'].split(',')[levels[1] - 1]) + parseInt(classStats['mov'].split(',')[levels[0] - 1])
        };
        var oldData = JSON.parse(fs.readFileSync(filename));
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
    keeproomalive: async function(target, room, user) {
        while (true) {
            this.say('bad users are bad');
            await sleep(20000000);
        };
    },
    host: async function(target, room, user) {
        this.say(mode(['ffa', 'ntr']))
        this.say("%host acir");
        this.say("%open");
        this.say("%bsu");
        this.say("The timer has been set for 120 seconds.");
        await sleep(2000);
        whichSquad = findSquad()
        var squadJSON = JSON.parse(fs.readFileSync('./squads/squad' + whichSquad + '.json'));
        console.log(squadJSON)
        for (var k in squadJSON) users.push(k);
        var filename = './squads/squad' + whichSquad + '.json';
        var votedNumber = 0;
        var votes = [];
        //for (var y = 0; y < users.length; y++) {squadJSON[users[y]]['vote'] = '';};
        //writeFile(filename, squadJSON, {spaces: 2}, function(err) {console.error(err)});
        this.say("%close");
        this.say("democracy is stupid");
        //voteloop:
        //for (var q = 0; q < 5; q++) {
        //	console.log(q);
        //	await sleep(2000) // Checking every 2 seconds to see if votes have come through
        //	for (var i = 0; i < users.length; i++) {
        //		if (!(squadJSON[users[i]]['vote'] == '')) {
        //			votes.push(squadJSON[users[i]]['vote'])
        //			votedNumber = votedNumber + 1;};
        //		if (votedNumber == users.length) {
        //			break voteloop
        //		};
        //	};
        //};
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
                var squadJSON = JSON.parse(fs.readFileSync('./squads/squad' + whichSquad + '.json'));
                squadJSON['hadTurn?'] = false;
                writeFile('./squads/squad' + whichSquad + '.json', squadJSON, {
                    spaces: 2
                }, function(err) {
                    console.error(err)
                });
                playerTurnLoop:
                    for (var q = 0; q < 60; q++) {
                        await sleep(2000);
                        var squadJSON = JSON.parse(fs.readFileSync('./squads/squad' + whichSquad + '.json'));
                        if (squadJSON['hadTurn?'] == true) {
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
        var squadFile = JSON.parse(fs.readFileSync('./squads/squad' + whichSquad + '.json'))
        var wep = squadFile[user.id]['Wep'].slice(0, -1)
        var wepLevel = squadFile[user.id]['Wep'].slice(-1)
        console.log(moveName == 'occultblast')
        if (users.includes(user.id) && users.includes(whoAt)) {
            if (wep == 'Wand') {
                console.log('its a wand ig')
                if (moveName == 'magicshot') {
                    this.say('%wt Magic Shot')
                    var accRoll = randInt(1, 20);
                    var missRate = 3;
                    var hitOrMiss = 'misses!';
                    if (parseInt(squadFile[whoAt]['ME']) + missRate < accRoll - 1) {
                        hitOrMiss = 'hits!'
                    };
                    this.say('**Accuracy Roll:** ' + accRoll + ' - Magic Shot ' + hitOrMiss)
                    if (hitOrMiss == 'hits!') {
                        var damageRolls = []
                        damageRolls.push(randInt(1, 8), randInt(1, 8))
                        var totalDamage = damageRolls.reduce((a, b) => a + b, 0) + 7 + parseInt(squadFile[user.id]['MAG']);
                        this.say('**Damage Rolls:** ' + damageRolls + ' **Total Damage:** ' + totalDamage);
                        this.say('%hp -' + totalDamage + ', ' + whoAt)
                    };
                };
                console.log('it made it this far')
                if (moveName == 'occultblast') {
                    this.say('%wt Occult Blast')
                    var accRoll = randInt(1, 20);
                    var missRate = 3;
                    var hitOrMiss = 'misses!';
                    var pay10
                    var pay5
                    if (additionalParams == 'pay10') {
                        var pay10 = false;
                    };
                    if (additionalParams == 'pay5') {
                        var pay5 = false
                    }
                    if (pay10 == true) {
                        this.say(user.id + ' paid 10HP in order to increase the range to 5!');
                        this.say('%hp -10, ' + user.id)
                    }
                    this.say('Arcane Soul triggers! ' + user.id + ' gets +1ACC to next attack!');
                    missRate = 2;
                    if (pay5 == true) {
                        this.say(user.id + ' paid 5HP in order to increase the range to 4!');
                        this.say('%hp -5, ' + user.id)
                    }
                    if (parseInt(squadFile[whoAt]['ME']) + missRate < accRoll - 1) {
                        hitOrMiss = 'hits!'
                    };
                    this.say('**Accuracy Roll:** ' + accRoll + ' - Occult Blast ' + hitOrMiss)
                    if (hitOrMiss == 'hits!') {
                        var damageRolls = []
                        damageRolls.push(randInt(1, 8), randInt(1, 8))
                        var totalDamage = damageRolls.reduce((a, b) => a + b, 0) + 9 + parseInt(squadFile[user.id]['MAG']);
                        this.say('**Damage Rolls:** ' + damageRolls + ' **Total Damage:** ' + totalDamage);
                        this.say('%hp -' + totalDamage + ', ' + whoAt)
                    };
                };
            };
        };
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