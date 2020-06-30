var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var battle = require('./battle.js');
var dbSQL = require('./db.js');
var playerdb = require('./player.js');
var talkdb = require('./talkdb.js');
var gasApi = require('./gasGet.js');
var shino = require('./shino.js');
var messageManager = require('./message.js');
// Configure logger settings


//全域變數系列
var Timer;
var battleWait;
var DefaultCmd = false;
var AdminChannel;

// //抓收回權限
// var anyPower;
// //頻道權限
// var talkPower;
// var basePower;

//收回內容
var Talks = new Array;
var TalkName = new Array;
var TalkID = new Array;

logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = "debug";
// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

bot.on("ready", function (evt) {
    logger.info("Connected");
    logger.info("Logged in as: ");
    logger.info(bot.username + " - (" + bot.id + ")");

    //設定狀態
    bot.setPresence({
        game: {
            name: "平日工作時間(參考)為 AM 9:00 ~ PM 10:00 喲^^"
        }
    })

    //初始值
    Timer = true;
    battleWait = true;
});

dbSQL.openSQL();
talkdb.openSQL();


//活動狀態
bot.on('any', function (evt) {

    //將對話存入變數(最後50句)
    if (evt.t === 'MESSAGE_CREATE') {
        if (Talks.length <= 500) {
            Talks.push(evt.d.content);
            TalkName.push(evt.d.author.id);
            TalkID.push(evt.d.id);
        }
        else {
            Talks.shift();
            TalkName.shift();
            TalkID.shift();
            Talks.push(evt.d.content);
            TalkName.push(evt.d.author.id);
            TalkID.push(evt.d.id);
        }
    }

    //出現刪除對話

    if (evt.t === 'MESSAGE_DELETE') {
        //權限判斷
        talking(1, evt.d.guild_id, evt.d.channel_id, function (power) {
            if (power) {
                let i = TalkID.indexOf(evt.d.id);
                if (i !== -1) {
                    bot.sendMessage({
                        to: evt.d.channel_id,
                        message: '逼逼逼~ 抓到 <@' + TalkName[i] + '> 刪除內容: ' + Talks[i] //機器人回覆這一行字
                    });
                    dbSQL.countSave('1');
                }
            }
        })
    }

    // 出現編輯對話
    if (false) {
        if (evt.t === 'MESSAGE_UPDATE') {
            //權限判斷
            talking(1, evt.d.guild_id, evt.d.channel_id, function (power) {
                if (power) {
                    let i = TalkID.indexOf(evt.d.id);
                    if (i !== -1) {
                        bot.sendMessage({
                            to: evt.d.channel_id,
                            message: '逼逼逼~ 抓到 <@' + TalkName[i] + '> 編輯內容: ' + Talks[i] + ' \n新內容: ' + evt.d.content //機器人回覆這一行字
                        });
                        dbSQL.countSave('1');
                    }
                }
            })
        }
    }

});


