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


//1 注册路由
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

// 2 登陆路由
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

// 3 更新用户路由
router.post('/update', function (req, res) {
  // 得到请求cookie的userid
  const userid = req.cookies.userid
  if(!userid) {// 如果没有, 说明没有登陆, 直接返回提示
    return res.send({code: 1, msg: '请先登陆'});
}

// 更新数据库中对应的数据
UserModel.findByIdAndUpdate({_id: userid}, req.body, function (err, user) {// user是数据库中原来的数据
  const {_id, username, type} = user;
  // node端 ...不可用三点运算符
  // const data = {...req.body, _id, username, type}
  // 合并用户信息
  const data = Object.assign(req.body, {_id, username, type})
  // assign(obj1, obj2, obj3,...) // 将多个指定的对象进行合并, 返回一个合并后的对象
  res.send({code: 0, data})
})
})

// 同步接收用户
const receiveUser = (user) => ({type: RECEIVE_USER, data: user})
// 同步重置用户
export const resetUser = (msg) => ({type: RESET_USER, data: msg})

/*
异步更新用户
 */
export const updateUser = (user) => {
  return async dispatch => {
    // 发送异步ajax请求
    const response = await reqUpdateUser(user)
    const result = response.data
    if (result.code === 0) { // 更新成功
      dispatch(receiveUser(result.data))
    } else { // 失败
      dispatch(resetUser(result.msg))
    }
  }
}

module.exports = router;


