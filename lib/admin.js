
var http = require('http');
var db = require('./db.js');
var template_admin = require('./template_admin.js');
var url = require('url');
var qs = require('querystring');

var express = require('express');
var multer = require('multer');
var session = require('express-session');

var app = express();
app.use(express.static('public'));
var exec = require('child_process').exec, child;

child = exec("top", function(err, stdout, stderr){
  console.log('stdout: ' + stdout);
  // console.log('stderr: ' + stderr);
  if(err !== null){
    console.log('exec error: ' + err);
  }
})



//-------------------- home = 시작화면 ---------------------------
exports.home = function(request, response,queryData){
  var empty = '_create';
  db.query(`SELECT * FROM activity`, function(error, activity){
    db.query(`SELECT * FROM state`, function(error2, state){
    if(state.length === 0){
      empty = '_create';
    }
    else {
      empty = '_main';
    }

    var html = template_admin.home_HTML(empty);
    response.writeHead(200);
    response.end(html);
    });
  });
}


//---------------------- score board ----------------------------------------------------
exports.score = function(request,response){
  //body == 전체 판
  db.query(`SELECT * FROM state`, function(error,state){
    if(error){
      throw error;
    }
    db.query(`SELECT * FROM CC LEFT JOIN activity ON activity.id = CC.activity_id ORDER BY team_num,activity_id`,function(error2, cc){
      db.query(`SELECT * FROM activity`, function(error3,activity){
        var body = `
        <tr>
          <td width="150" class="top">Team</td>
          <td width="150" class="top">Score</td>
          <td width="150" class="top_rank">Rank</td>
        </tr>
        <p></p>
        `;
        var total_score = [];
        for(var k = 0; k< state[0].num; k++){
          total_score.push('0');
        }
        // calculate total score
        for(var i = 0; i < cc.length; i++){
          total_score[Number(cc[i].team_num-1)] = Number(total_score[Number(cc[i].team_num-1)])
          + Number(cc[i].score);
        }

        // 랭킹 코드 구현
        var rank = [];
        for(var i = 0 ; i < total_score.length ; i++){
          rank[i] = 1;
          for(var j = 0 ; j < total_score.length ; j++){
            if(total_score[i] < total_score[j]){
              rank[i]++;
            }
          }
        }

        var rank_img = [];
        var rank_str = [];
        for(var i = 0 ; i < total_score.length ; i++){
          if(rank[i] == 1){
            rank_img[i] = "https://ifh.cc/g/onTKvR.png";
            rank_str[i] = rank[i] + "등";
          } else if(rank[i] == 2){
            rank_img[i] = "https://ifh.cc/g/p25ONc.png";
            rank_str[i] = rank[i] + "등";
          } else if(rank[i] == 3){
            rank_img[i] = "https://ifh.cc/g/qQVoY8.png";
            rank_str[i] = rank[i] + "등";
          } else{
            rank_img[i] = "https://ifh.cc/g/A9R7RY.png";
            rank_str[i] = "";
          }
          console.log("rank - ",i, rank_img[i]);
        }

        for(var k = 0; k< state[0].num; k++){
            body += `
            <tr>
              <td width="150" class="mid">Team ${k+1}</td>
              <td width="150" class="mid">${total_score[k]} 점</td>
              <td width="150" class="mid"><img src=${rank_img[k]} width="40"> ${rank_str[k]}</td>
            </tr>
            `;
        }
        
        body = `
        <table border="1" style="margin:auto;"> ${body} </table>
        <p></p>
        <form action="/admin_main" method="post" style="text-align:center;">
          <input type="submit" value="관리자 화면" style="background:#B0E0E6; font-size:20px;border:0px; font-weight:bold; border-radius:20px; width:200px; height:50px"  /><p></p>
        </form>
        `;

        var html = template_admin.score_HTML(body,state[0].title);

        response.writeHead(200);
        response.end(html);
    });
  });
});
}


