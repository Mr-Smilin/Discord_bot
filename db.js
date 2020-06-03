
var mysql = require('mysql');
// 建立連線
var conn = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '2918',
  database: 'discord',
  port: '2918'
});

//查詢
exports.select = function (
  tableed = ' botmessage ',
  valueed = ' * ',
  whereed = ' where 1=1 ',
  callback) {

  conn.query('SELECT ' + valueed + ' FROM ' + tableed + whereed + 'order by length(ATalk) DESC', function (err, result, fields) {
    if (err) {
      console.log(err);
      callback(undefined);
    }
    else if (result[0] !== undefined) {
      console.log(result[0]);
      callback(result[0].BTalk);
    }
  });
}

//新增
exports.teached = function (
  tableed = ' botmessage ',
  valueA, valueB, callback
) {
  if ((valueA === '') || (valueB === '') || (valueA === ' ') || (valueB === ' ')) {
    callback('格式有誤，不行喔!');
  }
  else {
    conn.query('SELECT * FROM ' + tableed + ' WHERE ATalk= "' + valueA + '" ', function (err, result, fields) {
      if (err) {
        console.log(err);
        callback('出現錯誤!錯誤代碼:ERROR#teach1 ><');
      }
      else if (result[0] !== undefined) {
        if (result[0].ATalk !== undefined) {
          callback('這句話之前學過了呢...');
        }
      }
      else {
        conn.query('INSERT INTO ' + tableed + ' ( ATalk,BTalk ) value ( "' + valueA + '" , "' + valueB + '" )', function (err, result, fields) {
          if (err) {
            console.log(err);
            callback('出現錯誤!錯誤代碼:ERROR#teach2 ><');
          }
          else {
            callback('好~我會努力記住的^^');
          }
        })
      }
    })
  }
}

exports.openSQL = function () {
  // 建立連線後不論是否成功都會呼叫
  conn.connect(function (err) {
    if (err) throw err;
  });
}