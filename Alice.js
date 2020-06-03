var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var battle = require('./battle.js');
var dbSQL = require('./db.js');
// Configure logger settings


//全域變數系列
var Timer;
var DefaultCmd = false;
var AdminChannel;

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
            name: "笑著迎接未來吧"
        }
    })

    //初始值
    Timer = true;
});

dbSQL.openSQL();


//活動狀態
bot.on('any', function (evt) {

    console.log(evt);

    //將對話存入變數(最後50句)
    if (evt.t === 'MESSAGE_CREATE') {
        if (Talks.length <= 50) {
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
        let i = TalkID.indexOf(evt.d.id);
        if (i !== -1) {
            bot.sendMessage({
                to: evt.d.channel_id,
                message: '逼逼逼~ 抓到 <@' + TalkName[i] + '> 刪除內容: ' + Talks[i] //機器人回覆這一行字
            });
        }
    }
});


bot.on("message", function (user, userID, channelID, message, evt) {

    var selectSuccess = false;

    if (message.substring(0, 1) === '-') { DefaultCmd = true; }
    else { DefaultCmd = false; }

    //非前置觸發
    if (evt.d.author.bot === undefined) {
        if (message.substring(0, 1) !== '-') {
            if (Timer) {
                dbSQL.select(
                    ' botmessage ',
                    ' * ',
                    ' where instr("' + message + '",ATalk) ',
                    function (msg) {
                        if (msg !== undefined) {
                            valueChange(msg, userID, function (mesg) {
                                bot.sendMessage({
                                    to: channelID,
                                    message: mesg
                                });
                            });
                            selectSuccess = true;
                            Timer = false;
                            setTimeout(function () { Timer = true; }, 30000);
                        }
                    }
                )
            }
        }
    }


    //前置句觸發
    if (evt.d.author.bot === undefined) {
        if (DefaultCmd) {
            if (message.substring(0, 1) === '-') {

                var args = message.substring(1).split(' ');
                var cmd = args[0];

                var helpStr = '目前指令:\ndice\n解放\n雨緣\n\n先隨便玩，有甚麼意見都可以告訴我';

                //主要修改的部分
                var ran = Math.floor(Math.random() * 10) + 1;//亂數產生1~10
                switch (cmd) {
                    case 'help':
                        bot.sendMessage({
                            to: channelID,
                            message: helpStr //機器人回覆這一行字
                        });
                        break;
                    case 'dice':
                        bot.sendMessage({
                            to: channelID,
                            message: user + ' 骰出了 ' + ran + ' 點！'
                        });
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
                        break;
                    case 'battle':
                        battle.fight(user, args[1], args[2], args[3], function (msg) {
                            bot.sendMessage({
                                to: channelID,
                                message: msg
                            });
                        })
                        break;
                    case 'teach':
                        dbSQL.teached(' botmessage ', args[1], args[2], function (msg) {
                            bot.sendMessage({
                                to: channelID,
                                message: msg
                            });
                        })
                        break;
                    case 'setchid':
                        AdminChannel = args[1]
                        bot.sendMessage({
                            to: channelID,
                            message: `收到了!當前使用頻道ID為${AdminChannel}`
                        });
                        break;
                    case 'settalk':
                        if (AdminChannel !== undefined) {
                            bot.sendMessage({
                                to: AdminChannel,
                                message: args[1]
                            })
                        }
                }
            }
        }
    }
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