bot.on("message", function (user, userID, channelID, message, evt) {

    //警局
    shino.sendLs(message);

    if (message.substring(0, 1) === '-') { DefaultCmd = true; }
    else { DefaultCmd = false; }

    //非前置觸發
    if (Timer || (channelID !== '719892968579792907'))
        talking(2, evt.d.guild_id, channelID, function (power) {
            if (power)
                if (message.indexOf(':') === -1) {
                    if (evt.d.author.bot === undefined) {
                        if (message.substring(0, 1) !== '$' && message.substring(0, 3) !== '攻略組') {
                            if (message.substring(0, 1) !== '-') {
                                dbSQL.select(
                                    ' botmessage ',
                                    ' * ',
                                    ' where instr("' + message + '",ATalk) ',
                                    channelID,
                                    function (msg) {
                                        if (msg !== undefined) {
                                            valueChange(msg, userID, function (mesg) {
                                                bot.sendMessage({
                                                    to: channelID,
                                                    message: mesg,
                                                    typing: true
                                                });
                                            });
                                            if (channelID === '719892968579792907') {
                                                Timer = false;
                                                setTimeout(function () { Timer = true; }, 30000);
                                            }
                                            dbSQL.countSave('2');
                                        }
                                    }
                                )
                            }
                        }
                    }
                }
        })


    let exUser;
    //前置句觸發
    if (userID === '437009669181931531' || userID === '165753385385984000') { exUser = true };
    talking(3, evt.d.guild_id, channelID, function (power) {
        if (power || exUser)
            if (evt.d.author.bot === undefined) {
                if (DefaultCmd) {
                    if (message.substring(0, 1) === '-') {
                        var args = message.substring(1).split(' ');
                        var cmd = args[0];

                        //舊的help表單
                        var helpStr = '目前指令:\nhelp\ndice\n~~解放~~\n~~雨緣~~\nquiet(安靜)\n\n先隨便玩，有甚麼意見都可以告訴我';

                        //主要修改的部分
                        var ran = Math.floor(Math.random() * 10) + 1;//亂數產生1~10
                        switch (cmd) {
                            case 'help':
                                messageManager.HelpMessage(function (res) {
                                    bot.sendMessage({
                                        to: channelID,
                                        embed: res
                                    })
                                })
                                dbSQL.countSave('3');
                                break;
                            case 'dice':
                                bot.sendMessage({
                                    to: channelID,
                                    message: user + ' 骰出了 ' + ran + ' 點！'
                                });
                                dbSQL.countSave('3');
                                break;
                            case '解放':
                                bot.sendMessage({
                                    to: channelID,
                                    message: run1(ran, user)
                                });
                                break;
                            case '雨緣':
                                bot.sendMessage({
                                    to: channelID,
                                    message: '噴阿，雨緣你倒是噴阿'
                                });
                                dbSQL.countSave('3');
                                break;
                            case 'battle':
                                if (battleWait) {
                                    battleWait = false;
                                    battle.fight(user, args[1], args[2], args[3], userID, channelID, bot)
                                    sleep(5000)
                                    battleWait = true;
                                }
                                dbSQL.countSave('3');
                                break;
                            case 'newPlayer':
                                playerdb.newPlayer(bot, channelID, userID, function (msg) {
                                    bot.sendMessage({
                                        to: channelID,
                                        message: msg
                                    });
                                });
                                dbSQL.countSave('3');
                                break;
                            case 'teach':
                                console.log(user + ': ' + message);
                                dbSQL.teached(' botmessage ', args[1], args[2], userID, function (msg) {
                                    bot.sendMessage({
                                        to: channelID,
                                        message: msg
                                    });
                                })
                                dbSQL.countSave('3');
                                break;
                            // 刪除
                            // case 'd':
                            //     dbSQL.delete()
                            //     break;
                            case 'setchid':
                                AdminChannel = args[1]
                                bot.sendMessage({
                                    to: channelID,
                                    message: `收到了!當前使用頻道ID為${AdminChannel}`
                                });
                                dbSQL.countSave('3');
                                break;
                            case 'settalk':
                                if (AdminChannel !== undefined) {
                                    bot.sendMessage({
                                        to: AdminChannel,
                                        message: args[1]
                                    })
                                }
                                dbSQL.countSave('3');
                                break;
                            case 'quiet':
                                if (userID === '165753385385984000' || userID === '437009669181931531') {
                                    talkdb.quiet(args[1], args[2], evt.d.guild_id, channelID, function (msg) {
                                        bot.sendMessage({
                                            to: channelID,
                                            message: msg
                                        })
                                    })
                                    dbSQL.countSave('3');
                                }
                                break;
                            //搜尋特定玩家教過的話
                            case 'findMessageFromUser':
                                dbSQL.selectFromUserID(args[1], async function (msg) {
                                    while (msg.length > 1800) {
                                        tempMsg = msg.substring(0, 1800) + '```';
                                        bot.sendMessage({
                                            to: channelID,
                                            message: tempMsg
                                        });
                                        msg = '```' + msg.substring(1800, msg.length);
                                        await sleep(200);
                                    }
                                    bot.sendMessage({
                                        to: channelID,
                                        message: msg
                                    })
                                })
                                dbSQL.countSave('3');
                                break;
                            case 'record':
                                dbSQL.getAllCountSave(function (msg) {
                                    bot.sendMessage({
                                        to: channelID,
                                        message: msg
                                    })
                                })
                                dbSQL.countSave('3');
                                break;
                            case 'thumbnailTest':
                                //https://discord.com/developers/docs/resources/channel#embed-limits
                                //https://discordjs.guide/popular-topics/embeds.html#using-an-embed-object
                                messageManager.MainMessage(function (res) {
                                    bot.sendMessage({
                                        to: channelID,
                                        embed: res
                                    })
                                })
                                dbSQL.countSave('3');
                                break;
                        }
                    }
                }
            }
    })

    talking(4, evt.d.guild_id, channelID, function (power) {
        if (power)
            if (evt.d.author.bot === undefined) {
                if (message.substring(0, 3) === '攻略組') {
                    var args = message.substring(4).split(' ');
                    var cmd = args[0];
                    switch (cmd) {
                        case '轉生點':  //轉生點查詢
                            if (args[1] === undefined || args[1] === '' || args[2] === '' || args[1] > 100 || args[1] < 1 || args[2] > 10 || args[2] < 1 || isNaN(args[1]) === true || (isNaN(args[2]) === true && args[2] !== undefined)) {
                                msg = '```轉生點查詢\n語法:攻略組 轉生點 {等級} [範圍]\n\n從選擇等級開始查詢，根據範圍返還查詢數量\n\n等級不可低於1，不可大於100\n範圍不可低於1，不可大於10(預設5)```'
                                bot.sendMessage({
                                    to: channelID,
                                    message: msg
                                });
                            }
                            else {
                                if (args[2] === undefined) {
                                    args[2] = 5;
                                }
                                gasApi.getLevel(args[1], args[2], function (data) {
                                    getLevel(args[1], data, function (msg) {
                                        bot.sendMessage({
                                            to: channelID,
                                            message: msg
                                        });
                                    })
                                })
                            }
                            dbSQL.countSave('4');
                            break;
                        case '技能':
                            gasApi.getSkill(args[1], function (msg) {
                                bot.sendMessage({
                                    to: channelID,
                                    message: msg
                                })
                            });
                            dbSQL.countSave('4');
                            break;
                        case '黑特':
                            gasApi.getBlackList(function (msg) {
                                bot.sendMessage({
                                    to: channelID,
                                    message: msg
                                })
                            });
                            dbSQL.countSave('4');
                            break;
                        default:
                            messageManager.RaidersTeamMessage(function (res) {
                                bot.sendMessage({
                                    to: channelID,
                                    embed: res
                                })
                            })
                            dbSQL.countSave('4');
                            break;
                    }
                }
            }
    });
});