//---------------------- create team cc ----------------------------------------------------
exports.create = function(request, response){
  var html = template_admin.HTML_create();
  response.writeHead(200);
  response.end(html);
}

function id_check(arr){
  var id = 1;

  for(var i = 0; i < arr.length; i++){
    if( Number(arr[0].id) > 1){
      id = 1;
      break;
    }
    if(i+1 < arr.length){
      if(Number(arr[i+1].id) - Number(arr[i].id) > 1 ){
        id = Number(arr[i].id)+1;
        break;
      }
    }
    else if(i === arr.length-1){
      id += Number(arr[i].id);
    }
  };
  return id;
}

function team_num_check(arr){
  var team_num = 1;
  for(var i = 0; i < arr.length; i++){
    if( Number(arr[0].team_num) > 1){
      team_num = 1;
      break;
    }
    if(i+1 < arr.length){
      if(Number(arr[i+1].team_num) - Number(arr[i].team_num) > 1 ){
        team_num = Number(arr[i].team_num)+1;
        break;
      }
    }
    else if(i === arr.length-1){
      team_num += Number(arr[i].team_num);
    }
  };
  return team_num;
}

function random(random_url, len){
  var temp = 0;
  var min = 10000;
  var max = 99999;
  for(var i = 0; i<len; i++){
    temp = Math.floor(Math.random() * (max-min)) + min;
    if(random_url.indexOf(temp) === -1){
      random_url.push(temp);
    }
    else{
      i--;
    }
  }

  return random_url;
}


//---------------------- initialization all data ----------------------------------------------------
exports.initialization = function(request,response){
  request.on('data', function(data){
  });
  request.on('end', function(){
      db.query(`DELETE FROM url WHERE team_num IS NOT NULL;`,
        function(error, result){
          if(error){
            throw error;
          }
      });
      db.query(`DELETE FROM state WHERE title IS NOT NULL OR title IS NULL;`,
        function(error, result){
          if(error){
            throw error;
          }
      });

      db.query(`DELETE FROM activity WHERE id IS NOT NULL;`,
        function(error, result){
          if(error){
            throw error;
          }
      });
      db.query(`DELETE FROM cc WHERE team_num IS NOT NULL;`,
        function(error, result){
          if(error){
            throw error;
          }
      });
      response.writeHead(302,{Location:`/admin_create`});
      response.end();
  });
}


//---------------------- main 화면  ----------------------------------------------------
exports.main = function(require,response){
  db.query(`SELECT * FROM state`, function(error,state){
    if(error){
      throw error;
    }
    db.query(`SELECT * FROM activity ORDER BY id ASC`, function(error2,activity){
        if(error2){
          throw error2;
        }
      db.query(`SELECT * FROM url ORDER BY team_num ASC`, function(error3,url){
        if(error3){
          throw error3;
        }
        var activity_id = id_check(activity);
        var url_team_num =team_num_check(url);
        var title = '';
        var html = template_admin.main_HTML(state, activity_id, activity, url, url_team_num);
        response.writeHead(200);
        response.end(html);
          });
        });
      });
}


//--------------------------------   create team cc state    ----------------------------------------
exports.create_state = function(request,response){
  var body = '';
  request.on('data', function(data){
      body = body + data;
  });
  request.on('end', function(){
      var post = qs.parse(body);
      db.query(`SELECT * FROM state`, function(error, state){
        if(error){
          throw error;
        }
      if(state.length > 0){
        var alert = `
        <!doctype html>
        <html>
        <head>
        <meta charset="utf-8">
        </head>
        <body>
        <h1>ERROR</h1>
        <script>
        alert('등록 오류!! (이미 등록된 값이 존재합니다))');
        location.href = 'http://localhost:3000/admin_main';
        </script>
        </body>
        </html>`
        ;
    //    var html = template_admin.alert_HTML(alert);
        response.writeHead(200);
        response.end(alert);
      }
      else{
          db.query(`INSERT INTO state (title, num) VALUES(?,?)`,
            [post.team_title, post.team_num],
            function(error2, result){
              if(error2){
                throw error2;
              }
            }
          );
          var random_url = [];
          random_url = random(random_url,post.team_num);
          for(var i = 0 ; i < post.team_num; i++){
            db.query(`INSERT INTO URL (team_num, url) VALUES(?,?)`,
              [i+1, random_url[i]],
              function(error, result){
                if(error){
                  throw error;
                }
              }
            );
          }

          response.writeHead(302,{Location:`/admin_main`});
          response.end();
        }
    });

  });
}



