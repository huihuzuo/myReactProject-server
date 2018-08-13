const express = require('express');
const md5=require("blueimp-md5");
const router = express.Router();
const UserModel=require("../db/models").UserModel;
const filter={password:0};//查询时过滤出指定的属性


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/*
b.提供一个用户注册的接口
a)path为: /register
b)请求方式为: POST
c)接收username和password参数
d)admin是已注册用户
e)注册成功返回: {code: 0, data: {_id: 'abc', username: ‘xxx’, password:’123’}
    f)注册失败返回: {code: 1, msg: '此用户已存在'}
*/


//注册路由
router.post("/register",function(req,res){
     const {username,password,type}=req.body;
    UserModel.findOne({username},function(err,user){
        if(user){
            res.send({code:1,msg:"此用户已存在"})
        }else{
            new UserModel({username,password:md5(password),type}).save(function(err,user){
              //生成一个cookie（userid:user._id,{maxAge:1000*60*60*24*7}）
               res.cookie("userid",user._id,{maxAge:1000*60*60*24*7})
               res.send({code:0,data:{_id:user._id,username,type}})
            })
        }
    })

});


// 登陆路由
router.post('/login', function (req, res) {
    // 1. 获取请求参数数据(username, password)
    const {username, password} = req.body
    // 2. 处理数据: 根据username和password去数据库查询得到user
    UserModel.findOne({username, password: md5(password)}, filter, function (err, user) {
        // 3. 返回响应数据
        // 3.1. 如果user没有值, 返回一个错误的提示: 用户名或密码错误
        if(!user) {
            res.send({code: 1, msg: '用户名或密码错误'})
        } else {
            // 生成一个cookie(userid: user._id), 并交给浏览器保存
            res.cookie('userid', user._id, {maxAge: 1000*60*60*24*7})
            // 3.2. 如果user有值, 返回user
            res.send({code: 0, data: user}) // user中没有pwd
        }
    })
});


module.exports = router;