function run1(ran, user) {
    if (ran > 5) {
        return '「Enhance Armament」' + user + ' 解放了金木樨之劍，刀身化作無數的碎片';
    }
    return '「Enhance Armament」' + user + ' 解放了金木樨之劍，但是因為智力不夠所以沒有成功';
}

//參數替換
valueChange = function (message, username, callback) {
    if (message.indexOf("$[ID]") != -1) {
        beforeStr = message.substring(0, message.indexOf('$[ID]'));
        afterStr = message.substring(message.indexOf('$[ID]') + 5, message.length);
        message = beforeStr + '<@' + username + '>' + afterStr;
    }

    callback(message)
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

// function talking(guildID, channelID) {
//     talkdb.selectQuiet(guildID, channelID, function (powers) {
//         if (powers.indexOf('1') !== -1) {
//             anyPower = true
//         }
//         else {
//             anyPower = false
//         }
//         if (powers.indexOf('2') !== -1) {
//             talkPower = true
//         }
//         else {
//             talkPower = false
//         }
//         if (powers.indexOf('3') !== -1) {
//             basePower = true
//         }
//         else {
//             basePower = false
//         }
//     })
// }

function talking(nr, guildID, channelID, callback) {
    talkdb.selectQuiet(guildID, channelID, function (powers) {
        switch (nr) {
            case 1: {
                callback(powers.indexOf('1') !== -1);
                break;
            }
            case 2: {
                callback(powers.indexOf('2') !== -1);
                break;
            }
            case 3: {
                callback(powers.indexOf('3') !== -1);
                break;
            }
            case 4: {
                callback(powers.indexOf('4') !== -1);
                break;
            }
        }
    })
}

//字串補空白
function paddingLeft(str, lenght) {
    if (str.length >= lenght)
        return str;
    else
        return paddingLeft(" " + str, lenght);
}

//攻略組轉生點，資料處理
function getLevel(level, data, callback) {
    let j = parseFloat(level);
    let msg = '```';
    for (i = 0; i <= data.length - 1; i++) {
        if (data[i] !== undefined) {
            msg = msg + `等級${paddingLeft((i + j), 4)} | 等級所需經驗${paddingLeft(data[i].lat, 7)} | 累積轉生點${paddingLeft(data[i].lng, 3)} \n`;
        }
    }
    msg = msg + '```';
    if (msg === '``````') {
        msg = '你能不能正常打字?';
    }
    callback(msg);
}