//--------------------------  update information     ------------------------------------------
exports.update_state = function(request, response){
  var body = '';
  request.on('data', function(data){
      body = body + data;
  });
  request.on('end', function(){
      var post = qs.parse(body);
      db.query(`UPDATE state SET title=?, num=? WHERE title=?`,
      [post.team_title, post.team_num, post.id], function(error, result){
        response.writeHead(302, {Location: `/admin_main`});
        response.end();
      });
  });
}

//---------------------------     activity list edit           ---------------------------------------

exports.activity_delete = function(request, response){
  var body = '';
  request.on('data', function(data){
      body = body + data;
  });
  request.on('end', function(){
      var post = qs.parse(body);
      db.query(`DELETE FROM activity WHERE id=?`, [post.id],function(error, reuslt){
        if(error){
          throw error;
        }
        response.writeHead(302, {Location: `/admin_main`});
        response.end();
    });
  });
}

exports.activity_insert = function(request, response){
  var body = '';
  request.on('data', function(data){
      body = body + data;
  });
  request.on('end', function(){
      var post = qs.parse(body);

      db.query(`INSERT INTO activity (id, activity,score ) VALUES(?,?,?)`,
        [post.id, post.activity,post.score],
        function(error, result){
          if(error){
            throw error;
          }
          response.writeHead(302,{Location:`/admin_main`});
          response.end();
        }
      )
  });
}

//--------------------------------   url list edit      ---------------------------------------

exports.url_delete = function(request,response){
  var body = '';
  request.on('data', function(data){
      body = body + data;
  });
  request.on('end', function(){
      var post = qs.parse(body);
      db.query(`DELETE FROM url WHERE team_num=?`, [post.id],function(error, reuslt){
        if(error){
          throw error;
        }
        db.query(`DELETE FROM cc WHERE team_num=? `,[post.id],function(error2, cc){
        if(error2){
          throw error2;
        }
        db.query(`SELECT * FROM state`, function (error3, state){
          if(error3){
            throw error3;
          }
          db.query(`UPDATE state SET title=?, num=? WHERE title=?`,
            [state[0].title, Number(state[0].num)-1, state[0].title], function (error4, result){
              if(error4){
                throw error4;
              }
        response.writeHead(302, {Location: `/admin_main`});
        response.end();
      });
    });
  });
  });
  });

}

exports.url_insert = function(request, response){
  var body = '';
  request.on('data', function(data){
      body = body + data;
  });
  request.on('end', function(){
      var post = qs.parse(body);
      var random_url = [];
      var url_length = 0;
      db.query(`SELECT * FROM URL`, function(error1, url){
        if(error1){
          throw error1;
        }
        url_length = Number(url.length);
        for(var i = 0; i< url.length; i++){
          random_url.push(url[i].url);
        }
        random_url = random(random_url,1);
        db.query(`INSERT INTO url (team_num, url) VALUES(?,?)`,
          [post.id, random_url[url_length]],
          function(error, result){
            if(error){
              throw error;
            }
            db.query(`SELECT * FROM state`, function (error3, state){
              if(error3){
                throw error3;
              }
              db.query(`UPDATE state SET title=?, num=? WHERE title=?`,
                [state[0].title, Number(state[0].num)+1, state[0].title], function (error4, result){
                  if(error4){
                    throw error4;
                  }
                response.writeHead(302,{Location:`/admin_main`});
                response.end();
            });
          });
        });
      });
    });
}
